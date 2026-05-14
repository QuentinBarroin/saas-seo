import Link from 'next/link';
import { FolderSearch, Sparkles, FileText } from 'lucide-react';
import { NvButton, NvEmptyState, NvPageHeader } from '@/components/nv';
import { getContentGapPageData } from '@/lib/content-gap/get-page-data';
import { RecommendedSection } from './recommended-section';
import { ExistingSection } from './existing-section';

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function ContentGapPage({ searchParams }: PageProps) {
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Content Gap"
          subtitle="Sélectionne un projet depuis le dashboard pour voir les pages recommandées."
        />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun projet sélectionné"
          description="Le content gap analyse tes clusters de keywords pour recommander une architecture de pages SEO optimale."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const data = await getContentGapPageData(projectId);

  if (!data) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Content Gap" subtitle="Projet introuvable." />
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

  if (!data.hasAnyCluster) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title={data.project.name}
          subtitle="Aucun cluster de keywords défini pour ce projet."
        />
        <NvEmptyState
          icon={<FileText size={28} strokeWidth={1.75} />}
          title="Définis des clusters depuis /keywords"
          description="Tu dois d'abord créer des clusters de keywords pour que le système puisse te recommander une architecture de pages optimale."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href={`/keywords?projectId=${projectId}`}>Aller aux Keywords</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  if (data.recommended.length === 0 && data.existing.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title={data.project.name}
          subtitle={`${data.clustersTotal} cluster${data.clustersTotal > 1 ? 's' : ''} défini${data.clustersTotal > 1 ? 's' : ''}`}
        />
        <NvEmptyState
          icon={<Sparkles size={28} strokeWidth={1.75} />}
          title="Lance un audit pour générer les recommandations"
          description="Le content gap se base sur tes clusters pour recommander une architecture de pages. Lance un audit pour que le système analyse tes clusters et génère les recommandations."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Lancer un audit</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NvPageHeader
        title={data.project.name}
        subtitle={`${data.clustersTotal} cluster${data.clustersTotal > 1 ? 's' : ''} · ${data.recommended.length} page${data.recommended.length > 1 ? 's' : ''} recommandée${data.recommended.length > 1 ? 's' : ''} · ${data.existing.length} page${data.existing.length > 1 ? 's' : ''} existante${data.existing.length > 1 ? 's' : ''} mappée${data.existing.length > 1 ? 's' : ''}`}
      />

      <div className="space-y-8">
        {data.recommended.length > 0 && (
          <RecommendedSection pages={data.recommended} />
        )}

        {data.existing.length > 0 && (
          <ExistingSection pages={data.existing} />
        )}
      </div>
    </div>
  );
}
