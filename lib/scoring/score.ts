import {
  CATEGORY_WEIGHTS,
  SEVERITY_WEIGHTS,
  type RuleCategory,
  type Severity,
} from './rules';
import type { FindingDraft } from './finding';

export type CategoryScores = Record<RuleCategory, number>;

export type ScoreBreakdown = {
  perCategory: CategoryScores;
  global: number;
  findingsCount: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByCategory: Record<RuleCategory, number>;
};

/**
 * Calcule un score 0-100 par axe à partir des findings :
 *   score = clamp(100 + Σ SEVERITY_WEIGHTS[finding.severity], 0..100)
 *
 * SEVERITY_WEIGHTS = { critical: -25, high: -10, medium: -3, low: -1 } (cf. rules.ts).
 * Le score global est la moyenne pondérée par CATEGORY_WEIGHTS (somme = 100).
 */
export function computeScore(findings: FindingDraft[]): ScoreBreakdown {
  const perCategory: CategoryScores = {
    technical: 100,
    content: 100,
    architecture: 100,
    conversion: 100,
    geo: 100,
  };
  const findingsByCategory: Record<RuleCategory, number> = {
    technical: 0,
    content: 0,
    architecture: 0,
    conversion: 0,
    geo: 0,
  };
  const findingsBySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const f of findings) {
    perCategory[f.category] = perCategory[f.category] + SEVERITY_WEIGHTS[f.severity];
    findingsByCategory[f.category] += 1;
    findingsBySeverity[f.severity] += 1;
  }

  for (const cat of Object.keys(perCategory) as RuleCategory[]) {
    perCategory[cat] = clamp(perCategory[cat], 0, 100);
  }

  const global = computeGlobal(perCategory);

  return {
    perCategory,
    global,
    findingsCount: findings.length,
    findingsBySeverity,
    findingsByCategory,
  };
}

function computeGlobal(perCategory: CategoryScores): number {
  const totalWeight = (Object.values(CATEGORY_WEIGHTS) as number[]).reduce((a, b) => a + b, 0);
  let weighted = 0;
  for (const cat of Object.keys(perCategory) as RuleCategory[]) {
    weighted += perCategory[cat] * CATEGORY_WEIGHTS[cat];
  }
  return Math.round((weighted / totalWeight) * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
