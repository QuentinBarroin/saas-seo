import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { crawl } from '@/lib/crawler';
import type { CrawlResult } from '@/lib/crawler';
import { detectFromCrawl } from '@/lib/scoring/detectors/crawler';
import { detectGeo } from '@/lib/scoring/detectors/geo';
import { detectConversion } from '@/lib/scoring/detectors/conversion';
import { detectArchitecture } from '@/lib/scoring/detectors/architecture';
import { computeScore } from '@/lib/scoring/score';
import {
  appendAuditLog,
  failAudit,
  finalizeAudit,
  markAuditRunning,
  replaceFindings,
} from '@/lib/audits/persist';
import { getDataForSeoCredentials, getGscIntegration } from '@/lib/projects/integrations';
import { fetchSerpLive } from '@/lib/connectors/dataforseo';
import { refreshAccessToken, querySearchAnalytics } from '@/lib/connectors/gsc';
import {
  runGscImport,
  computeGscDateRange,
  mapGscRows,
  GSC_DIMENSIONS,
} from '@/lib/gsc/import-step';
import { replaceGscStats } from '@/lib/audits/persist-gsc';
import { runSerpStep } from '@/lib/serp/run-step';
import { replaceSerpForAudit } from '@/lib/audits/persist-serp';
import { detectCompetitorsFromSerp } from '@/lib/competitors/detect-from-serp';
import { generateContentGapRecommendations } from '@/lib/content-gap/generate-recommendations';
import { generateBacklog } from '@/lib/backlog/generate';
import { replaceBacklogForAudit } from '@/lib/audits/persist-backlog';
import { inngest } from '../client';

function mapMarket(market: string): { locationCode: number; languageCode: string } {
  if (market === 'FR') return { locationCode: 2250, languageCode: 'fr' };
  return { locationCode: 2250, languageCode: 'fr' };
}

/**
 * Job d'audit principal (S1-07 + S2-11). Orchestre :
 *  init → crawl → findings-* → serp → competitors-detection → content-gap
 *  → persist-findings → score → backlog-generation → finalize.
 *
 * **MVP scope** : crawler-only. La step `repo-scan` (S1-05) consomme un chemin
 * local sur la machine de l'auditeur — pas adapté à un exécution Inngest cloud
 * sans clone shallow temporaire (à venir en Lot 1). Le user déclenche le
 * repo-scan séparément via une autre route (à venir) qui ré-utilise les mêmes
 * persisteurs.
 *
 * **Idempotence** : chaque step est isolée via `step.run` (retry safe).
 * `replaceFindings` fait DELETE-then-INSERT par auditId → rejouer la finalisation
 * n'introduit pas de doublons. Step `serp` (S2-05) écrit en DELETE-then-INSERT
 * par fenêtre temporelle, safe en retry grâce à concurrence Inngest limit=1 par projectId.
 * `replaceBacklogForAudit` delete par projectId+status=todo, préserve les items finis.
 */
