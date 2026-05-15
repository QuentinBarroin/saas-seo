import Link from 'next/link';
import { FolderSearch } from 'lucide-react';
import { NvButton, NvCard, NvEmptyState, NvPageHeader } from '@/components/nv';
import { FindingsList } from './findings-list';
import { AuditDetails } from './audit-details';
import { AuditProgress } from './audit-progress';
import { phaseLabel } from './phases';
import {
  getDisplayFindings,
  getDisplayFindingsById,
  parseRunLog,
} from '@/lib/audits/get-display-findings';
import { getActiveAudit } from '@/lib/audits/persist';
import type { Severity } from '@/lib/scoring/rules';

type PageProps = {
  searchParams: Promise<{ projectId?: string; auditId?: string }>;
};

function formatDateTime(d: Date): string {
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default async function AuditTechniquePage({ searchParams }: PageProps) {
  const { projectId, auditId } = await searchParams;

  if (!projectId) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Audit technique"
          subtitle="Sélectionne un projet depuis le dashboard pour voir ses findings."
        />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun projet sélectionné"
          description="L'audit technique affiche les findings du dernier audit terminé d'un projet."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const activeAudit = await getActiveAudit(projectId);
  const audit = auditId
    ? await getDisplayFindingsById(auditId)
    : await getDisplayFindings(projectId);

  // Ni audit en cours, ni audit terminé : rien à montrer.
  if (!activeAudit && !audit) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Audit technique" subtitle="Aucun audit pour ce projet." />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun audit"
          description="Lance un audit depuis le dashboard pour analyser le domaine de ce projet."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const progressBanner = activeAudit ? (
    <AuditProgress
      status={activeAudit.status}
      startedLabel={formatTime(activeAudit.startedAt ?? activeAudit.createdAt)}
      completedPhases={parseRunLog(activeAudit.runLog).map((e) => phaseLabel(e.phase))}
    />
  ) : null;

  // Un audit tourne mais aucun audit terminé n'existe encore.
  if (!audit) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Audit technique"
          subtitle="Premier audit en cours — les findings s'afficheront ici dès qu'il est terminé."
        />
        {progressBanner}
      </div>
    );
  }

  const breakdown: Record<Severity, number> = {
    critical: audit.findings.filter((f) => f.severity === 'critical').length,
    high: audit.findings.filter((f) => f.severity === 'high').length,
    medium: audit.findings.filter((f) => f.severity === 'medium').length,
    low: audit.findings.filter((f) => f.severity === 'low').length,
  };

  const finishedLabel = audit.finishedAt ? formatDateTime(audit.finishedAt) : '—';
  const viewingHistorical = Boolean(auditId);

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Audit technique"
        subtitle={`${audit.findings.length} finding${audit.findings.length > 1 ? 's' : ''} · ${
          viewingHistorical ? 'audit du' : 'dernier audit le'
        } ${finishedLabel}`}
      />

      {progressBanner}

      {viewingHistorical ? (
        <p className="text-[13px] text-[var(--nv-text-muted)]">
          Tu consultes un audit de l&apos;historique.{' '}
          <Link
            href={`/audit-technique?projectId=${projectId}`}
            className="nv-focus-ring rounded-[4px] font-medium text-[var(--nv-navy)] underline underline-offset-2"
          >
            Voir le dernier audit
          </Link>
          {' · '}
          <Link
            href={`/audits?projectId=${projectId}`}
            className="nv-focus-ring rounded-[4px] font-medium text-[var(--nv-navy)] underline underline-offset-2"
          >
            Historique
          </Link>
        </p>
      ) : (
        <p className="text-[13px] text-[var(--nv-text-muted)]">
          <Link
            href={`/audits?projectId=${projectId}`}
            className="nv-focus-ring rounded-[4px] font-medium text-[var(--nv-navy)] underline underline-offset-2"
          >
            Voir l&apos;historique des audits
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Score global</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {audit.global !== null ? audit.global.toFixed(1) : '—'}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Critical</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-danger)]">
              {breakdown.critical}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">High</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-danger)]">
              {breakdown.high}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Medium + Low</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-warning-text)]">
              {breakdown.medium + breakdown.low}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Total findings</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {audit.findings.length}
            </p>
          </div>
        </NvCard>
      </div>

      <FindingsList findings={audit.findings} />

      <AuditDetails audit={audit} />
    </div>
  );
}
