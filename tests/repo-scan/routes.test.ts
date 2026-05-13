import { describe, expect, it } from 'vitest';
import {
  detectRouter,
  inferAppRoutes,
  isMarketingRoute,
  stripGroupSegments,
} from '@/lib/repo-scan/routes';

describe('repo-scan/routes · detectRouter', () => {
  it('app router seul', () => {
    expect(
      detectRouter(['app/page.tsx', 'app/dashboard/page.tsx', 'package.json'])
    ).toBe('app');
  });

  it('pages router seul (hors api et _files)', () => {
    expect(detectRouter(['pages/index.tsx', 'pages/about.tsx', 'pages/_app.tsx'])).toBe(
      'pages'
    );
  });

  it("pages/api/* tout seul ne compte pas comme pages router (les API routes existent aussi en App)", () => {
    expect(detectRouter(['pages/api/hello.ts'])).toBe('none');
  });

  it('détecte mixte (app + pages côte à côte)', () => {
    expect(detectRouter(['app/page.tsx', 'pages/about.tsx'])).toBe('mixed');
  });

  it("`none` si aucun page.* détecté", () => {
    expect(detectRouter(['lib/utils.ts', 'package.json'])).toBe('none');
  });
});

describe('repo-scan/routes · inferAppRoutes', () => {
  it('mappe les fichiers page.tsx vers leur route URL', () => {
    const routes = inferAppRoutes([
      'app/page.tsx',
      'app/dashboard/page.tsx',
      'app/blog/[slug]/page.tsx',
    ]);
    const map = Object.fromEntries(routes.map((r) => [r.route, r.filePath]));
    expect(map['/']).toBe('app/page.tsx');
    expect(map['/dashboard']).toBe('app/dashboard/page.tsx');
    expect(map['/blog/[slug]']).toBe('app/blog/[slug]/page.tsx');
  });

  it('retire les segments de group `(name)` de la route mais conserve le group dans le finding', () => {
    const routes = inferAppRoutes([
      'app/(marketing)/pricing/page.tsx',
      'app/(app)/projects/new/page.tsx',
    ]);
    const pricing = routes.find((r) => r.filePath === 'app/(marketing)/pricing/page.tsx');
    expect(pricing).toBeDefined();
    expect(pricing!.route).toBe('/pricing');
    expect(pricing!.group).toBe('marketing');

    const projectsNew = routes.find((r) => r.filePath === 'app/(app)/projects/new/page.tsx');
    expect(projectsNew!.route).toBe('/projects/new');
    expect(projectsNew!.group).toBe('app');
  });

  it('group à la racine → route `/`', () => {
    const routes = inferAppRoutes(['app/(marketing)/page.tsx']);
    expect(routes[0]!.route).toBe('/');
    expect(routes[0]!.group).toBe('marketing');
  });

  it('ignore les fichiers qui ne sont pas page.{ts,tsx,js,jsx}', () => {
    const routes = inferAppRoutes([
      'app/page.tsx',
      'app/dashboard/layout.tsx',
      'app/dashboard/loading.tsx',
      'app/api/health/route.ts',
    ]);
    expect(routes.map((r) => r.filePath)).toEqual(['app/page.tsx']);
  });

  it('tri stable par route puis filePath', () => {
    const r1 = inferAppRoutes(['app/b/page.tsx', 'app/a/page.tsx']);
    const r2 = inferAppRoutes(['app/a/page.tsx', 'app/b/page.tsx']);
    expect(r1.map((r) => r.route)).toEqual(['/a', '/b']);
    expect(r2.map((r) => r.route)).toEqual(['/a', '/b']);
  });
});

describe('repo-scan/routes · isMarketingRoute', () => {
  const route = (group: string | null) => ({ route: '/x', filePath: 'app/x/page.tsx', group });

  it('pas de group → marketing par défaut', () => {
    expect(isMarketingRoute(route(null))).toBe(true);
  });

  it('groups privés par défaut (app, dashboard, auth) → non marketing', () => {
    expect(isMarketingRoute(route('app'))).toBe(false);
    expect(isMarketingRoute(route('dashboard'))).toBe(false);
    expect(isMarketingRoute(route('auth'))).toBe(false);
  });

  it('autres groups → marketing', () => {
    expect(isMarketingRoute(route('marketing'))).toBe(true);
    expect(isMarketingRoute(route('public'))).toBe(true);
  });

  it('liste privée custom', () => {
    expect(isMarketingRoute(route('console'), ['console'])).toBe(false);
    expect(isMarketingRoute(route('app'), ['console'])).toBe(true);
  });
});

describe('repo-scan/routes · stripGroupSegments', () => {
  it('retire les segments group du path', () => {
    expect(stripGroupSegments('app/(marketing)/pricing/page.tsx')).toBe(
      'app/pricing/page.tsx'
    );
    expect(stripGroupSegments('app/(app)/(internal)/x/page.tsx')).toBe('app/x/page.tsx');
  });
});
