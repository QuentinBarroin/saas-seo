import { describe, it, expect } from 'vitest';
import { toCsv } from '@/lib/backlog/csv';
import { exportBacklogCsv } from '@/lib/backlog/export-csv';
import {
  exportBacklogGithub,
  type GithubIssueExport,
} from '@/lib/backlog/export-github';
import { exportBacklogLinear } from '@/lib/backlog/export-linear';
import type {
  BacklogItemShape,
  BacklogPageData,
} from '@/lib/backlog/get-page-data';

function makeItem(overrides: Partial<BacklogItemShape> = {}): BacklogItemShape {
  return {
    id: 'i1',
    title: 'Ajouter une balise title',
    description: 'La page produit n’a pas de balise title.',
    priority: 'P0',
    effort: 'M',
    category: 'technical',
    status: 'todo',
    acceptanceCriteria: ['Title présent', 'Longueur < 60 caractères'],
    claudePrompt: 'Ajoute une balise title à app/page.tsx',
    filePathsTargeted: ['app/page.tsx'],
    testsExpected: ['Test de rendu du title'],
    definitionOfDone: 'Title visible dans le HTML',
    sourceFinding: {
      id: 'f1',
      rule: 'TECH-missing-title',
      title: 'Balise title manquante',
      severity: 'critical',
    },
    ...overrides,
  };
}

function makeData(items: BacklogItemShape[]): BacklogPageData {
  const byPriority = { P0: 0, P1: 0, P2: 0 };
  const byStatus = { todo: 0, in_progress: 0, done: 0, discarded: 0 };
  const byCategory: Record<string, number> = {};
  for (const item of items) {
    byPriority[item.priority]++;
    byStatus[item.status as keyof typeof byStatus]++;
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  }
  return {
    project: { id: 'p1', name: 'Shooting Pilot', domain: 'shootingpilot.com' },
    items,
    counts: { total: items.length, byPriority, byStatus, byCategory },
  };
}

describe('toCsv (RFC 4180)', () => {
  it('joins rows with CRLF and a header line', () => {
    const csv = toCsv(['a', 'b'], [['1', '2']]);
    expect(csv).toBe('a,b\r\n1,2');
  });

  it('quotes cells containing comma, quote or newline', () => {
    const csv = toCsv(
      ['x'],
      [['a,b'], ['say "hi"'], ['line1\nline2']]
    );
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"say ""hi"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it('leaves plain cells unquoted', () => {
    expect(toCsv(['x'], [['plain']])).toBe('x\r\nplain');
  });
});

describe('exportBacklogCsv', () => {
  it('emits a header row and one row per item', () => {
    const csv = exportBacklogCsv(makeData([makeItem(), makeItem({ id: 'i2' })]));
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('id,title,priority,effort,category,status');
    expect(lines).toHaveLength(3);
  });

  it('flattens multi-value fields with a pipe separator', () => {
    const csv = exportBacklogCsv(makeData([makeItem()]));
    expect(csv).toContain('Title présent | Longueur < 60 caractères');
  });

  it('handles empty optional fields without crashing', () => {
    const csv = exportBacklogCsv(
      makeData([
        makeItem({
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        }),
      ])
    );
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('produces an empty body (header only) for an empty backlog', () => {
    expect(exportBacklogCsv(makeData([]))).toBe(
      'id,title,priority,effort,category,status,prGroup,sourceRule,sourceFindingTitle,description,filePathsTargeted,acceptanceCriteria,testsExpected,definitionOfDone,claudePrompt'
    );
  });

  it('renseigne la colonne prGroup (L1-18)', () => {
    const csv = exportBacklogCsv(makeData([makeItem()]));
    expect(csv.split('\r\n')[1]).toContain('PR 1');
  });
});

describe('exportBacklogGithub', () => {
  it('produces valid JSON: array of {title, body, labels}', () => {
    const json = exportBacklogGithub(makeData([makeItem()]));
    const parsed = JSON.parse(json) as GithubIssueExport[];
    expect(parsed).toHaveLength(1);
    const issue = parsed[0]!;
    expect(issue.title).toBe('[P0] Ajouter une balise title');
    expect(issue.labels).toEqual([
      'priority:P0',
      'effort:M',
      'seo:technical',
      'PR 1 — app',
    ]);
    expect(issue.body).toContain('TECH-missing-title');
    expect(issue.body).toContain("**Critères d'acceptation**");
    expect(issue.body).toContain('```');
  });

  it('returns an empty array for an empty backlog', () => {
    expect(JSON.parse(exportBacklogGithub(makeData([])))).toEqual([]);
  });
});

describe('exportBacklogLinear', () => {
  it('maps priority, status and effort to Linear values', () => {
    const csv = exportBacklogLinear(
      makeData([
        makeItem({ priority: 'P0', status: 'todo', effort: 'M' }),
        makeItem({ id: 'i2', priority: 'P1', status: 'in_progress', effort: 'XL' }),
        makeItem({ id: 'i3', priority: 'P2', status: 'done', effort: 'XS' }),
        makeItem({ id: 'i4', priority: 'P2', status: 'discarded', effort: 'S' }),
      ])
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Title,Description,Priority,Status,Estimate,Labels');
    expect(csv).toContain('Urgent');
    expect(csv).toContain('High');
    expect(csv).toContain('Medium');
    expect(csv).toContain('Todo');
    expect(csv).toContain('In Progress');
    expect(csv).toContain('Done');
    expect(csv).toContain('Canceled');
  });

  it('converts effort to a Fibonacci estimate', () => {
    const csv = exportBacklogLinear(
      makeData([makeItem({ effort: 'L' })])
    );
    // colonne Estimate = 5 pour un effort L
    expect(csv.split('\r\n')[1]).toContain(',5,');
  });

  it('joins labels with a comma inside a quoted cell', () => {
    const csv = exportBacklogLinear(makeData([makeItem()]));
    expect(csv).toContain('"SEO,technical,PR 1 — app"');
  });
});
