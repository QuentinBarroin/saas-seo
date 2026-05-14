import Link from 'next/link';
import { FolderSearch, Search, MessageSquare, Users } from 'lucide-react';
import { NvButton, NvCard, NvEmptyState, NvPageHeader } from '@/components/nv';
import { getSerpPageData } from '@/lib/serp/get-page-data';
import { KeywordSelector } from './keyword-selector';
import { OrganicTable } from './organic-table';
import { PAAList } from './paa-list';
import { CompetitorsTable } from './competitors-table';

type PageProps = {
  searchParams: Promise<{ projectId?: string; keyword?: string }>;
};

export default async function SerpPage({ searchParams }: PageProps) {
  const { projectId, keyword } = await searchParams;

  if (!projectId) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="SERP"
          subtitle="Sélectionne un projet depuis le dashboard pour voir les résultats organiques."
        />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun projet sélectionné"
          description="Les données SERP proviennent de DataForSEO. Lance un audit pour capturer les top 10 organic + PAA."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const data = await getSerpPageData(projectId, keyword);

  if (!data) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="SERP" subtitle="Projet introuvable." />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Projet introuvable"
          description="Ce projet n'existe pas ou a été supprimé."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  if (data.seedKeywords.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title={data.project.name}
          subtitle="Aucun seed keyword défini pour ce projet."
        />
        <NvEmptyState
          icon={<Search size={28} strokeWidth={1.75} />}
          title="Ajoute des seed keywords"
          description="Définis au moins un seed keyword depuis la page Keywords pour capturer les SERP lors des audits."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href={`/keywords?projectId=${projectId}`}>Aller aux Keywords</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const fetchLabel = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString('fr-FR', {
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
        title={data.project.name}
        subtitle={`${data.seedKeywords.length} seed keyword${data.seedKeywords.length > 1 ? 's' : ''} · dernier fetch ${fetchLabel}`}
      />

      <NvCard padding="md">
        <div className="space-y-4">
          <h2 className="nv-eyebrow">Seed keywords</h2>
          <KeywordSelector
            projectId={projectId}
            keywords={data.seedKeywords}
            selectedKeyword={data.selectedKeyword}
          />
        </div>
      </NvCard>

      {data.organic.length === 0 ? (
        <NvEmptyState
          icon={<Search size={28} strokeWidth={1.75} />}
          title="Pas encore de SERP captée"
          description="Lance un audit pour capturer le top 10 organic + PAA depuis DataForSEO pour ce keyword."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Lancer un audit</Link>
            </NvButton>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NvCard padding="sm" className="p-0">
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-2">
                    <Search size={18} strokeWidth={2} className="text-[var(--nv-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--nv-navy)]">
                      Top 10 organic — {data.selectedKeyword}
                    </h2>
                  </div>
                </div>
                <OrganicTable organic={data.organic} />
              </NvCard>
            </div>

            <div>
              <NvCard padding="md">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      size={18}
                      strokeWidth={2}
                      className="text-[var(--nv-accent)]"
                    />
                    <h2 className="text-lg font-semibold text-[var(--nv-navy)]">
                      People Also Ask
                    </h2>
                  </div>
                  <PAAList questions={data.paa} />
                </div>
              </NvCard>
            </div>
          </div>

          {data.competitors.length > 0 && (
            <NvCard padding="sm" className="p-0">
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Users size={18} strokeWidth={2} className="text-[var(--nv-accent)]" />
                  <h2 className="text-lg font-semibold text-[var(--nv-navy)]">
                    Concurrents détectés
                  </h2>
                </div>
                <p className="text-sm text-[var(--nv-text-muted)]">
                  Concurrents persistés à chaque audit : top des domaines apparaissant dans
                  votre top 10 SERP, sur l&apos;ensemble des seed keywords. Inclut concurrents
                  manuels enrichis automatiquement.
                </p>
              </div>
              <CompetitorsTable competitors={data.competitors} />
            </NvCard>
          )}
        </>
      )}
    </div>
  );
}
