import { FolderSearch, Sparkles, Tag } from 'lucide-react';
import { NvPageHeader, NvCard, NvEmptyState, NvKPIBlock } from '@/components/nv';
import { getKeywordsPageData } from '@/lib/keywords/get-page-data';
import { KeywordsBulkForm } from './keywords-bulk-form';
import { KeywordRow } from './keyword-row';
import { SeedSuggestions } from './seed-suggestions';

type Props = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function KeywordsPage({ searchParams }: Props) {
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div>
        <NvPageHeader title="Keywords" />
        <NvEmptyState
          icon={<FolderSearch size={40} className="text-nv-gold" />}
          title="Aucun projet sélectionné"
          description="Sélectionne un projet depuis le dashboard pour voir ses keywords."
        />
      </div>
    );
  }

  const data = await getKeywordsPageData(projectId);

  if (!data) {
    return (
      <div>
        <NvPageHeader title="Keywords" />
        <NvEmptyState
          icon={<FolderSearch size={40} className="text-nv-gold" />}
          title="Projet introuvable"
          description="Le projet demandé n'existe pas ou a été supprimé."
        />
      </div>
    );
  }

  if (data.keywords.length === 0) {
    return (
      <div className="space-y-6">
        <NvPageHeader title={`Keywords — ${data.project.name}`} />
        <NvEmptyState
          icon={<Sparkles size={40} className="text-nv-gold" />}
          title="Aucun keyword"
          description="Ajoute des seed keywords pour démarrer — saisis-les via l'édition du projet, ou laisse Claude t'en suggérer ci-dessous."
        />
        <NvCard>
          <h2 className="text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
            Ajouter des seed keywords
          </h2>
          <p className="mt-1 text-[13px] text-[var(--nv-text-muted)]">
            Les seed keywords alimentent les clusters, le content gap et la SERP.
          </p>
          <SeedSuggestions projectId={projectId} existingQueries={[]} />
        </NvCard>
      </div>
    );
  }

  const moneyKeywordsCount = data.keywords.filter((k) => k.isMoneyKeyword).length;
  const clustersCount = data.existingClusters.length;

  return (
    <div>
      <NvPageHeader
        title={`Keywords — ${data.project.name}`}
        subtitle={`${data.keywords.length} keywords · ${clustersCount} clusters · ${moneyKeywordsCount} money keywords`}
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <NvKPIBlock label="Total" value={String(data.keywords.length)} />
        <NvKPIBlock label="Money keywords" value={String(moneyKeywordsCount)} />
        <NvKPIBlock label="Clusters" value={String(clustersCount)} />
      </div>

      <div className="mb-6">
        <KeywordsBulkForm
          projectId={projectId}
          keywords={data.keywords}
          existingClusters={data.existingClusters}
        />
      </div>

      <NvCard className="overflow-hidden">
        <div className="mb-3 px-4 pt-4">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-nv-gold" />
            <h3 className="text-sm font-semibold text-nv-navy">Édition des keywords</h3>
          </div>
          {!data.hasGscData ? (
            <p className="mt-1.5 text-xs text-gray-500">
              Aucune donnée Google Search Console importée. Connecte GSC dans Réglages →
              Intégrations, puis relance un audit pour peupler les colonnes clics / impressions /
              CTR / position.
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-nv-border bg-gray-50">
              <tr>
                <th className="p-2 text-left text-xs font-semibold uppercase text-gray-600">
                  Query
                </th>
                <th className="p-2 text-right text-xs font-semibold uppercase text-gray-600">
                  Clics 90j
                </th>
                <th className="p-2 text-right text-xs font-semibold uppercase text-gray-600">
                  Impr.
                </th>
                <th className="p-2 text-right text-xs font-semibold uppercase text-gray-600">
                  CTR
                </th>
                <th className="p-2 text-right text-xs font-semibold uppercase text-gray-600">
                  Pos.
                </th>
                <th className="p-2 text-left text-xs font-semibold uppercase text-gray-600">
                  Cluster / Intent / Money
                </th>
                <th className="p-2 text-left text-xs font-semibold uppercase text-gray-600">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {data.keywords.map((kw) => (
                <KeywordRow
                  key={kw.id}
                  projectId={projectId}
                  keyword={kw}
                  existingClusters={data.existingClusters}
                />
              ))}
            </tbody>
          </table>
        </div>
      </NvCard>
    </div>
  );
}