export const runAudit = inngest.createFunction(
  {
    id: 'run-audit',
    // Concurrence par projet : un audit en cours par projet à la fois.
    concurrency: { key: 'event.data.projectId', limit: 1 },
  },
  { event: 'audit/run' },
  async ({ event, step, logger }) => {
    const { auditId, projectId } = event.data;

    try {
      // ─── init ──────────────────────────────────────────────────────────
      const project = await step.run('init', async () => {
        await markAuditRunning(auditId);
        await appendAuditLog(auditId, {
          phase: 'init',
          at: new Date().toISOString(),
          ok: true,
        });
        const p = await db.seoProject.findUnique({
          where: { id: projectId },
          select: { id: true, domain: true, type: true },
        });
        if (!p) throw new Error(`Project ${projectId} introuvable`);
        return p;
      });

      // ─── crawl ─────────────────────────────────────────────────────────
      const crawlResult = await step.run('crawl', async () => {
        const result = await crawl({
          domain: project.domain,
          maxDepth: 3,
          maxPages: 50,
          respectRobots: true,
        });
        await appendAuditLog(auditId, {
          phase: 'crawl',
          at: new Date().toISOString(),
          ok: true,
          meta: {
            pagesCrawled: result.pages.length,
            skippedByRobots: result.skippedByRobots.length,
            sitemapStatus: result.sitemap.status,
            robotsStatus: result.robots.status,
          },
        });
        return result;
      });

      // Inngest sérialise step.run en JSON → les Dates deviennent string. Les détecteurs
      // n'utilisent pas startedAt/finishedAt/fetchedAt, le cast est sûr.
      const crawlResultTyped = crawlResult as unknown as CrawlResult;

      // ─── findings-crawler (TECH-* page-level + site-level) ────────────
      const crawlerFindings = await step.run('findings-crawler', async () => {
        const f = detectFromCrawl(crawlResultTyped);
        await appendAuditLog(auditId, {
          phase: 'findings-crawler',
          at: new Date().toISOString(),
          ok: true,
          meta: { count: f.length },
        });
        return f;
      });

      // ─── findings-geo (GEO-001 / GEO-002) ─────────────────────────────
      const geoFindings = await step.run('findings-geo', async () => {
        const f = detectGeo(crawlResultTyped, { projectType: project.type });
        await appendAuditLog(auditId, {
          phase: 'findings-geo',
          at: new Date().toISOString(),
          ok: true,
          meta: { count: f.length },
        });
        return f;
      });

      // ─── findings-conversion (CONV-*) ──────────────────────────────────
      const conversionFindings = await step.run('findings-conversion', async () => {
        const f = detectConversion(crawlResultTyped);
        await appendAuditLog(auditId, {
          phase: 'findings-conversion',
          at: new Date().toISOString(),
          ok: true,
          meta: { count: f.length },
        });
        return f;
      });

      // ─── findings-architecture (ARCH-*) ────────────────────────────────
      const architectureFindings = await step.run('findings-architecture', async () => {
        const f = detectArchitecture(crawlResultTyped);
        await appendAuditLog(auditId, {
          phase: 'findings-architecture',
          at: new Date().toISOString(),
          ok: true,
          meta: { count: f.length },
        });
        return f;
      });

      // ─── import-gsc (GSC 90j → GscQueryStat) ──────────────────────────
      // Non-bloquant : un audit reste valide sans données GSC (le projet peut
      // ne pas avoir connecté Google, ou l'app OAuth ne pas être provisionnée).
      await step.run('import-gsc', async () => {
        try {
          const gsc = await getGscIntegration(projectId);
          if (!gsc) {
            await appendAuditLog(auditId, {
              phase: 'import-gsc',
              at: new Date().toISOString(),
              ok: true,
              meta: { skipped: true, reason: 'not_connected' },
            });
            return { skipped: true };
          }
          if (!gsc.propertyUrl) {
            await appendAuditLog(auditId, {
              phase: 'import-gsc',
              at: new Date().toISOString(),
              ok: true,
              meta: { skipped: true, reason: 'no_property' },
            });
            return { skipped: true };
          }

          const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
          if (!clientId || !clientSecret) {
            await appendAuditLog(auditId, {
              phase: 'import-gsc',
              at: new Date().toISOString(),
              ok: true,
              meta: { skipped: true, reason: 'no_oauth_app' },
            });
            return { skipped: true };
          }

          const token = await refreshAccessToken({
            refreshToken: gsc.refreshToken,
            clientId,
            clientSecret,
          });
          if (!token.ok) {
            await appendAuditLog(auditId, {
              phase: 'import-gsc',
              at: new Date().toISOString(),
              ok: false,
              error: `token refresh (${token.reason}) : ${token.message}`,
            });
            return { error: token.reason };
          }

          const accessToken = token.tokens.accessToken;
          const propertyUrl = gsc.propertyUrl;
          const env = getEnv();
          const range = computeGscDateRange();

          const outcome = await runGscImport(
            {
              startDate: range.startDate,
              endDate: range.endDate,
              maxRows: env.MAX_GSC_ROWS_PER_AUDIT,
            },
            async ({ startDate, endDate, startRow, rowLimit }) => {
              const res = await querySearchAnalytics(accessToken, propertyUrl, {
                startDate,
                endDate,
                dimensions: [...GSC_DIMENSIONS],
                startRow,
                rowLimit,
              });
              if (!res.ok) {
                return { ok: false as const, message: `${res.reason}: ${res.message}` };
              }
              return { ok: true as const, rows: mapGscRows(res.rows) };
            }
          );

          if (outcome.errored && outcome.rows.length === 0) {
            await appendAuditLog(auditId, {
              phase: 'import-gsc',
              at: new Date().toISOString(),
              ok: false,
              error: outcome.errorMessage ?? 'import GSC échoué',
            });
            return { error: 'import_failed' };
          }

          const persisted = await replaceGscStats(projectId, range, outcome.rows);

          await appendAuditLog(auditId, {
            phase: 'import-gsc',
            at: new Date().toISOString(),
            ok: !outcome.errored,
            ...(outcome.errored && outcome.errorMessage
              ? { error: outcome.errorMessage }
              : {}),
            meta: {
              rowsImported: persisted.inserted,
              pagesFetched: outcome.pagesFetched,
              cappedAtMaxRows: outcome.cappedAtMaxRows,
              // Chaîne plate : le runLog de /audit-technique rend les valeurs de
              // meta telles quelles — un objet imbriqué afficherait `[object Object]`.
              dateRange: `${range.startDate} → ${range.endDate}`,
            },
          });

          return { rowsImported: persisted.inserted };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown import-gsc error';
          await appendAuditLog(auditId, {
            phase: 'import-gsc',
            at: new Date().toISOString(),
            ok: false,
            error: message,
          });
          return { error: message };
        }
      });

      // ─── serp (SERP live + PAA par keyword seed) ──────────────────────
      await step.run('serp', async () => {
        try {
          const creds = await getDataForSeoCredentials(projectId);
          if (!creds) {
            await appendAuditLog(auditId, {
              phase: 'serp',
              at: new Date().toISOString(),
              ok: true,
              meta: { skipped: true, reason: 'no_credentials' },
            });
            return { skipped: true };
          }

          const env = getEnv();
          const seedKeywords = await db.keyword.findMany({
            where: { projectId, source: 'seed' },
            select: { query: true },
            take: env.MAX_KEYWORDS_PER_AUDIT,
          });

          if (seedKeywords.length === 0) {
            await appendAuditLog(auditId, {
              phase: 'serp',
              at: new Date().toISOString(),
              ok: true,
              meta: { skipped: true, reason: 'no_seed_keywords' },
            });
            return { skipped: true };
          }

          const projectRecord = await db.seoProject.findUnique({
            where: { id: projectId },
            select: { market: true },
          });
          const market = projectRecord?.market ?? 'FR';

          const { locationCode, languageCode } = mapMarket(market);

          const fetchedAtFloor = new Date();

          const outcome = await runSerpStep(
            { keywords: seedKeywords.map((k) => k.query), market },
            {
              fetchSerp: (kw) => fetchSerpLive(creds, { keyword: kw, locationCode, languageCode }),
              maxBudgetUsd: env.MAX_DATAFORSEO_USD_PER_AUDIT,
            }
          );

          if (outcome.results.length > 0) {
            await replaceSerpForAudit(projectId, fetchedAtFloor, outcome.results);
          }

          await appendAuditLog(auditId, {
            phase: 'serp',
            at: new Date().toISOString(),
            ok: true,
            meta: {
              keywordsRequested: seedKeywords.length,
              keywordsProcessed: outcome.results.length,
              organicCount: outcome.results.reduce((s, r) => s + r.organic.length, 0),
              paaCount: outcome.results.reduce((s, r) => s + r.paa.length, 0),
              totalCostUsd: outcome.totalCostUsd,
              cappedAt: outcome.cappedAt,
              errorsCount: outcome.errors.length,
            },
          });

          return { processed: outcome.results.length, costUsd: outcome.totalCostUsd };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown serp error';
          await appendAuditLog(auditId, {
            phase: 'serp',
            at: new Date().toISOString(),
            ok: false,
            error: message,
          });
          return { error: message };
        }
      });

      // ─── competitors-detection (S2-08) ────────────────────────────────
      await step.run('competitors-detection', async () => {
        try {
          const result = await db.$transaction(async (tx) =>
            detectCompetitorsFromSerp(tx, {
              projectId,
              projectDomain: project.domain,
            })
          );
          await appendAuditLog(auditId, {
            phase: 'competitors-detection',
            at: new Date().toISOString(),
            ok: true,
            meta: result,
          });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown competitors error';
          await appendAuditLog(auditId, {
            phase: 'competitors-detection',
            at: new Date().toISOString(),
            ok: false,
            error: message,
          });
          return { error: message };
        }
      });

      // ─── content-gap (S2-09) ───────────────────────────────────────────
      await step.run('content-gap', async () => {
        try {
          const result = await db.$transaction(async (tx) =>
            generateContentGapRecommendations(tx, { projectId })
          );
          await appendAuditLog(auditId, {
            phase: 'content-gap',
            at: new Date().toISOString(),
            ok: true,
            meta: result,
          });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown content-gap error';
          await appendAuditLog(auditId, {
            phase: 'content-gap',
            at: new Date().toISOString(),
            ok: false,
            error: message,
          });
          return { error: message };
        }
      });

      // ─── persist-findings : DELETE-then-INSERT findings avec IDs DB ────
      const all = [
        ...crawlerFindings,
        ...geoFindings,
        ...conversionFindings,
        ...architectureFindings,
      ];
      const persistedFindings = await step.run('persist-findings', async () => {
        const findings = await replaceFindings(auditId, projectId, all);
        await appendAuditLog(auditId, {
          phase: 'persist-findings',
          at: new Date().toISOString(),
          ok: true,
          meta: { count: findings.length },
        });
        return findings;
      });

      // ─── score ─────────────────────────────────────────────────────────
      const score = await step.run('score', async () => {
        const s = computeScore(all);
        await appendAuditLog(auditId, {
          phase: 'score',
          at: new Date().toISOString(),
          ok: true,
          meta: { global: s.global, technical: s.perCategory.technical },
        });
        return s;
      });

      // ─── backlog-generation (S2-11) ────────────────────────────────────
      const backlogItems = await step.run('backlog-generation', async () => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          await appendAuditLog(auditId, {
            phase: 'backlog-generation',
            at: new Date().toISOString(),
            ok: true,
            meta: { skipped: true, reason: 'no_api_key' },
          });
          return { skipped: true };
        }

        const env = getEnv();
        const projectRecord = await db.seoProject.findUnique({
          where: { id: projectId },
          select: { name: true, domain: true, type: true, businessGoal: true, market: true },
        });

        if (!projectRecord) {
          await appendAuditLog(auditId, {
            phase: 'backlog-generation',
            at: new Date().toISOString(),
            ok: false,
            error: 'project not found',
          });
          return { error: 'project not found' };
        }

        try {
          const result = await generateBacklog({
            project: projectRecord,
            findings: persistedFindings,
            maxBudgetUsd: env.MAX_ANTHROPIC_USD_PER_AUDIT,
          });

          if (!result.ok) {
            await appendAuditLog(auditId, {
              phase: 'backlog-generation',
              at: new Date().toISOString(),
              ok: false,
              error: `${result.reason}: ${result.message}`,
              meta: { costUsd: result.costUsd },
            });
            return { error: result.reason };
          }

          await replaceBacklogForAudit(auditId, projectId, result.items);

          await appendAuditLog(auditId, {
            phase: 'backlog-generation',
            at: new Date().toISOString(),
            ok: true,
            meta: {
              itemsCreated: result.items.length,
              filteredCount: result.filteredCount,
              costUsd: result.costUsd,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              cachedTokens: result.cachedTokens,
            },
          });

          return { items: result.items };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown backlog error';
          await appendAuditLog(auditId, {
            phase: 'backlog-generation',
            at: new Date().toISOString(),
            ok: false,
            error: message,
          });
          return { error: message };
        }
      });

      // ─── finalize : scores + backlogJson snapshot + status='done' ─────
      await step.run('finalize', async () => {
        const backlog =
          backlogItems && 'items' in backlogItems
            ? (backlogItems.items as unknown as object)
            : undefined;
        await finalizeAudit(auditId, projectId, { findings: all, score, backlog });
        await appendAuditLog(auditId, {
          phase: 'finalize',
          at: new Date().toISOString(),
          ok: true,
          meta: { findingsCount: all.length, globalScore: score.global },
        });
      });

      return { auditId, status: 'done', global: score.global, findings: all.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown audit error';
      logger.error('audit/run failed', { auditId, projectId, message });
      await failAudit(auditId, message);
      throw err; // Inngest tracera le retry / dead letter selon sa config
    }
  }
);
