import Link from 'next/link';
import { FolderSearch, Clock } from 'lucide-react';
import { NvButton, NvCard, NvEmptyState, NvPageHeader } from '@/components/nv';
import { FindingsList } from './findings-list';
import { AuditDetails } from './audit-details';
import { getDisplayFindings } from '@/lib/audits/get-display-findings';
import { db } from '@/lib/db';
import type { Severity } from '@/lib/scoring/rules';

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function AuditTechniquePage({ searchParams }: PageProps) {
  const { projectId } = await searchParams;

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

  const audit = await getDisplayFindings(projectId);

  // Pas d'audit terminé : vérifier s'il y en a un en cours/pending.
  if (!audit) {
    const pending = await db.seoAudit.findFirst({
      where: { projectId, status: { in: ['pending', 'running'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, createdAt: true },
    });

    if (pending) {
      return (
        <div className="space-y-8">
          <NvPageHeader
            title="Audit technique"
            subtitle="Audit en cours — rafraîchis dans quelques instants pour voir les findings."
          />
          <NvEmptyState
            icon={<Clock size={28} strokeWidth={1.75} />}
            title={`Audit ${pending.status === 'running' ? 'en cours' : 'en file d\'attente'}`}
            description={`Démarré ${new Date(pending.createdAt).toLocaleTimeString('fr-FR')}. Le worker Inngest exécute le crawl + les détecteurs en arrière-plan.`}
            primaryAction={
              <NvButton asChild variant="secondary" size="md">
                <Link href={`/audit-technique?projectId=${projectId}`}>Rafraîchir</Link>
              </NvButton>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <NvPageHeader title="Audit technique" subtitle="Aucun audit terminé pour ce projet." />
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

  const breakdown: Record<Severity, number> = {
    critical: audit.findings.filter((f) => f.severity === 'critical').length,
    high: audit.findings.filter((f) => f.severity === 'high').length,
    medium: audit.findings.filter((f) => f.severity === 'medium').length,
    low: audit.findings.filter((f) => f.severity === 'low').length,
  };

  const finishedLabel = audit.finishedAt
    ? new Date(audit.finishedAt).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Audit technique"
        subtitle={`${audit.findings.length} finding${audit.findings.length > 1 ? 's' : ''} · dernier audit le ${finishedLabel}`}
      />

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
