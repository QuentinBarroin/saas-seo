import type { BacklogItemShape } from './get-page-data';

export type BacklogPrGroup = {
  /** Clé stable : `pr-1`, `pr-2`, … */
  id: string;
  /** Libellé lisible : `PR 1 — lib/scoring`. */
  label: string;
  items: BacklogItemShape[];
};

const PRIORITY_RANK: Record<'P0' | 'P1' | 'P2', number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

/**
 * Regroupe les tâches du backlog en « PR logiques » (L1-18, heuristique sans
 * changement de schéma). Deux tâches qui ciblent au moins un fichier commun
 * sont fusionnées dans la même PR — composantes connexes, fusion transitive.
 * Les tâches sans fichier ciblé retombent sur un regroupement par catégorie.
 */
export function groupByPullRequest(
  items: BacklogItemShape[]
): BacklogPrGroup[] {
  const withFiles = items.filter((i) => i.filePathsTargeted.length > 0);
  const withoutFiles = items.filter((i) => i.filePathsTargeted.length === 0);

  const rawGroups: { items: BacklogItemShape[]; label: string }[] = [];

  // ── Composantes connexes par chevauchement de fichiers (union-find) ──────
  const parent = withFiles.map((_, i) => i);
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[x] !== root) {
      const next = parent[x]!;
      parent[x] = root;
      x = next;
    }
    return root;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const ownerByFile = new Map<string, number>();
  withFiles.forEach((item, idx) => {
    for (const file of item.filePathsTargeted) {
      const owner = ownerByFile.get(file);
      if (owner === undefined) ownerByFile.set(file, idx);
      else union(owner, idx);
    }
  });

  const componentByRoot = new Map<number, BacklogItemShape[]>();
  withFiles.forEach((item, idx) => {
    const root = find(idx);
    const bucket = componentByRoot.get(root) ?? [];
    bucket.push(item);
    componentByRoot.set(root, bucket);
  });
  for (const bucket of componentByRoot.values()) {
    rawGroups.push({ items: bucket, label: deriveFileLabel(bucket) });
  }

  // ── Fallback : tâches sans fichier ciblé, regroupées par catégorie ───────
  const byCategory = new Map<string, BacklogItemShape[]>();
  for (const item of withoutFiles) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }
  for (const [category, bucket] of byCategory) {
    rawGroups.push({ items: bucket, label: `catégorie ${category}` });
  }

  // ── Ordre : priorité la plus haute du groupe, puis taille décroissante ───
  rawGroups.sort(
    (a, b) =>
      bestRank(a.items) - bestRank(b.items) || b.items.length - a.items.length
  );

  return rawGroups.map((group, index) => ({
    id: `pr-${index + 1}`,
    label: `PR ${index + 1} — ${group.label}`,
    items: [...group.items].sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    ),
  }));
}

/** Table tâche → libellé de sa PR, pour les exports plats (CSV, labels). */
export function prLabelByItemId(groups: BacklogPrGroup[]): Map<string, string> {
  const byId = new Map<string, string>();
  for (const group of groups) {
    for (const item of group.items) byId.set(item.id, group.label);
  }
  return byId;
}

function bestRank(items: BacklogItemShape[]): number {
  return items.reduce(
    (best, item) => Math.min(best, PRIORITY_RANK[item.priority]),
    PRIORITY_RANK.P2
  );
}

function deriveFileLabel(items: BacklogItemShape[]): string {
  const prefix = longestCommonPathPrefix(
    items.flatMap((i) => i.filePathsTargeted)
  );
  return prefix || `catégorie ${dominantCategory(items)}`;
}

/** Plus long préfixe de chemin commun, jamais terminé sur un nom de fichier. */
function longestCommonPathPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  const segmented = paths.map((p) => p.split('/'));
  const first = segmented[0]!;
  let commonLength = first.length;
  for (const segments of segmented) {
    let i = 0;
    while (i < commonLength && i < segments.length && segments[i] === first[i]) {
      i++;
    }
    commonLength = i;
  }
  let prefix = first.slice(0, commonLength);
  while (prefix.length > 0 && prefix[prefix.length - 1]!.includes('.')) {
    prefix = prefix.slice(0, -1);
  }
  return prefix.join('/');
}

function dominantCategory(items: BacklogItemShape[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  let best = items[0]?.category ?? 'general';
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
}
