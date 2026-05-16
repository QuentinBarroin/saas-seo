import type { BacklogPageData } from './get-page-data';
import { buildBacklogItemBody } from './item-body';

export type GithubIssueExport = {
  title: string;
  body: string;
  labels: string[];
};

/**
 * Export GitHub Issues : tableau JSON `{ title, body, labels }` prêt à être
 * envoyé à l'API REST GitHub (`POST /repos/{owner}/{repo}/issues`) ou consommé
 * par un script `gh issue create`. Le SaaS ne pousse rien lui-même — pas de
 * credentials GitHub stockés en MVP ; l'utilisateur importe le fichier.
 */
export function exportBacklogGithub(data: BacklogPageData): string {
  const issues: GithubIssueExport[] = data.items.map((item) => ({
    title: `[${item.priority}] ${item.title}`,
    body: buildBacklogItemBody(item),
    labels: [
      `priority:${item.priority}`,
      `effort:${item.effort}`,
      `seo:${item.category}`,
    ],
  }));
  return JSON.stringify(issues, null, 2);
}
