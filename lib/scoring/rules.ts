export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type RuleCategory = 'technical' | 'content' | 'architecture' | 'conversion' | 'geo';
export type Detector = 'crawler' | 'repo-scan';

export interface Rule {
  id: string;
  category: RuleCategory;
  severity: Severity;
  title: string;
  description: string;
  detector: Detector;
  recommendationTemplate: string;
}

/**
 * Catalogue de règles SEO/GEO.
 * À enrichir par l'agent SEO-Data en Sprint 1 (S1-01).
 * Voir docs/WORKFLOWS/add-feature.md et la base Obsidian 05_agents/agent-seo-data.md.
 */
export const rules: Rule[] = [
  // Sprint 1 : remplir avec ≥ 10 règles TECH-* et CODE-*.
];
