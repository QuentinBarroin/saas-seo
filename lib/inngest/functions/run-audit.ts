import { db } from '@/lib/db';
import { crawl } from '@/lib/crawler';
import type { CrawlResult } from '@/lib/crawler';
import { detectFromCrawl } from '@/lib/scoring/detectors/crawler';
import { detectGeo } from '@/lib/scoring/detectors/geo';
import { computeScore } from '@/lib/scoring/score';
import {
  appendAuditLog,
  failAudit,
  finalizeAudit,
  markAuditRunning,
} from '@/lib/audits/persist';
import { inngest } from '../client';

/**
 * Job d'audit principal (S1-07). Orchestre :
 *  init → crawl → findings-crawler + findings-geo → score → finalize.
 *
 * **MVP scope** : crawler-only. La step `repo-scan` (S1-05) consomme un chemin
 * local sur la machine de l'auditeur — pas adapté à un exécution Inngest cloud
 * sans clone shallow temporaire (à venir en Lot 1). Le user déclenche le
 * repo-scan séparément via une autre route (à venir) qui ré-utilise les mêmes
 * persisteurs.
 *
 * **Idempotence** : chaque step est isolée via `step.run` (retry safe).
 * `replaceFindings` fait DELETE-then-INSERT par auditId → rejouer la finalisation
 * n'introduit pas de doublons. Cohérent avec CLAUDE.md §7.
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

      // ─── score ─────────────────────────────────────────────────────────
      const all = [...crawlerFindings, ...geoFindings];
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

      // ─── finalize : persist findings + scores + status='done' ─────────
      await step.run('finalize', async () => {
        await finalizeAudit(auditId, projectId, { findings: all, score });
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
