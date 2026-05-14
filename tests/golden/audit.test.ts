import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { crawl } from '@/lib/crawler';
import type { CrawlResult } from '@/lib/crawler';
import { detectFromCrawl } from '@/lib/scoring/detectors/crawler';
import { detectGeo } from '@/lib/scoring/detectors/geo';
import { detectConversion } from '@/lib/scoring/detectors/conversion';
import { computeScore, type ScoreBreakdown } from '@/lib/scoring/score';
import type { FindingDraft } from '@/lib/scoring/finding';
import { GOLDEN_ORIGIN, goldenFetcher } from './golden-site-fixture';

const SNAPSHOT_PATH = path.resolve(__dirname, '../fixtures/golden-shooting-pilot-v1.json');
const WRITE_MODE = process.env.GOLDEN_WRITE === '1';

/**
 * S1-12 — Golden audit (filename historique "shooting-pilot-v1" du backlog).
 *
 * Le fixture est synthétique (cf. golden-site-fixture.ts) et NON un site live,
 * pour rester déterministe entre runs.
 *
 * Pour régénérer après changement intentionnel des règles / scoring :
 *   GOLDEN_WRITE=1 pnpm test tests/golden
 * Puis reviewer le diff sur `golden-shooting-pilot-v1.json` AVANT commit.
 */
describe('golden audit · v1', () => {
  it('reproduit le snapshot committed (sinon: changement détecté, à justifier)', async () => {
    const result = await crawl({
      domain: `${GOLDEN_ORIGIN}/`,
      fetcher: goldenFetcher,
      respectRobots: false,
      maxPages: 20,
      rateLimitMs: 0,
    });

    const crawlerFindings = detectFromCrawl(result);
    const geoFindings = detectGeo(result, { projectType: 'saas' });
    const conversionFindings = detectConversion(result);
    const findings = [...crawlerFindings, ...geoFindings, ...conversionFindings];
    const score = computeScore(findings);

    const snapshot = serializeGolden(result, findings, score);

    if (WRITE_MODE) {
      await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8');
      console.log(`[golden] snapshot écrit dans ${SNAPSHOT_PATH}`);
      return;
    }

    const raw = await readSnapshotOrFail();
    const expected = JSON.parse(raw);
    expect(snapshot).toEqual(expected);
  });
});

type GoldenSnapshot = {
  version: 'v1';
  fixture: 'golden-site';
  meta: {
    pagesCrawled: number;
    sitemapStatus: number | null;
    robotsStatus: number | null;
    skippedByRobots: number;
  };
  score: {
    global: number;
    perCategory: ScoreBreakdown['perCategory'];
  };
  findingsCount: number;
  findingsBySeverity: ScoreBreakdown['findingsBySeverity'];
  findingsByCategory: ScoreBreakdown['findingsByCategory'];
  findings: Array<{
    ruleId: string;
    severity: FindingDraft['severity'];
    category: FindingDraft['category'];
    confidence: FindingDraft['confidence'];
    ref: string;
  }>;
};

function serializeGolden(
  crawlResult: CrawlResult,
  findings: FindingDraft[],
  score: ScoreBreakdown
): GoldenSnapshot {
  return {
    version: 'v1',
    fixture: 'golden-site',
    meta: {
      pagesCrawled: crawlResult.pages.length,
      sitemapStatus: crawlResult.sitemap.status,
      robotsStatus: crawlResult.robots.status,
      skippedByRobots: crawlResult.skippedByRobots.length,
    },
    score: { global: score.global, perCategory: score.perCategory },
    findingsCount: score.findingsCount,
    findingsBySeverity: score.findingsBySeverity,
    findingsByCategory: score.findingsByCategory,
    findings: findings
      .map((f) => ({
        ruleId: f.ruleId,
        severity: f.severity,
        category: f.category,
        confidence: f.confidence,
        ref: refOf(f),
      }))
      .sort(
        (a, b) => a.ruleId.localeCompare(b.ruleId) || a.ref.localeCompare(b.ref)
      ),
  };
}

function refOf(f: FindingDraft): string {
  const url = f.evidence['url'];
  const filePath = f.evidence['filePath'];
  if (typeof url === 'string') return url;
  if (typeof filePath === 'string') return filePath;
  return '(site-level)';
}

async function readSnapshotOrFail(): Promise<string> {
  try {
    return await fs.readFile(SNAPSHOT_PATH, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new Error(
        `Snapshot golden introuvable à ${SNAPSHOT_PATH}.\n` +
          `Génère-le une première fois : GOLDEN_WRITE=1 pnpm test tests/golden`
      );
    }
    throw err;
  }
}
