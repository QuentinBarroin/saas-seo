import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { NvCard, NvStatusBadge, NvButton } from '@/components/nv';

type RecommendedPage = {
  id: string;
  cluster: string;
  slug: string | null;
  targetKeyword: string | null;
  pageType: string | null;
};

type Props = {
  pages: RecommendedPage[];
};

export function RecommendedSection({ pages }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Pages recommandées
        </h2>
      </div>
      <p className="text-sm text-[var(--nv-text-muted)]">
        Ces pages ont été générées automatiquement à partir de tes clusters de keywords.
        Elles représentent l'architecture SEO idéale pour couvrir tes intentions de recherche.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <NvCard key={page.id} padding="md" className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    Cluster
                  </p>
                  <p className="text-sm font-semibold text-[var(--nv-navy)] break-words">
                    {page.cluster}
                  </p>
                </div>
                <NvStatusBadge variant="pending">
                  Recommandé
                </NvStatusBadge>
              </div>

              {page.slug && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    Slug
                  </p>
                  <p className="text-sm text-[var(--nv-text)] font-mono break-all">
                    {page.slug}
                  </p>
                </div>
              )}

              {page.targetKeyword && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    Keyword cible
                  </p>
                  <p className="text-sm text-[var(--nv-text)] break-words">
                    {page.targetKeyword}
                  </p>
                </div>
              )}

              {page.pageType && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    Type
                  </p>
                  <p className="text-sm text-[var(--nv-text)]">
                    {page.pageType}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--nv-border)]">
              <NvButton asChild variant="secondary" size="sm" className="w-full">
                <Link href={`/pages/${page.id}`} className="inline-flex items-center gap-2">
                  Voir la fiche
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </NvButton>
            </div>
          </NvCard>
        ))}
      </div>
    </section>
  );
}
