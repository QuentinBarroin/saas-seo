import Link from 'next/link';
import { FolderPlus, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  NvButton,
  NvCard,
  NvEmptyState,
  NvPageHeader,
  NvStatusBadge,
} from '@/components/nv';
import { listProjects } from '@/lib/projects/list';
import { getProjectIntegrations } from '@/lib/projects/integrations';
import { listGscProperties } from '@/lib/gsc/list-properties';
import { DataForSeoForm } from './dataforseo-form';
import { GscCard } from './gsc-card';

type PageProps = {
  searchParams: Promise<{ projectId?: string; gsc?: string }>;
};

/** Bandeau de retour du flow OAuth GSC (statut transmis par la route callback). */
function GscStatusBanner({ status }: { status: string }) {
  const success = status === 'connected';
  const messages: Record<string, string> = {
    connected: 'Compte Google connecté. Choisis la propriété à auditer ci-dessous.',
    denied: 'Connexion Google annulée.',
    error: 'Échec de la connexion Google. Réessaie depuis la carte ci-dessous.',
    not_configured:
      "App OAuth Google non configurée — renseigne GOOGLE_OAUTH_CLIENT_ID / SECRET dans .env.",
    no_refresh_token:
      "Google n'a pas renvoyé de refresh token. Révoque l'accès dans ton compte Google, puis reconnecte.",
  };
  const message = messages[status];
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-[var(--nv-radius-md)] border px-4 py-3 text-[13px] ${
        success
          ? 'border-[var(--nv-success)]/40 bg-[var(--nv-success-soft)] text-[var(--nv-success)]'
          : 'border-[var(--nv-danger)]/40 bg-[var(--nv-danger-soft)] text-[var(--nv-danger)]'
      }`}
    >
      {success ? (
        <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      )}
      <p>{message}</p>
    </div>
  );
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const { projectId, gsc: gscStatus } = await searchParams;
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

  const oauthConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const gscProperties = integrations.gsc
    ? await listGscProperties(selectedProject.id)
    : null;

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Integrations"
        subtitle={`Configure les connecteurs du projet ${selectedProject.name} (creds chiffrés AES-256-GCM).`}
      />

      {gscStatus ? <GscStatusBanner status={gscStatus} /> : null}

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

      {/* Google Search Console (S2-01/02/03) */}
      <GscCard
        projectId={selectedProject.id}
        gsc={integrations.gsc ?? null}
        oauthConfigured={oauthConfigured}
        properties={gscProperties}
      />
    </div>
  );
}
