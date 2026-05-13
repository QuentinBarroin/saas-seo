import type { FindingDraft } from '@/lib/scoring/finding';
import type { RuleCategory, Severity } from '@/lib/scoring/rules';
import type { AuditLogEntry } from './persist';
import { getLatestAudit } from './persist';

export type AuditDisplay = {
  auditId: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  global: number | null;
  perCategory: {
    technical: number | null;
    content: number | null;
    architecture: number | null;
    conversion: number | null;
    geo: number | null;
  };
  runLog: AuditLogEntry[];
  findings: FindingDraft[];
};

/** Shape minimal d'un Finding lu en DB (subset de l'output de getLatestAudit). */
export type DbFindingForDisplay = {
  rule: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  pageUrl: string | null;
  filePath: string | null;
  evidence: unknown;
};

/**
 * Pure adapter : DB Finding (row Prisma) → FindingDraft (forme UI).
 *  - `recommendation` et `confidence` sont stockés dans `evidence` par
 *    `replaceFindings` (cf. persist.ts). On les ré-extrait ici, et on
 *    retire ces clés du blob evidence pour ne pas les dupliquer.
 *  - `pageUrl` / `filePath` (colonnes dédiées) sont remis dans evidence
 *    sous les clés conventionnelles `url` / `filePath` attendues par
 *    les templates de recommandation.
 */
export function mapDbFindingToDraft(f: DbFindingForDisplay): FindingDraft {
  const evidence =
    typeof f.evidence === 'object' && f.evidence !== null
      ? (f.evidence as Record<string, unknown>)
      : {};

  const recommendation =
    typeof evidence.recommendation === 'string' ? evidence.recommendation : f.description;
  const confidence = parseConfidence(evidence.confidence);

  const { recommendation: _r, confidence: _c, ...rest } = evidence;

  return {
    ruleId: f.rule,
    category: f.category as RuleCategory,
    severity: f.severity as Severity,
    title: f.title,
    description: f.description,
    evidence: {
      ...rest,
      ...(f.pageUrl ? { url: f.pageUrl } : {}),
      ...(f.filePath ? { filePath: f.filePath } : {}),
    },
    recommendation,
    confidence,
  };
}

function parseConfidence(value: unknown): FindingDraft['confidence'] {
  if (value === 'certain' || value === 'hypothèse' || value === 'à vérifier') return value;
  return 'certain';
}

/** Parse défensif d'un runLog DB → array typé. Tolère le JSON cassé / non-array. */
export function parseRunLog(raw: unknown): AuditLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isAuditLogEntry);
}

function isAuditLogEntry(value: unknown): value is AuditLogEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.phase === 'string' &&
    typeof v.at === 'string' &&
    typeof v.ok === 'boolean'
  );
}

/** Adapter DB Finding → FindingDraft (consommé par FindingsList). */
export async function getDisplayFindings(projectId: string): Promise<AuditDisplay | null> {
  const audit = await getLatestAudit(projectId);
  if (!audit) return null;

  return {
    auditId: audit.id,
    startedAt: audit.startedAt,
    finishedAt: audit.finishedAt,
    global: audit.globalScore,
    perCategory: {
      technical: audit.technicalScore,
      content: audit.contentScore,
      architecture: audit.architectureScore,
      conversion: audit.conversionScore,
      geo: audit.geoScore,
    },
    runLog: parseRunLog(audit.runLog),
    findings: audit.findings.map(mapDbFindingToDraft),
  };
}
