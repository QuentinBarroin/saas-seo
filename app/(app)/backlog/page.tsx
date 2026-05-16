import Link from 'next/link';
import { getBacklogPageData } from '@/lib/backlog/get-page-data';
import { groupByPullRequest } from '@/lib/backlog/group-by-pr';
import {
  NvPageHeader,
  NvButton,
  NvKPIBlock,
  NvEmptyState,
} from '@/components/nv';
import { BacklogDetailPanel } from './backlog-detail-panel';
import { BacklogExportMenu } from './export-menu';

function LinkButton({
  href,
  children,
  variant,
  size,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <NvButton asChild variant={variant} size={size}>
      <Link href={href}>{children}</Link>
    </NvButton>
  );
}

type PageProps = {
  searchParams: Promise<{
    projectId?: string;
    priority?: string;
    category?: string;
    status?: string;
  }>;
};

export default async function BacklogPage({ searchParams }: PageProps) {
  const { projectId, priority, category, status } = await searchParams;

  if (!projectId) {
    return (
      <div>
        <NvPageHeader title="Backlog" />
        <div className="p-6">
          <NvEmptyState
            title="Aucun projet sélectionné"
            description="Sélectionne un projet depuis le dashboard pour voir son backlog."
          />
        </div>
      </div>
    );
  }

  const data = await getBacklogPageData(projectId, {
    priority,
    category,
    status,
  });

  if (!data) {
    return (
      <div>
        <NvPageHeader title="Backlog" />
        <div className="p-6">
          <NvEmptyState
            title="Projet introuvable"
            description="Le projet demandé n'existe pas ou a été supprimé."
          />
        </div>
      </div>
    );
  }

  const hasFilters = Boolean(priority || category || status);

  if (data.items.length === 0) {
    return (
      <div>
        <NvPageHeader title="Backlog" subtitle={data.project.name} />
        <div className="p-6">
          <NvEmptyState
            title={
              hasFilters
                ? 'Aucun résultat avec ces filtres'
                : 'Aucune tâche dans ce backlog'
            }
            description={
              hasFilters
                ? 'Essaie de retirer les filtres pour voir toutes les tâches.'
                : 'Lance un audit pour générer des tâches automatiquement.'
            }
            primaryAction={
              hasFilters ? (
                <LinkButton
                  href={`/backlog?projectId=${projectId}`}
                  variant="primary"
                  size="md"
                >
                  Réinitialiser les filtres
                </LinkButton>
              ) : undefined
            }
          />
        </div>
      </div>
    );
  }

  const allCategories = Array.from(
    new Set(data.items.map((item) => item.category))
  ).sort();

  const buildFilterUrl = (
    key: 'priority' | 'category' | 'status',
    value: string
  ) => {
    const params = new URLSearchParams();
    params.set('projectId', projectId);
    if (key === 'priority') params.set('priority', value);
    else if (priority) params.set('priority', priority);
    if (key === 'category') params.set('category', value);
    else if (category) params.set('category', category);
    if (key === 'status') params.set('status', value);
    else if (status) params.set('status', status);
    return `/backlog?${params.toString()}`;
  };

  const resetUrl = `/backlog?projectId=${projectId}`;

  return (
    <div>
      <NvPageHeader
        title="Backlog"
        subtitle={data.project.name}
        action={<BacklogExportMenu projectId={projectId} />}
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <NvKPIBlock
            label="Total tâches"
            value={data.counts.total.toString()}
          />
          <NvKPIBlock
            label="P0 (Critique)"
            value={data.counts.byPriority.P0.toString()}
          />
          <NvKPIBlock
            label="P1 (Important)"
            value={data.counts.byPriority.P1.toString()}
          />
          <NvKPIBlock
            label="P2 (Amélioration)"
            value={data.counts.byPriority.P2.toString()}
          />
          <NvKPIBlock
            label="Todo"
            value={data.counts.byStatus.todo.toString()}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Filtres</h3>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Priorité</div>
            <div className="flex flex-wrap gap-2">
              {(['P0', 'P1', 'P2'] as const).map((p) => {
                const isActive = priority === p;
                return (
                  <Link
                    key={p}
                    href={isActive ? resetUrl : buildFilterUrl('priority', p)}
                    className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p} ({data.counts.byPriority[p]})
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Catégorie</div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const isActive = category === cat;
                return (
                  <Link
                    key={cat}
                    href={isActive ? resetUrl : buildFilterUrl('category', cat)}
                    className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat} ({data.counts.byCategory[cat] ?? 0})
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Statut</div>
            <div className="flex flex-wrap gap-2">
              {(['todo', 'in_progress', 'done', 'discarded'] as const).map(
                (s) => {
                  const isActive = status === s;
                  const labels = {
                    todo: 'Todo',
                    in_progress: 'En cours',
                    done: 'Done',
                    discarded: 'Rejeté',
                  };
                  return (
                    <Link
                      key={s}
                      href={isActive ? resetUrl : buildFilterUrl('status', s)}
                      className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {labels[s]} ({data.counts.byStatus[s]})
                    </Link>
                  );
                }
              )}
            </div>
          </div>

          {hasFilters && (
            <div className="pt-2">
              <LinkButton href={resetUrl} variant="ghost" size="sm">
                Tout réinitialiser
              </LinkButton>
            </div>
          )}
        </div>

        <BacklogDetailPanel groups={groupByPullRequest(data.items)} />
      </div>
    </div>
  );
}
