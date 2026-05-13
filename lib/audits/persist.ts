import { db } from '@/lib/db';
import type { FindingDraft } from '@/lib/scoring/finding';
import type { ScoreBreakdown } from '@/lib/scoring/score';

export type AuditPhase =
  | 'init'
  | 'crawl'
  | 'repo-scan'
  | 'findings-crawler'
  | 'findings-repo'
  | 'findings-geo'
  | 'score'
  | 'finalize';

export type AuditLogEntry = {
  phase: AuditPhase;
  at: string;
  ok: boolean;
  /** Compteurs ou métadonnées utiles (ex: pagesCrawled, findingsEmitted). */
  meta?: Record<string, unknown>;
  error?: string;
};

/** Crée un SeoAudit en status 'pending', renvoie son id. */
export async function createPendingAudit(projectId: string): Promise<string> {
  const audit = await db.seoAudit.create({
    data: {
      projectId,
      status: 'pending',
      findingsJson: [],
      backlogJson: [],
      runLog: [],
    },
    select: { id: true },
  });
  return audit.id;
}

/** Passe un audit en status 'running' (entrée step `init`). */
export async function markAuditRunning(auditId: string): Promise<void> {
  await db.seoAudit.update({
    where: { id: auditId },
    data: { status: 'running', startedAt: new Date() },
  });
}

/**
 * Append un log d'étape au runLog. Lecture-modification-écriture en transaction
 * (Prisma n'a pas d'opérateur JSON append natif sur sqlite/pg — on relit + écrit).
 */
export async function appendAuditLog(auditId: string, entry: AuditLogEntry): Promise<void> {
  await db.$transaction(async (tx) => {
    const current = await tx.seoAudit.findUnique({
      where: { id: auditId },
      select: { runLog: true },
    });
    const previous = Array.isArray(current?.runLog) ? (current.runLog as unknown[]) : [];
    await tx.seoAudit.update({
      where: { id: auditId },
      data: { runLog: [...previous, entry] as unknown as object },
    });
  });
}

/**
 * Idempotence : DELETE-then-INSERT des Findings par auditId.
 * Si la step est rejouée par Inngest (retry), pas de doublons.
 *
 * Mapping FindingDraft → Finding (Prisma) :
 *  - ruleId → `rule` (colonne dédiée pour faciliter les requêtes "tous les TECH-missing-title").
 *  - evidence.url / evidence.filePath → colonnes dédiées `pageUrl` / `filePath` (recherche rapide).
 *  - recommendation + confidence sérialisés dans `evidence` (champs hors schema actuel — l'enrichir
 *    en Lot 1 ajoutera des colonnes dédiées si besoin de filtrer dessus).
 */
export async function replaceFindings(
  auditId: string,
  projectId: string,
  findings: FindingDraft[]
): Promise<{ count: number }> {
  await db.$transaction(async (tx) => {
    await tx.finding.deleteMany({ where: { auditId } });
    if (findings.length === 0) return;
    await tx.finding.createMany({
      data: findings.map((f) => ({
        projectId,
        auditId,
        rule: f.ruleId,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        pageUrl: typeof f.evidence.url === 'string' ? f.evidence.url : null,
        filePath: typeof f.evidence.filePath === 'string' ? f.evidence.filePath : null,
        evidence: {
          ...f.evidence,
          recommendation: f.recommendation,
          confidence: f.confidence,
        } as unknown as object,
      })),
    });
  });
  return { count: findings.length };
}

export type FinalizePayload = {
  findings: FindingDraft[];
  score: ScoreBreakdown;
};

/** Étape `finalize` : persiste findings + scores + status='done' + findingsJson snapshot. */
export async function finalizeAudit(
  auditId: string,
  projectId: string,
  payload: FinalizePayload
): Promise<void> {
  await replaceFindings(auditId, projectId, payload.findings);
  await db.seoAudit.update({
    where: { id: auditId },
    data: {
      status: 'done',
      finishedAt: new Date(),
      globalScore: payload.score.global,
      technicalScore: payload.score.perCategory.technical,
      contentScore: payload.score.perCategory.content,
      architectureScore: payload.score.perCategory.architecture,
      conversionScore: payload.score.perCategory.conversion,
      geoScore: payload.score.perCategory.geo,
      findingsJson: payload.findings as unknown as object,
    },
  });
}

/** Step d'erreur fatale : on passe en `error` + on log la cause. */
export async function failAudit(auditId: string, error: string): Promise<void> {
  await appendAuditLog(auditId, {
    phase: 'finalize',
    at: new Date().toISOString(),
    ok: false,
    error,
  });
  await db.seoAudit.update({
    where: { id: auditId },
    data: { status: 'error', finishedAt: new Date() },
  });
}

/** Récupère le dernier audit terminé (status done) d'un projet. */
export async function getLatestAudit(projectId: string) {
  return db.seoAudit.findFirst({
    where: { projectId, status: 'done' },
    orderBy: { finishedAt: 'desc' },
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      runLog: true,
      globalScore: true,
      technicalScore: true,
      contentScore: true,
      architectureScore: true,
      conversionScore: true,
      geoScore: true,
      findings: {
        select: {
          id: true,
          rule: true,
          category: true,
          severity: true,
          title: true,
          description: true,
          pageUrl: true,
          filePath: true,
          evidence: true,
        },
      },
    },
  });
}
