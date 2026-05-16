import path from 'node:path';
import { detectNext, readRepoFile } from './loader';
import { detectRouter, inferAppRoutes } from './routes';
import { walk } from './walk';
import type { RepoFile, ScanOptions, ScanResult } from './types';

const DEFAULT_INCLUDE_EXTS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'next.config.js',
  'next.config.mjs',
];

const DEFAULT_MAX_FILES = 2000;

/**
 * Scan d'un repo Next.js local. Walk + lecture + détection router + inference routes.
 * Pas d'AST parsing ici — les détecteurs CODE-* (S1-05) appellent `lib/repo-scan/ast.ts`
 * sur les fichiers qui les intéressent (lazy).
 */
export async function scanRepo(opts: ScanOptions): Promise<ScanResult> {
  const rootPath = path.resolve(opts.path);
  const warnings: string[] = [];
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;

  const filePaths = await walk(rootPath, {
    acceptExts: opts.include ?? DEFAULT_INCLUDE_EXTS,
    exclude: opts.exclude,
    maxFiles,
  });

  if (filePaths.length >= maxFiles) {
    warnings.push(`Plafond maxFiles=${maxFiles} atteint, certains fichiers ont été ignorés`);
  }

  const files: RepoFile[] = [];
  for (const rel of filePaths) {
    const f = await readRepoFile(rootPath, rel);
    if (f === null) {
      warnings.push(`Fichier illisible ou trop volumineux : ${rel}`);
      continue;
    }
    files.push(f);
  }

  const filePathsRead = files.map((f) => f.path);
  const router = detectRouter(filePathsRead);
  const routes = inferAppRoutes(filePathsRead);

  const nextDetection = await detectNext(rootPath);
  const hasNextConfig = filePathsRead.some((p) => /^next\.config\.(ts|js|mjs)$/.test(p));
  const isNextProject = nextDetection.hasNextDep || hasNextConfig;

  return {
    rootPath,
    files,
    isNextProject,
    router,
    routes,
    warnings,
  };
}

/**
 * Vrai si `repoUrl` est une URL distante (git/http) plutôt qu'un chemin local.
 * Le scan repo (ADR-013) ne traite en MVP que les chemins locaux ; le clone
 * d'un repo distant (auth PAT, cf. Q-009) est reporté en Lot 1.
 */
export function isRemoteRepoUrl(repoUrl: string): boolean {
  return /^(https?:|git@|ssh:|git:)/i.test(repoUrl.trim());
}

export type { ScanOptions, ScanResult, RepoFile, AppRouterRoute } from './types';
