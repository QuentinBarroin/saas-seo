import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RepoFile } from './types';

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB par fichier (les pages Next.js dépassent rarement 50 KB)

/** Lit un fichier UTF-8 et retourne un RepoFile, ou null si trop gros / illisible. */
export async function readRepoFile(rootPath: string, relPath: string): Promise<RepoFile | null> {
  const abs = path.join(rootPath, relPath);
  try {
    const content = await readFile(abs, 'utf-8');
    if (content.length > MAX_FILE_BYTES) return null;
    return { path: relPath, content, size: content.length };
  } catch {
    return null;
  }
}

export type NextDetection = {
  /** `next` est dans package.json deps ou devDeps. */
  hasNextDep: boolean;
  /** Version inférée (string brute, ex: "^15.1.0" ou null). */
  nextVersion: string | null;
  /** package.json a été trouvé et parsé sans erreur. */
  hasPackageJson: boolean;
};

/**
 * Lit `package.json` à la racine et détecte la présence de Next.js.
 * Toléré : pas de package.json (retourne { false, null, false }).
 */
export async function detectNext(rootPath: string): Promise<NextDetection> {
  const pkgPath = path.join(rootPath, 'package.json');
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf-8');
  } catch {
    return { hasNextDep: false, nextVersion: null, hasPackageJson: false };
  }

  let pkg: unknown;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return { hasNextDep: false, nextVersion: null, hasPackageJson: true };
  }

  if (typeof pkg !== 'object' || pkg === null) {
    return { hasNextDep: false, nextVersion: null, hasPackageJson: true };
  }

  const obj = pkg as Record<string, unknown>;
  const deps = isStringRecord(obj.dependencies) ? obj.dependencies : {};
  const devDeps = isStringRecord(obj.devDependencies) ? obj.devDependencies : {};
  const next = deps.next ?? devDeps.next ?? null;
  return {
    hasNextDep: typeof next === 'string',
    nextVersion: typeof next === 'string' ? next : null,
    hasPackageJson: true,
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null) return false;
  for (const v of Object.values(value)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}
