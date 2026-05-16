import type { BacklogPageData, BacklogItemShape } from './get-page-data';
import { groupByPullRequest } from './group-by-pr';

export function exportBacklogMarkdown(data: BacklogPageData): string {
  const lines: string[] = [];

  lines.push(`# Backlog SEO — ${data.project.name}`);
  lines.push('');
  lines.push(`> Domaine : ${data.project.domain}`);
  lines.push(
    `> Total : ${data.counts.total} tâches (${data.counts.byPriority.P0} P0 · ${data.counts.byPriority.P1} P1 · ${data.counts.byPriority.P2} P2)`
  );
  lines.push(
    `> Statut : ${data.counts.byStatus.todo} todo · ${data.counts.byStatus.in_progress} en cours · ${data.counts.byStatus.done} done · ${data.counts.byStatus.discarded} rejetées`
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  if (data.items.length === 0) {
    lines.push('Aucune tâche dans ce backlog.');
    return lines.join('\n');
  }

  // L1-18 : le backlog est organisé par PR logique plutôt que par priorité —
  // chaque section regroupe les tâches à exécuter ensemble dans une même PR.
  for (const group of groupByPullRequest(data.items)) {
    const p0 = group.items.filter((i) => i.priority === 'P0').length;
    const p1 = group.items.filter((i) => i.priority === 'P1').length;
    const p2 = group.items.filter((i) => i.priority === 'P2').length;

    lines.push(`## ${group.label}`);
    lines.push('');
    lines.push(
      `> ${group.items.length} tâche(s) · ${p0} P0 · ${p1} P1 · ${p2} P2`
    );
    lines.push('');

    for (const item of group.items) {
      appendItem(lines, item);
    }
  }

  return lines.join('\n');
}

function appendItem(lines: string[], item: BacklogItemShape): void {
  lines.push(`### [${item.priority}] [${item.effort}] ${item.title}`);
  lines.push('');
  lines.push(`**Catégorie** : ${item.category}`);
  lines.push(`**Statut** : ${item.status}`);

  if (item.sourceFinding) {
    lines.push(
      `**Finding source** : ${item.sourceFinding.rule} — ${item.sourceFinding.title}`
    );
  }

  lines.push('');
  lines.push(item.description);
  lines.push('');

  if (item.filePathsTargeted.length > 0) {
    lines.push('**Fichiers à toucher** :');
    for (const filePath of item.filePathsTargeted) {
      lines.push('- `' + filePath + '`');
    }
    lines.push('');
  }

  if (item.acceptanceCriteria.length > 0) {
    lines.push("**Critères d'acceptation** :");
    for (const criterion of item.acceptanceCriteria) {
      lines.push(`- ${criterion}`);
    }
    lines.push('');
  }

  if (item.testsExpected.length > 0) {
    lines.push('**Tests attendus** :');
    for (const test of item.testsExpected) {
      lines.push(`- ${test}`);
    }
    lines.push('');
  }

  if (item.definitionOfDone) {
    lines.push(`**Definition of Done** : ${item.definitionOfDone}`);
    lines.push('');
  }

  if (item.claudePrompt) {
    lines.push('**Prompt Claude Code** :');
    lines.push('');
    lines.push('```');
    lines.push(item.claudePrompt);
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
}
