import Link from 'next/link';
import { FileText, FolderSearch, Sparkles } from 'lucide-react';
import {
  NvButton,
  NvEmptyState,
  NvKPIBlock,
  NvPageHeader,
} from '@/components/nv';
import { getPagesList } from '@/lib/pages/get-pages-list';
import { PagesTable } from './pages-table';

const STATUSES = [
  { key: 'recommended', label: 'Recommandées' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'existing', label: 'Existantes' },
  { key: 'done', label: 'Terminées' },
] as const;

type PageProps = {
  searchParams: Promise<{ projectId?: string; status?: string }>;
};

export default async function PagesIndexRoute({ searchParams }: PageProps) {
  const { projectId, status } = await searchParams;

  if (!projectId) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Pages SEO"
          subtitle="Sélectionne un projet depuis le dashboard pour voir ses fiches."
        />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun projet sélectionné"
          description="Cette vue liste toutes les fiches de pages SEO d'un projet : statut, type, scores."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const data = await getPagesList(projectId, { status });

  if (!data) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Pages SEO" subtitle="Projet introuvable." />
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

  if (data.counts.total === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title={data.project.name}
          subtitle="Aucune fiche page pour ce projet."
        />
        <NvEmptyState
          icon={<Sparkles size={28} strokeWidth={1.75} />}
          title="Aucune fiche page"
          description="Les fiches de pages sont générées par l'audit (content gap) à partir de tes clusters de keywords. Lance un audit pour les produire."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href={`/content-gap?projectId=${projectId}`}>
                Voir le Content Gap
              </Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const resetUrl = `/pages?projectId=${projectId}`;
  const buildStatusUrl = (key: string) =>
    `/pages?projectId=${projectId}&status=${key}`;

  return (
    <div className="space-y-8">
      <NvPageHeader
        title={data.project.name}
        subtitle={`${data.counts.total} fiche${data.counts.total > 1 ? 's' : ''} de page SEO`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <NvKPIBlock label="Total" value={String(data.counts.total)} />
        {STATUSES.map((s) => (
          <NvKPIBlock
            key={s.key}
            label={s.label}
            value={String(data.counts.byStatus[s.key] ?? 0)}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">
          Filtrer par statut
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const isActive = status === s.key;
            const count = data.counts.byStatus[s.key] ?? 0;
            return (
              <Link
                key={s.key}
                href={isActive ? resetUrl : buildStatusUrl(s.key)}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.label} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      {data.pages.length === 0 ? (
        <NvEmptyState
          icon={<FileText size={28} strokeWidth={1.75} />}
          title="Aucune page avec ce statut"
          description="Retire le filtre pour voir toutes les fiches du projet."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href={resetUrl}>Réinitialiser le filtre</Link>
            </NvButton>
          }
        />
      ) : (
        <PagesTable pages={data.pages} />
      )}
    </div>
  );
}
