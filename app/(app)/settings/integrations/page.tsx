import Link from 'next/link';
import { FolderPlus, Lock, KeyRound } from 'lucide-react';
import {
  NvButton,
  NvCard,
  NvEmptyState,
  NvPageHeader,
  NvStatusBadge,
} from '@/components/nv';
import { listProjects } from '@/lib/projects/list';
import { getProjectIntegrations } from '@/lib/projects/integrations';
import { DataForSeoForm } from './dataforseo-form';

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const { projectId } = await searchParams;
  const projects = await listProjects();

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Integrations"
          subtitle="Configure les connecteurs externes par projet (DataForSEO, GSC…)."
        />
        <NvEmptyState
          icon={<FolderPlus size={28} strokeWidth={1.75} />}
          title="Aucun projet"
          description="Crée un projet d'abord — les integrations sont rattachées à un projet (creds chiffrés en DB)."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/projects/new">Créer un projet</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const selectedProjectId = projectId ?? projects[0]!.id;
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0]!;
  const integrations = await getProjectIntegrations(selectedProject.id);

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Integrations"
        subtitle={`Configure les connecteurs du projet ${selectedProject.name} (creds chiffrés AES-256-GCM).`}
      />

      {/* Project switcher si > 1 projet */}
      {projects.length > 1 ? (
        <NvCard padding="sm">
          <p className="nv-eyebrow mb-3">Projet</p>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/settings/integrations?projectId=${p.id}`}
                className={`nv-focus-ring rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  p.id === selectedProject.id
                    ? 'bg-[var(--nv-navy)] text-white'
                    : 'border border-[var(--nv-border)] text-[var(--nv-navy)] hover:bg-[var(--nv-bg)]'
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </NvCard>
      ) : null}

      {/* DataForSEO */}
      <NvCard padding="md">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--nv-accent-soft)]/40 text-[var(--nv-accent-deep)]">
              <KeyRound size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold tracking-tight text-[var(--nv-navy)]">
                DataForSEO
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--nv-text-muted)]">
                SERP, mots-clés, backlinks. HTTP Basic auth, creds par projet.
              </p>
            </div>
          </div>
          <NvStatusBadge variant={integrations.dataforseo ? 'active' : 'neutral'}>
            <Lock size={11} strokeWidth={2.5} />
            {integrations.dataforseo ? 'Configuré' : 'Non configuré'}
          </NvStatusBadge>
        </div>

        <DataForSeoForm
          projectId={selectedProject.id}
          hasCredentials={Boolean(integrations.dataforseo)}
        />
      </NvCard>

      {/* GSC — placeholder S2-01 */}
      <NvCard padding="md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--nv-bg)] text-[var(--nv-text-muted)]">
              <KeyRound size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold tracking-tight text-[var(--nv-navy)]">
                Google Search Console
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--nv-text-muted)]">
                OAuth Google + sélection de propriété. À implémenter (S2-01 / S2-02).
              </p>
            </div>
          </div>
          <NvStatusBadge variant="pending">Sprint 2</NvStatusBadge>
        </div>
      </NvCard>
    </div>
  );
}
