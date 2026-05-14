import { describe, expect, it } from 'vitest';
import {
  CATEGORY_WEIGHTS,
  SEVERITY_WEIGHTS,
  getRule,
  rules,
  rulesByCategory,
  rulesByDetector,
  type Rule,
} from '@/lib/scoring/rules';

const SEVERITIES: Rule['severity'][] = ['critical', 'high', 'medium', 'low'];
const CATEGORIES: Rule['category'][] = [
  'technical',
  'content',
  'architecture',
  'conversion',
  'geo',
];
const DETECTORS: Rule['detector'][] = ['crawler', 'repo-scan', 'architecture'];

const ID_PATTERN = /^(TECH|CODE|GEO|ARCH|CONV)-[a-z0-9-]+$/;

describe('rules · catalogue', () => {
  it('contient au moins 10 règles MVP (DoD S1-01)', () => {
    expect(rules.length).toBeGreaterThanOrEqual(10);
  });

  it('couvre TECH-*, CODE-* et GEO-* (P0 backlog)', () => {
    const prefixes = new Set(rules.map((r) => r.id.split('-')[0]));
    expect(prefixes).toContain('TECH');
    expect(prefixes).toContain('CODE');
    expect(prefixes).toContain('GEO');
  });

  it('IDs uniques', () => {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('IDs au format <PREFIX>-<slug-kebab>', () => {
    for (const rule of rules) {
      expect(rule.id, `Rule ID malformé: ${rule.id}`).toMatch(ID_PATTERN);
    }
  });

  it('severity, category, detector dans les enums autorisés', () => {
    for (const rule of rules) {
      expect(SEVERITIES, rule.id).toContain(rule.severity);
      expect(CATEGORIES, rule.id).toContain(rule.category);
      expect(DETECTORS, rule.id).toContain(rule.detector);
    }
  });

  it('title, description, condition, evidenceTemplate, recommendationTemplate non vides', () => {
    for (const rule of rules) {
      expect(rule.title.trim(), rule.id).not.toBe('');
      expect(rule.description.trim().length, rule.id).toBeGreaterThan(20);
      expect(rule.condition.trim(), rule.id).not.toBe('');
      expect(rule.evidenceTemplate.trim(), rule.id).not.toBe('');
      expect(rule.recommendationTemplate.trim().length, rule.id).toBeGreaterThan(40);
    }
  });

  it('cohérence préfixe ↔ detector', () => {
    for (const rule of rules) {
      const prefix = rule.id.split('-')[0];
      if (prefix === 'TECH' || prefix === 'GEO') {
        expect(rule.detector, rule.id).toBe('crawler');
      } else if (prefix === 'CODE') {
        expect(rule.detector, rule.id).toBe('repo-scan');
      } else if (prefix === 'ARCH') {
        expect(rule.detector, rule.id).toBe('architecture');
      }
    }
  });
});

describe('rules · helpers', () => {
  it('getRule retrouve par id', () => {
    const sample = rules[0]!;
    expect(getRule(sample.id)).toEqual(sample);
    expect(getRule('FAKE-id')).toBeUndefined();
  });

  it('rulesByDetector partitionne le catalogue', () => {
    const crawl = rulesByDetector('crawler');
    const repo = rulesByDetector('repo-scan');
    const arch = rulesByDetector('architecture');
    expect(crawl.length + repo.length + arch.length).toBe(rules.length);
    expect(crawl.every((r) => r.detector === 'crawler')).toBe(true);
    expect(repo.every((r) => r.detector === 'repo-scan')).toBe(true);
    expect(arch.every((r) => r.detector === 'architecture')).toBe(true);
  });

  it('rulesByCategory filtre correctement', () => {
    for (const cat of CATEGORIES) {
      const filtered = rulesByCategory(cat);
      expect(filtered.every((r) => r.category === cat)).toBe(true);
    }
  });
});

describe('rules · pondérations', () => {
  it('SEVERITY_WEIGHTS conforme à la spec SEO-Data (critical -25, high -10, medium -3, low -1)', () => {
    expect(SEVERITY_WEIGHTS.critical).toBe(-25);
    expect(SEVERITY_WEIGHTS.high).toBe(-10);
    expect(SEVERITY_WEIGHTS.medium).toBe(-3);
    expect(SEVERITY_WEIGHTS.low).toBe(-1);
  });

  it('SEVERITY_WEIGHTS toutes négatives', () => {
    for (const sev of SEVERITIES) {
      expect(SEVERITY_WEIGHTS[sev]).toBeLessThan(0);
    }
  });

  it('CATEGORY_WEIGHTS somme à 100', () => {
    const sum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});
