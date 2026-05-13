import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { walk } from '@/lib/repo-scan/walk';

const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/repo-scan/sample-next-app');

describe('repo-scan/walk', () => {
  it('liste tous les fichiers du fixture en chemins POSIX relatifs', async () => {
    const paths = await walk(FIXTURE_ROOT);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(p, p).not.toContain('\\');
      expect(p, p).not.toMatch(/^\//);
    }
  });

  it('filtre sur acceptExts (extensions + basenames)', async () => {
    const tsx = await walk(FIXTURE_ROOT, { acceptExts: ['.tsx'] });
    expect(tsx.every((p) => p.endsWith('.tsx'))).toBe(true);
    expect(tsx.length).toBeGreaterThan(2);

    const pkg = await walk(FIXTURE_ROOT, { acceptExts: ['package.json'] });
    expect(pkg).toEqual(['package.json']);
  });

  it("respecte les dossiers exclus par défaut (node_modules, .next, etc.)", async () => {
    const paths = await walk(FIXTURE_ROOT);
    expect(paths.some((p) => p.startsWith('node_modules/'))).toBe(false);
    expect(paths.some((p) => p.startsWith('.next/'))).toBe(false);
  });

  it('respecte maxFiles', async () => {
    const paths = await walk(FIXTURE_ROOT, { maxFiles: 2 });
    expect(paths).toHaveLength(2);
  });

  it('retourne un array vide sur un chemin inexistant', async () => {
    const paths = await walk(path.join(FIXTURE_ROOT, 'does-not-exist'));
    expect(paths).toEqual([]);
  });
});
