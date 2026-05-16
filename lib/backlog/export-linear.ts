import type { BacklogPageData } from './get-page-data';
import { toCsv } from './csv';
import { buildBacklogItemBody } from './item-body';

const LINEAR_HEADERS = [
  'Title',
  'Description',
  'Priority',
  'Status',
  'Estimate',
  'Labels',
] as const;

const PRIORITY_TO_LINEAR: Record<'P0' | 'P1' | 'P2', string> = {
  P0: 'Urgent',
  P1: 'High',
  P2: 'Medium',
};

const STATUS_TO_LINEAR: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  discarded: 'Canceled',
};

const EFFORT_TO_ESTIMATE: Record<'XS' | 'S' | 'M' | 'L' | 'XL', string> = {
  XS: '1',
  S: '2',
  M: '3',
  L: '5',
  XL: '8',
};

/**
 * Export CSV au format de l'import natif Linear (colonnes Title / Description /
 * Priority / Status / Estimate / Labels). L'effort est converti en points
 * d'estimation Fibonacci ; les labels Linear sont séparés par virgule dans la
 * cellule (échappée par `toCsv`).
 */
export function exportBacklogLinear(data: BacklogPageData): string {
  const rows = data.items.map((item) => [
    item.title,
    buildBacklogItemBody(item),
    PRIORITY_TO_LINEAR[item.priority],
    STATUS_TO_LINEAR[item.status] ?? 'Todo',
    EFFORT_TO_ESTIMATE[item.effort],
    ['SEO', item.category].join(','),
  ]);
  return toCsv(LINEAR_HEADERS, rows);
}
