import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanRepo } from '@/lib/repo-scan';
import { detectFromRepo } from '@/lib/scoring/detectors/repo';

const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/repo-scan/sample-next-app');

describe('detectors/repo', () => {
  it('fixture sample-next-app déclenche les attendus CODE-*', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const findings = detectFromRepo(scan);

    const ids = findings.map((f) => f.ruleId);

    expect(ids).toContain('CODE-missing-sitemap-ts');
    expect(ids).toContain('CODE-missing-robots-ts');

    expect(ids).toContain('CODE-images-unoptimized');
    const imgUnopt = findings.find((f) => f.ruleId === 'CODE-images-unoptimized');
    expect(imgUnopt!.evidence.filePath).toBe('next.config.ts');
    expect(imgUnopt!.evidence.line).toBe(4);

    expect(ids).toContain('CODE-missing-metadata');
    const missingMetaFindings = findings.filter((f) => f.ruleId === 'CODE-missing-metadata');
    expect(missingMetaFindings.length).toBe(2);
    const pricingMeta = missingMetaFindings.find((f) => String(f.evidence.filePath).includes('pricing'));
    const dashboardMeta = missingMetaFindings.find((f) => String(f.evidence.filePath).includes('dashboard'));
    expect(pricingMeta).toBeDefined();
    expect(dashboardMeta).toBeDefined();

    expect(ids).toContain('CODE-use-client-on-marketing-route');
    const useClient = findings.find((f) => f.ruleId === 'CODE-use-client-on-marketing-route');
    expect(useClient!.evidence.filePath).toMatch(/dashboard\/page\.tsx/);
    expect(useClient!.evidence.line).toBe(1);

    expect(ids).toContain('CODE-img-instead-of-next-image');
    const imgTag = findings.find((f) => f.ruleId === 'CODE-img-instead-of-next-image');
    expect(imgTag!.evidence.filePath).toMatch(/pricing\/page\.tsx/);
    expect(imgTag!.evidence.count).toBeGreaterThan(0);

    expect(ids).not.toContain('CODE-missing-jsonld');
  });

  it('repo sans route marketing → seuls les site-level et jsonld', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const scanNoMarketing = {
      ...scan,
      routes: [],
    };
    const findings = detectFromRepo(scanNoMarketing);

    const ids = findings.map((f) => f.ruleId);
    expect(ids).toContain('CODE-missing-sitemap-ts');
    expect(ids).toContain('CODE-missing-robots-ts');
    expect(ids).toContain('CODE-images-unoptimized');

    expect(ids).not.toContain('CODE-missing-metadata');
    expect(ids).not.toContain('CODE-use-client-on-marketing-route');
    expect(ids).not.toContain('CODE-img-instead-of-next-image');
  });

  it('avec scan limité via privateRouteGroups, skip pricing qui est dans group marketing', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const findingsNormal = detectFromRepo(scan);
    expect(findingsNormal.some((f) => f.ruleId === 'CODE-img-instead-of-next-image')).toBe(true);

    const findingsPrivate = detectFromRepo(scan, { privateRouteGroups: ['app', 'dashboard', 'auth', 'marketing'] });
    const pricingImgFindings = findingsPrivate.filter(
      (f) => f.ruleId === 'CODE-img-instead-of-next-image' && String(f.evidence.filePath).includes('pricing')
    );
    expect(pricingImgFindings.length).toBe(0);

    const dashboardFindings = findingsPrivate.filter(
      (f) => f.ruleId === 'CODE-use-client-on-marketing-route' && String(f.evidence.filePath).includes('dashboard')
    );
    expect(dashboardFindings.length).toBe(1);
  });

  it('chaque finding a tous les champs obligatoires', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const findings = detectFromRepo(scan);

    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.ruleId).toBeTruthy();
      expect(f.category).toBeTruthy();
      expect(f.severity).toMatch(/^(critical|high|medium|low)$/);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(f.recommendation.length).toBeGreaterThan(20);
      expect(f.confidence).toMatch(/^(certain|hypothèse|à vérifier)$/);
    }
  });

  it('confidence cohérente : certain pour tous sauf CODE-missing-jsonld', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const findings = detectFromRepo(scan);
    for (const f of findings) {
      if (f.ruleId === 'CODE-missing-jsonld') {
        expect(f.confidence).toBe('à vérifier');
      } else {
        expect(f.confidence).toBe('certain');
      }
    }
  });

  it('CODE-missing-jsonld négatif : fixture a du JSON-LD → pas de finding', async () => {
    const scan = await scanRepo({ path: FIXTURE_PATH });
    const findings = detectFromRepo(scan);
    expect(findings.some((f) => f.ruleId === 'CODE-missing-jsonld')).toBe(false);
  });
});
