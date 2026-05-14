import { describe, it, expect } from 'vitest';
import { exportBacklogMarkdown } from '@/lib/backlog/export-markdown';
import type { BacklogPageData } from '@/lib/backlog/get-page-data';

describe('exportBacklogMarkdown', () => {
  it('returns minimal markdown for empty backlog', () => {
    const data: BacklogPageData = {
      project: { id: 'p1', name: 'Test', domain: 'test.com' },
      items: [],
      counts: {
        total: 0,
        byPriority: { P0: 0, P1: 0, P2: 0 },
        byStatus: { todo: 0, in_progress: 0, done: 0, discarded: 0 },
        byCategory: {},
      },
    };

    const result = exportBacklogMarkdown(data);

    expect(result).toContain('# Backlog SEO — Test');
    expect(result).toContain('> Domaine : test.com');
    expect(result).toContain('Aucune tâche dans ce backlog.');
  });

  it('generates markdown with P0, P1, P2 sections ordered', () => {
    const data: BacklogPageData = {
      project: { id: 'p1', name: 'Project', domain: 'example.com' },
      items: [
        {
          id: 'i1',
          title: 'P2 Task',
          description: 'Low priority',
          priority: 'P2',
          effort: 'S',
          category: 'content',
          status: 'todo',
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        },
        {
          id: 'i2',
          title: 'P0 Task',
          description: 'Critical',
          priority: 'P0',
          effort: 'XL',
          category: 'technical',
          status: 'todo',
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        },
        {
          id: 'i3',
          title: 'P1 Task',
          description: 'Important',
          priority: 'P1',
          effort: 'M',
          category: 'architecture',
          status: 'todo',
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        },
      ],
      counts: {
        total: 3,
        byPriority: { P0: 1, P1: 1, P2: 1 },
        byStatus: { todo: 3, in_progress: 0, done: 0, discarded: 0 },
        byCategory: { content: 1, technical: 1, architecture: 1 },
      },
    };

    const result = exportBacklogMarkdown(data);

    expect(result).toContain('## P0 — Critique');
    expect(result).toContain('## P1 — Important');
    expect(result).toContain('## P2 — Amélioration');

    const p0Index = result.indexOf('## P0 — Critique');
    const p1Index = result.indexOf('## P1 — Important');
    const p2Index = result.indexOf('## P2 — Amélioration');

    expect(p0Index).toBeLessThan(p1Index);
    expect(p1Index).toBeLessThan(p2Index);
  });

  it('skips empty sections', () => {
    const data: BacklogPageData = {
      project: { id: 'p1', name: 'Project', domain: 'example.com' },
      items: [
        {
          id: 'i1',
          title: 'P1 Only',
          description: 'Only P1',
          priority: 'P1',
          effort: 'M',
          category: 'content',
          status: 'todo',
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        },
      ],
      counts: {
        total: 1,
        byPriority: { P0: 0, P1: 1, P2: 0 },
        byStatus: { todo: 1, in_progress: 0, done: 0, discarded: 0 },
        byCategory: { content: 1 },
      },
    };

    const result = exportBacklogMarkdown(data);

    expect(result).not.toContain('## P0 — Critique');
    expect(result).toContain('## P1 — Important');
    expect(result).not.toContain('## P2 — Amélioration');
  });

  it('includes all optional fields when present', () => {
    const data: BacklogPageData = {
      project: { id: 'p1', name: 'Project', domain: 'example.com' },
      items: [
        {
          id: 'i1',
          title: 'Full Task',
          description: 'Complete task with all fields',
          priority: 'P0',
          effort: 'L',
          category: 'technical',
          status: 'todo',
          acceptanceCriteria: ['AC1', 'AC2'],
          claudePrompt: 'Implement feature X',
          filePathsTargeted: ['src/app.ts', 'src/lib/helper.ts'],
          testsExpected: ['unit test', 'integration test'],
          definitionOfDone: 'All tests pass',
          sourceFinding: {
            id: 'f1',
            rule: 'RULE-001',
            title: 'Missing meta',
            severity: 'critical',
          },
        },
      ],
      counts: {
        total: 1,
        byPriority: { P0: 1, P1: 0, P2: 0 },
        byStatus: { todo: 1, in_progress: 0, done: 0, discarded: 0 },
        byCategory: { technical: 1 },
      },
    };

    const result = exportBacklogMarkdown(data);

    expect(result).toContain('**Fichiers à toucher** :');
    expect(result).toContain('- ' + '`' + 'src/app.ts' + '`');
    expect(result).toContain('- ' + '`' + 'src/lib/helper.ts' + '`');
    expect(result).toContain("**Critères d'acceptation** :");
    expect(result).toContain('- AC1');
    expect(result).toContain('- AC2');
    expect(result).toContain('**Tests attendus** :');
    expect(result).toContain('- unit test');
    expect(result).toContain('**Definition of Done** : All tests pass');
    expect(result).toContain('**Finding source** : RULE-001 — Missing meta');
    expect(result).toContain('**Prompt Claude Code** :');
    expect(result).toContain('```');
    expect(result).toContain('Implement feature X');
  });

  it('skips optional sections when fields are empty', () => {
    const data: BacklogPageData = {
      project: { id: 'p1', name: 'Project', domain: 'example.com' },
      items: [
        {
          id: 'i1',
          title: 'Minimal Task',
          description: 'Basic task',
          priority: 'P1',
          effort: 'XS',
          category: 'content',
          status: 'todo',
          acceptanceCriteria: [],
          claudePrompt: null,
          filePathsTargeted: [],
          testsExpected: [],
          definitionOfDone: null,
          sourceFinding: null,
        },
      ],
      counts: {
        total: 1,
        byPriority: { P0: 0, P1: 1, P2: 0 },
        byStatus: { todo: 1, in_progress: 0, done: 0, discarded: 0 },
        byCategory: { content: 1 },
      },
    };

    const result = exportBacklogMarkdown(data);

    expect(result).not.toContain('**Fichiers à toucher** :');
    expect(result).not.toContain("**Critères d'acceptation** :");
    expect(result).not.toContain('**Tests attendus** :');
    expect(result).not.toContain('**Definition of Done**');
    expect(result).not.toContain('**Finding source**');
    expect(result).not.toContain('**Prompt Claude Code** :');
  });
});
