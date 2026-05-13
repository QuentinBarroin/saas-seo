import { describe, expect, it } from 'vitest';
import { computeScore } from '@/lib/scoring/score';
import type { FindingDraft } from '@/lib/scoring/finding';

function f(
  category: FindingDraft['category'],
  severity: FindingDraft['severity']
): FindingDraft {
  return {
    ruleId: 'FAKE-test',
    category,
    severity,
    title: 't',
    description: 'd',
    evidence: {},
    recommendation: 'r',
    confidence: 'certain',
  };
}

describe('scoring · computeScore', () => {
  it('aucun finding → 100/100 partout, global 100', () => {
    const s = computeScore([]);
    expect(s.perCategory.technical).toBe(100);
    expect(s.perCategory.content).toBe(100);
    expect(s.perCategory.architecture).toBe(100);
    expect(s.perCategory.conversion).toBe(100);
    expect(s.perCategory.geo).toBe(100);
    expect(s.global).toBe(100);
    expect(s.findingsCount).toBe(0);
  });

  it('applique SEVERITY_WEIGHTS sur la catégorie ciblée', () => {
    const s = computeScore([f('technical', 'critical')]);
    expect(s.perCategory.technical).toBe(75); // 100 - 25
    expect(s.perCategory.content).toBe(100); // intouchée
  });

  it('accumule plusieurs findings sur la même catégorie', () => {
    const s = computeScore([
      f('technical', 'critical'), // -25
      f('technical', 'high'), // -10
      f('technical', 'medium'), // -3
      f('technical', 'low'), // -1
    ]);
    expect(s.perCategory.technical).toBe(61);
  });

  it('cap à 0 si trop de findings (pas de score négatif)', () => {
    const findings: FindingDraft[] = [];
    for (let i = 0; i < 10; i++) findings.push(f('technical', 'critical'));
    const s = computeScore(findings);
    expect(s.perCategory.technical).toBe(0);
  });

  it('global = moyenne pondérée par CATEGORY_WEIGHTS', () => {
    // technical=80 (1 critical -20→? attendons 1 high -10), content=100, archi=100, conv=100, geo=100
    const s = computeScore([f('technical', 'high')]); // technical → 90
    // weighted = 90*35 + 100*25 + 100*20 + 100*10 + 100*10 = 3150 + 2500 + 2000 + 1000 + 1000 = 9650
    // global = 9650 / 100 = 96.5
    expect(s.perCategory.technical).toBe(90);
    expect(s.global).toBe(96.5);
  });

  it('agrège findingsByCategory et findingsBySeverity', () => {
    const findings: FindingDraft[] = [
      f('technical', 'critical'),
      f('technical', 'high'),
      f('content', 'medium'),
      f('geo', 'medium'),
      f('geo', 'low'),
    ];
    const s = computeScore(findings);
    expect(s.findingsCount).toBe(5);
    expect(s.findingsByCategory.technical).toBe(2);
    expect(s.findingsByCategory.content).toBe(1);
    expect(s.findingsByCategory.geo).toBe(2);
    expect(s.findingsBySeverity.critical).toBe(1);
    expect(s.findingsBySeverity.high).toBe(1);
    expect(s.findingsBySeverity.medium).toBe(2);
    expect(s.findingsBySeverity.low).toBe(1);
  });

  it('global reste dans 0..100 même si tout est nul', () => {
    const findings: FindingDraft[] = [];
    for (const cat of ['technical', 'content', 'architecture', 'conversion', 'geo'] as const) {
      for (let i = 0; i < 10; i++) findings.push(f(cat, 'critical'));
    }
    const s = computeScore(findings);
    expect(s.global).toBe(0);
  });

  it('global est déterministe (même input → même output)', () => {
    const findings = [f('technical', 'high'), f('content', 'medium')];
    expect(computeScore(findings).global).toBe(computeScore(findings).global);
  });
});
