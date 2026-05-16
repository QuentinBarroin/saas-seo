import Link from 'next/link';
import { NvCard, NvStatusBadge } from '@/components/nv';
import type { SeoPageRow } from '@/lib/pages/get-pages-list';

const STATUS_LABELS: Record<string, string> = {
  recommended: 'Recommandée',
  existing: 'Existante',
  in_progress: 'En cours',
  done: 'Terminée',
};

const STATUS_VARIANTS: Record<string, 'active' | 'pending' | 'neutral'> = {
  recommended: 'pending',
  in_progress: 'pending',
  existing: 'active',
  done: 'active',
};

function formatScore(score: number | null): string {
  return score === null ? '—' : String(Math.round(score));
}

export function PagesTable({ pages }: { pages: SeoPageRow[] }) {
  return (
    <NvCard padding="md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 font-semibold">Page</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
              <th className="px-3 py-2 font-semibold">Keyword cible</th>
              <th className="px-3 py-2 text-right font-semibold">Mots</th>
              <th className="px-3 py-2 text-right font-semibold">Tech.</th>
              <th className="px-3 py-2 text-right font-semibold">Contenu</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const label =
                page.slug || page.url || page.targetKeyword || 'Sans titre';
              return (
                <tr
                  key={page.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/pages/${page.id}`}
                      className="nv-focus-ring font-medium text-[var(--nv-navy)] hover:underline"
                    >
                      {label}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {page.cluster ?? '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {page.pageType ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <NvStatusBadge
                      variant={STATUS_VARIANTS[page.status] ?? 'neutral'}
                    >
                      {STATUS_LABELS[page.status] ?? page.status}
                    </NvStatusBadge>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {page.targetKeyword ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {page.wordCount ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {formatScore(page.technicalScore)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {formatScore(page.contentScore)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </NvCard>
  );
}
