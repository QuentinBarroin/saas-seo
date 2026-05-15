import Link from 'next/link';
import { FolderSearch, History } from 'lucide-react';
import { NvButton, NvCard, NvEmptyState, NvPageHeader, NvStatusBadge } from '@/components/nv';
import { getProjectById } from '@/lib/projects/get-by-id';
import { listAuditsForProject } from '@/lib/audits/persist';

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

function formatDateTime(d: Date): string {
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS: Record<string, { label: string; variant: 'active' | 'danger' | 'pending' | 'neutral' }> = {
  done: { label: 'Terminé', variant: 'active' },
  running: { label: 'En cours', variant: 'pending' },
  pending: { label: "En file d'attente", variant: 'pending' },
  error: { label: 'Erreur', variant: 'danger' },
  partial: { label: 'Partiel', variant: 'neutral' },
};

export default async function AuditsPage({ searchParams }: PageProps) {
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Historique des audits" />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun projet sélectionné"
          description="Sélectionne un projet depuis le dashboard pour voir l'historique de ses audits."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Historique des audits" />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Projet introuvable"
          description="Le projet demandé n'existe pas ou a été supprimé."
        />
      </div>
    );
  }

  const audits = await listAuditsForProject(projectId);

  if (audits.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader title={`Historique des audits — ${project.name}`} />
        <NvEmptyState
          icon={<History size={28} strokeWidth={1.75} />}
          title="Aucun audit"
          description="Lance un premier audit depuis le dashboard pour ce projet."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NvPageHeader
        title={`Historique des audits — ${project.name}`}
        subtitle={`${audits.length} audit${audits.length > 1 ? 's' : ''} · le plus récent en haut`}
      />

      <NvCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--nv-border)] bg-[var(--nv-bg)]">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase text-[var(--nv-text-muted)]">
                  Date
                </th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-[var(--nv-text-muted)]">
                  Statut
                </th>
                <th className="p-3 text-right text-xs font-semibold uppercase text-[var(--nv-text-muted)]">
                  Score global
                </th>
                <th className="p-3 text-right text-xs font-semibold uppercase text-[var(--nv-text-muted)]">
                  Findings
                </th>
                <th className="p-3 text-right text-xs font-semibold uppercase text-[var(--nv-text-muted)]">
                  Rapport
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => {
                const status = STATUS[a.status] ?? { label: a.status, variant: 'neutral' as const };
                const isActive = a.status === 'pending' || a.status === 'running';
                return (
                  <tr key={a.id} className="border-b border-[var(--nv-border)] last:border-0">
                    <td className="nv-numeric p-3 text-[13px] text-[var(--nv-navy)]">
                      {formatDateTime(a.createdAt)}
                    </td>
                    <td className="p-3">
                      <NvStatusBadge variant={status.variant}>{status.label}</NvStatusBadge>
                    </td>
                    <td className="nv-numeric p-3 text-right text-[13px] font-semibold text-[var(--nv-navy)]">
                      {a.globalScore !== null ? a.globalScore.toFixed(1) : '—'}
                    </td>
                    <td className="nv-numeric p-3 text-right text-[13px] text-[var(--nv-text-muted)]">
                      {a.findingsCount}
                    </td>
                    <td className="p-3 text-right">
                      {a.status === 'done' ? (
                        <Link
                          href={`/audit-technique?projectId=${projectId}&auditId=${a.id}`}
                          className="nv-focus-ring rounded-[4px] text-[13px] font-medium text-[var(--nv-navy)] underline underline-offset-2 hover:text-[var(--nv-accent-deep)]"
                        >
                          Voir
                        </Link>
                      ) : isActive ? (
                        <Link
                          href={`/audit-technique?projectId=${projectId}`}
                          className="nv-focus-ring rounded-[4px] text-[13px] font-medium text-[var(--nv-navy)] underline underline-offset-2 hover:text-[var(--nv-accent-deep)]"
                        >
                          Suivre
                        </Link>
                      ) : (
                        <span className="text-[13px] text-[var(--nv-text-dim)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NvCard>
    </div>
  );
}
