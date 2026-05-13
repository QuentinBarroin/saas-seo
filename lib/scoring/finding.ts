import { getRule, type Rule, type RuleCategory, type Severity } from './rules';

export type FindingDraft = {
  ruleId: string;
  category: RuleCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  recommendation: string;
  /** Pour CODE-010 (Sprint 1) : confiance dans la détection. */
  confidence: 'certain' | 'hypothèse' | 'à vérifier';
};

export function buildFinding(
  ruleId: string,
  evidence: Record<string, unknown>,
  confidence: FindingDraft['confidence'] = 'certain'
): FindingDraft {
  const rule = getRule(ruleId);
  if (!rule) {
    throw new Error(`Unknown ruleId: ${ruleId}`);
  }
  return {
    ruleId: rule.id,
    category: rule.category,
    severity: rule.severity,
    title: rule.title,
    description: rule.description,
    evidence,
    recommendation: renderTemplate(rule.recommendationTemplate, evidence),
    confidence,
  };
}

/** Remplace `{key}` par String(evidence[key]). Inchangé si clé absente. */
export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const v = vars[key];
      return v === null || v === undefined ? '' : String(v);
    }
    return match;
  });
}

/** Re-export pour les détecteurs. */
export type { Rule };
