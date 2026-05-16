import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { scanRepo, isRemoteRepoUrl } from '@/lib/repo-scan';

const FIXTURE = path.resolve(__dirname, '../fixtures/repo-scan/sample-next-app');

describe('repo-scan · isRemoteRepoUrl', () => {
  it('reconnaît les URLs distantes (git / http / ssh)', () => {
    for (const url of [
      'https://github.com/acme/repo.git',
      'http://gitlab.com/acme/repo',
      'git@github.com:acme/repo.git',
      'ssh://git@host/acme/repo',
      'git://host/repo',
    ]) {
      expect(isRemoteRepoUrl(url)).toBe(true);
    }
  });

  it('reconnaît les chemins locaux (Windows / POSIX / relatifs)', () => {
    for (const p of ['C:\\dev\\shooting-pilot', '/home/q/projects/sp', './sp', '../sp']) {
      expect(isRemoteRepoUrl(p)).toBe(false);
    }
  });
});

describe('repo-scan · scanRepo (end-to-end sur fixture)', () => {
  it('détecte un projet Next.js (deps + next.config.ts)', async () => {
    const r = await scanRepo({ path: FIXTURE });
    expect(r.isNextProject).toBe(true);
  });

  it('détecte le router `app` (présence de app/**/page.tsx)', async () => {
    const r = await scanRepo({ path: FIXTURE });
    expect(r.router).toBe('app');
  });

  it('infère 4 routes attendues (home, dashboard, pricing groupé, blog dynamique)', async () => {
    const r = await scanRepo({ path: FIXTURE });
    const routes = r.routes.map((x) => x.route);
    expect(routes).toContain('/');
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/pricing');
    expect(routes).toContain('/blog/[slug]');
  });

  it('expose le group pour les routes groupées', async () => {
    const r = await scanRepo({ path: FIXTURE });
    const pricing = r.routes.find((x) => x.filePath.endsWith('pricing/page.tsx'));
    expect(pricing).toBeDefined();
    expect(pricing!.group).toBe('marketing');
  });

  it('inclut le contenu des fichiers TS/TSX (RepoFile.content)', async () => {
    const r = await scanRepo({ path: FIXTURE });
    const home = r.files.find((f) => f.path === 'app/page.tsx');
    expect(home).toBeDefined();
    expect(home!.content).toContain('Home');
    expect(home!.size).toBe(home!.content.length);
  });

  it('rootPath est absolu et path-normalisé', async () => {
    const r = await scanRepo({ path: FIXTURE });
    expect(path.isAbsolute(r.rootPath)).toBe(true);
  });

  it('chemins des fichiers sont POSIX (forward slashes)', async () => {
    const r = await scanRepo({ path: FIXTURE });
    for (const f of r.files) {
      expect(f.path, f.path).not.toContain('\\');
    }
  });

  it('respecte maxFiles et émet un warning si plafond atteint', async () => {
    const r = await scanRepo({ path: FIXTURE, maxFiles: 2 });
    expect(r.files.length).toBeLessThanOrEqual(2);
    expect(r.warnings.some((w) => w.includes('maxFiles'))).toBe(true);
  });
});
