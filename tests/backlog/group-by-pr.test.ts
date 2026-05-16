import { describe, it, expect } from 'vitest';
import {
  groupByPullRequest,
  prLabelByItemId,
} from '@/lib/backlog/group-by-pr';
import type { BacklogItemShape } from '@/lib/backlog/get-page-data';

function item(
  id: string,
  opts: Partial<BacklogItemShape> = {}
): BacklogItemShape {
  return {
    id,
    title: `Tâche ${id}`,
    description: 'desc',
    priority: 'P1',
    effort: 'M',
    category: 'technical',
    status: 'todo',
    acceptanceCriteria: [],
    claudePrompt: null,
    filePathsTargeted: [],
    testsExpected: [],
    definitionOfDone: null,
    sourceFinding: null,
    ...opts,
  };
}

describe('groupByPullRequest', () => {
  it('regroupe deux tâches partageant un fichier', () => {
    const groups = groupByPullRequest([
      item('a', { filePathsTargeted: ['lib/scoring/rules.ts'] }),
      item('b', {
        filePathsTargeted: ['lib/scoring/rules.ts', 'lib/scoring/score.ts'],
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.items.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });

  it('fusionne transitivement (A-B partagent f1, B-C partagent f2)', () => {
    const groups = groupByPullRequest([
      item('a', { filePathsTargeted: ['f1.ts'] }),
      item('b', { filePathsTargeted: ['f1.ts', 'f2.ts'] }),
      item('c', { filePathsTargeted: ['f2.ts'] }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.items).toHaveLength(3);
  });

  it('sépare les tâches aux fichiers disjoints', () => {
    const groups = groupByPullRequest([
      item('a', { filePathsTargeted: ['app/page.tsx'] }),
      item('b', { filePathsTargeted: ['lib/db.ts'] }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('regroupe par catégorie les tâches sans fichier ciblé', () => {
    const groups = groupByPullRequest([
      item('a', { category: 'technical' }),
      item('b', { category: 'technical' }),
      item('c', { category: 'content' }),
    ]);
    expect(groups).toHaveLength(2);
    const technical = groups.find((g) => g.items.length === 2);
    expect(technical?.items.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });

  it('dérive le libellé du préfixe de chemin commun', () => {
    const groups = groupByPullRequest([
      item('a', { filePathsTargeted: ['lib/scoring/rules.ts'] }),
      item('b', { filePathsTargeted: ['lib/scoring/score.ts'] }),
    ]);
    expect(groups[0]!.label).toContain('lib/scoring');
  });

  it('ordonne les PR par priorité la plus haute', () => {
    const groups = groupByPullRequest([
      item('low', { filePathsTargeted: ['a.ts'], priority: 'P2' }),
      item('high', { filePathsTargeted: ['b.ts'], priority: 'P0' }),
    ]);
    expect(groups[0]!.id).toBe('pr-1');
    expect(groups[0]!.items[0]!.id).toBe('high');
  });

  it('retourne [] pour un backlog vide', () => {
    expect(groupByPullRequest([])).toEqual([]);
  });
});

describe('prLabelByItemId', () => {
  it('associe chaque tâche au libellé de sa PR', () => {
    const groups = groupByPullRequest([
      item('a', { filePathsTargeted: ['lib/x.ts'] }),
      item('b', { filePathsTargeted: ['lib/y.ts'] }),
    ]);
    const labels = prLabelByItemId(groups);
    expect(labels.size).toBe(2);
    const groupOfA = groups.find((g) => g.items.some((i) => i.id === 'a'))!;
    expect(labels.get('a')).toBe(groupOfA.label);
  });
});
