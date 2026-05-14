import Link from 'next/link';
import { Link2, ExternalLink, ArrowRight } from 'lucide-react';
import { NvCard, NvStatusBadge, NvButton } from '@/components/nv';

type ExistingPage = {
  id: string;
  cluster: string;
  url: string | null;
  slug: string | null;
  targetKeyword: string | null;
  title: string | null;
};

type Props = {
  pages: ExistingPage[];
};

export function ExistingSection({ pages }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Pages existantes mappées
        </h2>
      </div>
      <p className="text-sm text-[var(--nv-text-muted)]">
        Pages existantes détectées lors de l'audit et automatiquement mappées à tes clusters.
        Elles constituent l'architecture actuelle de ton site.
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
                <NvStatusBadge variant="active">
                  Existante
                </NvStatusBadge>
              </div>

              {page.url && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    URL
                  </p>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--nv-accent)] hover:underline break-all inline-flex items-center gap-1"
                  >
                    {page.url}
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                </div>
              )}

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

              {page.title && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                    Title
                  </p>
                  <p className="text-sm text-[var(--nv-text)] break-words line-clamp-2">
                    {page.title}
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
