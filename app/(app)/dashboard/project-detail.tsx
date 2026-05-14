import Link from 'next/link';
import { Zap, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';
import {
  NvButton,
  NvPageHeader,
  NvEmptyState,
  NvBreadcrumb,
  type NvBreadcrumbItem,
} from '@/components/nv';
import type { ProjectDashboard } from '@/lib/dashboard/get-dashboard-data';
import { ScoreHero } from './score-hero';
import { RisksList } from './risks-list';
import { launchAudit } from './actions';

type ProjectDetailProps = {
  data: ProjectDashboard;
};

export function ProjectDetail({ data }: ProjectDetailProps) {
  const breadcrumbs: NvBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: data.project.name },
  ];

  if (!data.audit) {
    return (
      <div className="space-y-8">
        <NvBreadcrumb items={breadcrumbs} />
        <NvPageHeader
          title={data.project.name}
          subtitle={data.project.domain}
          action={
            <NvButton asChild variant="ghost" size="md">
              <Link href="/dashboard">
                <ArrowLeft size={16} strokeWidth={2} /> Retour
              </Link>
            </NvButton>
          }
        />

        {data.hasPendingAudit ? (
          <NvEmptyState
            icon={<Zap size={28} strokeWidth={1.75} />}
            title="Audit en cours"
            description="Un audit est en cours d'exécution. Rafraîchis cette page dans quelques minutes."
            primaryAction={
              <NvButton asChild variant="primary" size="md">
                <Link href={`/dashboard?projectId=${data.project.id}`}>
                  Rafraîchir
                </Link>
              </NvButton>
            }
          />
        ) : (
          <NvEmptyState
            icon={<Zap size={28} strokeWidth={1.75} />}
            title="Pas d'audit terminé"
            description="Lance un premier audit pour voir le score et les recommandations."
            primaryAction={
              <form action={launchAudit}>
                <input type="hidden" name="projectId" value={data.project.id} />
                <NvButton type="submit" variant="primary" size="md">
                  <Zap size={16} strokeWidth={2} /> Lancer un audit
                </NvButton>
              </form>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NvBreadcrumb items={breadcrumbs} />

      <NvPageHeader
        title={data.project.name}
        subtitle={data.project.domain}
        action={
          <div className="flex items-center gap-3">
            <NvButton asChild variant="ghost" size="md">
              <Link href="/dashboard">
                <ArrowLeft size={16} strokeWidth={2} /> Retour
              </Link>
            </NvButton>
            <form action={launchAudit}>
              <input type="hidden" name="projectId" value={data.project.id} />
              <NvButton type="submit" variant="primary" size="md">
                <Zap size={16} strokeWidth={2} /> Nouvel audit
              </NvButton>
            </form>
          </div>
        }
      />

      <ScoreHero scores={data.audit.scores} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} strokeWidth={2} className="text-[var(--nv-gold)]" />
            <h2 className="text-[18px] font-bold text-[var(--nv-navy)]">
              Risques critiques
            </h2>
          </div>
          <RisksList risks={data.audit.topRisks} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} strokeWidth={2} className="text-[var(--nv-gold)]" />
            <h2 className="text-[18px] font-bold text-[var(--nv-navy)]">
              Backlog généré
            </h2>
          </div>
          {data.audit.backlog ? (
            <div className="rounded-lg border border-[var(--nv-border)] bg-white p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-semibold text-[var(--nv-navy)]">
                  {data.audit.backlog.count} actions générées
                </p>
                <NvButton asChild variant="primary" size="sm">
                  <Link href={`/backlog?projectId=${data.project.id}`}>Voir le backlog</Link>
                </NvButton>
              </div>
              <div className="flex gap-4 text-[14px]">
                <span className="text-[var(--nv-text-secondary)]">
                  P0: {data.audit.backlog.p0}
                </span>
                <span className="text-[var(--nv-text-secondary)]">
                  P1: {data.audit.backlog.p1}
                </span>
                <span className="text-[var(--nv-text-secondary)]">
                  P2: {data.audit.backlog.p2}
                </span>
              </div>
            </div>
          ) : (
            <NvEmptyState
              icon={<Sparkles size={28} strokeWidth={1.75} />}
              title="Aucun backlog généré"
              description="Aucun backlog n'a été généré pour le dernier audit. Relance un audit pour obtenir des recommandations."
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-[var(--nv-border)] pt-8">
        <NvButton asChild variant="secondary" size="md">
          <Link href={`/audit-technique?projectId=${data.project.id}`}>
            Audit technique
          </Link>
        </NvButton>
        <NvButton asChild variant="secondary" size="md">
          <Link href={`/keywords?projectId=${data.project.id}`}>Keywords</Link>
        </NvButton>
        <NvButton asChild variant="secondary" size="md">
          <Link href={`/serp?projectId=${data.project.id}`}>SERP</Link>
        </NvButton>
      </div>
    </div>
  );
}
