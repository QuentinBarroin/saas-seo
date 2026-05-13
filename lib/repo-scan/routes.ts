import type { AppRouterRoute } from './types';

/**
 * Détermine le router Next.js d'après les chemins relatifs trouvés au scan.
 * - `app` : présence de fichiers sous `app/**\/page.{ts,tsx,js,jsx}`.
 * - `pages` : présence de fichiers sous `pages/**\/*.{ts,tsx,js,jsx}` (hors api).
 * - `mixed` : les deux.
 * - `none` : aucun des deux.
 */
export function detectRouter(filePaths: string[]): 'app' | 'pages' | 'mixed' | 'none' {
  let hasApp = false;
  let hasPages = false;
  for (const p of filePaths) {
    if (!hasApp && APP_PAGE_RE.test(p)) hasApp = true;
    if (!hasPages && PAGES_ROUTER_RE.test(p)) hasPages = true;
    if (hasApp && hasPages) return 'mixed';
  }
  if (hasApp) return 'app';
  if (hasPages) return 'pages';
  return 'none';
}

const APP_PAGE_RE = /^app\/(.+\/)?page\.(ts|tsx|js|jsx)$/;
const PAGES_ROUTER_RE = /^pages\/(?!api\/)(?!_).+\.(ts|tsx|js|jsx)$/;
const GROUP_SEGMENT_RE = /\([^/]+\)/g;

/**
 * Infère les routes app router depuis les `page.tsx` trouvés.
 * - `app/page.tsx` → `/`
 * - `app/dashboard/page.tsx` → `/dashboard`
 * - `app/(app)/projects/new/page.tsx` → `/projects/new` (group segments retirés)
 * - `app/(marketing)/page.tsx` → `/` (group à la racine)
 * - `app/blog/[slug]/page.tsx` → `/blog/[slug]` (segments dynamiques conservés)
 */
export function inferAppRoutes(filePaths: string[]): AppRouterRoute[] {
  const out: AppRouterRoute[] = [];
  for (const p of filePaths) {
    const m = APP_PAGE_RE.exec(p);
    if (!m) continue;

    const rel = m[1] ?? ''; // "" pour app/page.tsx, "dashboard/" pour app/dashboard/page.tsx
    const segments = rel.split('/').filter((s) => s.length > 0);

    const groupSegment = segments.find((s) => /^\(.+\)$/.test(s)) ?? null;
    const group = groupSegment ? groupSegment.slice(1, -1) : null;

    const routeSegments = segments.filter((s) => !/^\(.+\)$/.test(s));
    const route = routeSegments.length === 0 ? '/' : '/' + routeSegments.join('/');

    out.push({ route, filePath: p, group });
  }
  // Tri stable par route pour des outputs déterministes (golden audits).
  out.sort((a, b) => a.route.localeCompare(b.route) || a.filePath.localeCompare(b.filePath));
  return out;
}

/**
 * Petite utility pour identifier si une route est une "route marketing".
 * MVP : tout ce qui n'est PAS dans un group `(app)`, `(dashboard)`, `(auth)` est considéré marketing.
 * Le caller peut surcharger via une liste de groupes privés explicites.
 */
export function isMarketingRoute(
  route: AppRouterRoute,
  privateGroups: string[] = ['app', 'dashboard', 'auth']
): boolean {
  if (route.group === null) return true; // pas de group → marketing par défaut
  return !privateGroups.includes(route.group);
}

/** Retire les segments de group d'un path POSIX (utile pour debug et formatting). */
export function stripGroupSegments(filePath: string): string {
  return filePath.replace(GROUP_SEGMENT_RE, '').replace(/\/+/g, '/');
}
