import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { NvButton, NvCard, NvStatusBadge } from '@/components/nv';
import type { ProjectSummary } from '@/lib/dashboard/get-dashboard-data';
import { launchAudit } from './actions';

type ProjectsGridProps = {
  projects: ProjectSummary[];
};

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <NvCard key={p.id} padding="sm">
          <div className="flex h-full flex-col gap-4">
            <Link
              href={`/dashboard?projectId=${p.id}`}
              className="group flex items-start justify-between gap-3 outline-none"
            >
              <div className="min-w-0">
                <p className="truncate text-[16px] font-bold tracking-tight text-[var(--nv-navy)] group-hover:text-[var(--nv-accent-deep)]">
                  {p.name}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-[var(--nv-text-muted)]">
                  {p.domain}
                </p>
              </div>
              <NvStatusBadge variant="neutral">{p.market}</NvStatusBadge>
            </Link>

            <div className="flex items-center gap-3 border-t border-[var(--nv-border)] pt-3 text-[12px] text-[var(--nv-text-muted)]">
              <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                {p.counts.keywords}
              </span>
              <span>kw</span>
              <span className="text-[var(--nv-border)]">·</span>
              <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                {p.counts.competitors}
              </span>
              <span>concurrents</span>
              <span className="text-[var(--nv-border)]">·</span>
              <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                {p.counts.audits}
              </span>
              <span>audits</span>
            </div>

            {p.lastAudit ? (
              <div className="flex items-center justify-between border-t border-[var(--nv-border)] pt-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--nv-text-muted)]">
                    Score global
                  </p>
                  <p className="nv-numeric mt-1 text-[24px] font-bold text-[var(--nv-navy)]">
                    {p.lastAudit.globalScore !== null
                      ? p.lastAudit.globalScore.toFixed(1)
                      : '—'}
                    <span className="text-[14px] text-[var(--nv-text-muted)]"> / 100</span>
                  </p>
                </div>
                {p.lastAudit.finishedAt && (
                  <p className="text-[11px] text-[var(--nv-text-muted)]">
                    {new Date(p.lastAudit.finishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-t border-[var(--nv-border)] pt-3">
                <p className="text-[13px] text-[var(--nv-text-muted)]">Pas d'audit terminé</p>
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-1">
              <form action={launchAudit} className="flex-1">
                <input type="hidden" name="projectId" value={p.id} />
                <NvButton type="submit" variant="primary" size="sm" className="w-full">
                  <Zap size={14} strokeWidth={2} /> Lancer
                </NvButton>
              </form>
              <NvButton asChild variant="secondary" size="sm">
                <Link href={`/dashboard?projectId=${p.id}`}>
                  Voir <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </NvButton>
            </div>
          </div>
        </NvCard>
      ))}
    </div>
  );
}
