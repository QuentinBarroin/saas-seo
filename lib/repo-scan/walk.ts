import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_EXCLUDE = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.vercel',
];

export type WalkOptions = {
  /** Patterns acceptés (matchent l'extension OU le basename). Si vide, accepte tout. */
  acceptExts?: string[];
  /** Noms de dossiers à exclure. */
  exclude?: string[];
  /** Plafond de fichiers retournés. */
  maxFiles?: number;
};

/**
 * Walk récursif d'un dossier. Retourne des chemins **POSIX relatifs** à `root`.
 * S'arrête dès qu'on atteint `maxFiles`. Ignore les `exclude` au niveau dossier.
 */
export async function walk(root: string, opts: WalkOptions = {}): Promise<string[]> {
  const acceptExts = opts.acceptExts;
  const exclude = new Set(opts.exclude ?? DEFAULT_EXCLUDE);
  const maxFiles = opts.maxFiles ?? 5000;

  const results: string[] = [];
  await walkInternal(root, '', { acceptExts, exclude, maxFiles, results });
  return results;
}

type WalkContext = {
  acceptExts?: string[];
  exclude: Set<string>;
  maxFiles: number;
  results: string[];
};

async function walkInternal(absRoot: string, rel: string, ctx: WalkContext): Promise<void> {
  if (ctx.results.length >= ctx.maxFiles) return;

  const abs = rel === '' ? absRoot : path.join(absRoot, rel);
  let entries: string[];
  try {
    entries = await readdir(abs);
  } catch {
    return; // pas lisible → ignoré silencieusement
  }

  for (const entry of entries) {
    if (ctx.results.length >= ctx.maxFiles) return;
    if (ctx.exclude.has(entry)) continue;

    const relEntry = rel === '' ? entry : `${rel}/${entry}`;
    const absEntry = path.join(absRoot, relEntry);

    let st;
    try {
      st = await stat(absEntry);
    } catch {
      continue;
    }

    if (st.isDirectory()) {
      await walkInternal(absRoot, relEntry, ctx);
    } else if (st.isFile()) {
      if (!ctx.acceptExts || matchExt(entry, ctx.acceptExts)) {
        ctx.results.push(relEntry);
      }
    }
  }
}

function matchExt(filename: string, acceptExts: string[]): boolean {
  const lower = filename.toLowerCase();
  for (const ext of acceptExts) {
    if (lower === ext.toLowerCase()) return true; // basename exact (ex: package.json)
    if (lower.endsWith(ext.toLowerCase())) return true; // extension (ex: .tsx)
  }
  return false;
}
