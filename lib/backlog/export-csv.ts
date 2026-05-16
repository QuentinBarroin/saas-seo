import type { BacklogPageData } from './get-page-data';
import { toCsv } from './csv';
import { groupByPullRequest, prLabelByItemId } from './group-by-pr';

const CSV_HEADERS = [
  'id',
  'title',
  'priority',
  'effort',
  'category',
  'status',
  'prGroup',
  'sourceRule',
  'sourceFindingTitle',
  'description',
  'filePathsTargeted',
  'acceptanceCriteria',
  'testsExpected',
  'definitionOfDone',
  'claudePrompt',
] as const;

/**
 * Export CSV générique (tableur) : une ligne par tâche, tous les champs.
 * La colonne `prGroup` porte le regroupement par PR logique (L1-18). Les
 * champs multi-valeurs (fichiers, critères, tests) sont aplatis avec ` | `.
 */
export function exportBacklogCsv(data: BacklogPageData): string {
  const prLabels = prLabelByItemId(groupByPullRequest(data.items));
  const rows = data.items.map((item) => [
    item.id,
    item.title,
    item.priority,
    item.effort,
    item.category,
    item.status,
    prLabels.get(item.id) ?? '',
    item.sourceFinding?.rule ?? '',
    item.sourceFinding?.title ?? '',
    item.description,
    item.filePathsTargeted.join(' | '),
    item.acceptanceCriteria.join(' | '),
    item.testsExpected.join(' | '),
    item.definitionOfDone ?? '',
    item.claudePrompt ?? '',
  ]);
  return toCsv(CSV_HEADERS, rows);
}
