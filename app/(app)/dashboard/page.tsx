import Link from 'next/link';
import { Plus, FolderPlus } from 'lucide-react';
import {
  NvButton,
  NvCard,
  NvEmptyState,
  NvPageHeader,
  NvStatusBadge,
} from '@/components/nv';
import { listProjects } from '@/lib/projects/list';

export default async function DashboardPage() {
  const projects = await listProjects();

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Dashboard"
          subtitle="Crée ton premier projet pour lancer un audit SEO/GEO."
        />
        <NvEmptyState
          icon={<FolderPlus size={28} strokeWidth={1.75} />}
          title="Aucun projet pour l'instant"
          description="Un projet SEO regroupe un domaine, un repo optionnel, des concurrents et des seed keywords. Tu pourras ensuite lancer un audit."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/projects/new">
                <Plus size={16} strokeWidth={2} /> Créer un projet
              </Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Dashboard"
        subtitle={`${projects.length} projet${projects.length > 1 ? 's' : ''} actif${projects.length > 1 ? 's' : ''}.`}
        action={
          <NvButton asChild variant="primary" size="md">
            <Link href="/projects/new">
              <Plus size={16} strokeWidth={2} /> Nouveau projet
            </Link>
          </NvButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <NvCard key={p.id} padding="sm">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
                    {p.name}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-[var(--nv-text-muted)]">
                    {p.domain}
                  </p>
                </div>
                <NvStatusBadge variant="neutral">{p.market}</NvStatusBadge>
              </div>
              <div className="flex items-center gap-3 border-t border-[var(--nv-border)] pt-3 text-[12px] text-[var(--nv-text-muted)]">
                <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                  {p._count.keywords}
                </span>
                <span>kw</span>
                <span className="text-[var(--nv-border)]">·</span>
                <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                  {p._count.competitors}
                </span>
                <span>concurrents</span>
                <span className="text-[var(--nv-border)]">·</span>
                <span className="nv-numeric font-semibold text-[var(--nv-navy)]">
                  {p._count.audits}
                </span>
                <span>audits</span>
              </div>
            </div>
          </NvCard>
        ))}
      </div>
    </div>
  );
}
