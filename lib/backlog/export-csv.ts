import type { BacklogPageData } from './get-page-data';
import { toCsv } from './csv';

const CSV_HEADERS = [
  'id',
  'title',
  'priority',
  'effort',
  'category',
  'status',
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
 * Les champs multi-valeurs (fichiers, critères, tests) sont aplatis avec
 * un séparateur ` | ` pour rester lisibles dans une seule cellule.
 */
export function exportBacklogCsv(data: BacklogPageData): string {
  const rows = data.items.map((item) => [
    item.id,
    item.title,
    item.priority,
    item.effort,
    item.category,
    item.status,
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
