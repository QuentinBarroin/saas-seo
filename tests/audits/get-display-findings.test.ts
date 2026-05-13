import { describe, expect, it } from 'vitest';
import {
  mapDbFindingToDraft,
  type DbFindingForDisplay,
} from '@/lib/audits/get-display-findings';

function dbFinding(overrides: Partial<DbFindingForDisplay> = {}): DbFindingForDisplay {
  return {
    rule: 'TECH-missing-title',
    category: 'content',
    severity: 'high',
    title: 'Title absent ou vide',
    description: 'Description test.',
    pageUrl: null,
    filePath: null,
    evidence: {},
    ...overrides,
  };
}

describe('mapDbFindingToDraft', () => {
  it("réhydrate recommendation et confidence depuis evidence", () => {
    const f = mapDbFindingToDraft(
      dbFinding({
        evidence: {
          h1Count: 0,
          recommendation: 'Ajouter un title de 50-60 caractères.',
          confidence: 'hypothèse',
        },
      })
    );
    expect(f.recommendation).toBe('Ajouter un title de 50-60 caractères.');
    expect(f.confidence).toBe('hypothèse');
    expect(f.evidence.h1Count).toBe(0);
    // recommendation et confidence doivent être retirés du blob evidence
    expect((f.evidence as Record<string, unknown>).recommendation).toBeUndefined();
    expect((f.evidence as Record<string, unknown>).confidence).toBeUndefined();
  });

  it("fallback recommendation = description quand absente", () => {
    const f = mapDbFindingToDraft(dbFinding({ description: 'desc-fallback', evidence: {} }));
    expect(f.recommendation).toBe('desc-fallback');
  });

  it("confidence par défaut = 'certain' si valeur invalide", () => {
    const f = mapDbFindingToDraft(dbFinding({ evidence: { confidence: 'random' } }));
    expect(f.confidence).toBe('certain');
  });

  it("ré-injecte pageUrl en evidence.url quand présent", () => {
    const f = mapDbFindingToDraft(dbFinding({ pageUrl: 'https://example.com/x' }));
    expect(f.evidence.url).toBe('https://example.com/x');
  });

  it("ré-injecte filePath en evidence.filePath quand présent", () => {
    const f = mapDbFindingToDraft(dbFinding({ filePath: 'app/page.tsx' }));
    expect(f.evidence.filePath).toBe('app/page.tsx');
  });

  it("préserve les autres clés d'evidence (statusCode, line, count, ...)", () => {
    const f = mapDbFindingToDraft(
      dbFinding({
        evidence: { statusCode: 404, line: 42, count: 3, recommendation: 'reco', confidence: 'certain' },
      })
    );
    expect(f.evidence).toMatchObject({ statusCode: 404, line: 42, count: 3 });
  });

  it("preserve ruleId via le champ `rule` DB → `ruleId` UI", () => {
    const f = mapDbFindingToDraft(dbFinding({ rule: 'CODE-images-unoptimized' }));
    expect(f.ruleId).toBe('CODE-images-unoptimized');
  });

  it("cast category / severity (strings DB → enums TS)", () => {
    const f = mapDbFindingToDraft(dbFinding({ category: 'geo', severity: 'medium' }));
    expect(f.category).toBe('geo');
    expect(f.severity).toBe('medium');
  });

  it("evidence null ou non-objet → object vide", () => {
    const f1 = mapDbFindingToDraft(dbFinding({ evidence: null }));
    expect(f1.evidence).toEqual({});
    const f2 = mapDbFindingToDraft(dbFinding({ evidence: 'not-an-object' }));
    expect(f2.evidence).toEqual({});
  });
});
