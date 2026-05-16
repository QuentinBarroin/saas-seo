import type { BacklogItemShape } from './get-page-data';

/**
 * Corps Markdown d'une tâche backlog, partagé par les exports GitHub Issues et
 * Linear — les deux acceptent du Markdown dans le corps / la description d'un
 * ticket. L'export Markdown global (`export-markdown.ts`) garde son propre
 * rendu, regroupé par priorité.
 */
export function buildBacklogItemBody(item: BacklogItemShape): string {
  const lines: string[] = [];

  if (item.sourceFinding) {
    lines.push(
      `**Finding source** : \`${item.sourceFinding.rule}\` — ${item.sourceFinding.title}`,
      ''
    );
  }

  lines.push(item.description, '');

  if (item.filePathsTargeted.length > 0) {
    lines.push('**Fichiers à toucher**');
    for (const filePath of item.filePathsTargeted) {
      lines.push('- `' + filePath + '`');
    }
    lines.push('');
  }

  if (item.acceptanceCriteria.length > 0) {
    lines.push("**Critères d'acceptation**");
    for (const criterion of item.acceptanceCriteria) {
      lines.push(`- [ ] ${criterion}`);
    }
    lines.push('');
  }

  if (item.testsExpected.length > 0) {
    lines.push('**Tests attendus**');
    for (const test of item.testsExpected) {
      lines.push(`- [ ] ${test}`);
    }
    lines.push('');
  }

  if (item.definitionOfDone) {
    lines.push(`**Definition of Done** : ${item.definitionOfDone}`, '');
  }

  if (item.claudePrompt) {
    lines.push(
      '**Prompt Claude Code**',
      '',
      '```',
      item.claudePrompt,
      '```',
      ''
    );
  }

  return lines.join('\n').trimEnd();
}
