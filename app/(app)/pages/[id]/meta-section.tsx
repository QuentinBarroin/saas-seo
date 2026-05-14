import { Search, ExternalLink } from 'lucide-react';
import { NvCard } from '@/components/nv';

type Props = {
  url: string | null;
  slug: string | null;
  pageType: string | null;
  targetKeyword: string | null;
  canonical: string | null;
};

export function MetaSection({
  url,
  slug,
  pageType,
  targetKeyword,
  canonical,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Search size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Méta SEO
        </h2>
      </div>

      <NvCard padding="md">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              URL
            </p>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--nv-accent)] hover:underline break-all inline-flex items-center gap-1"
              >
                {url}
                <ExternalLink size={12} strokeWidth={2} />
              </a>
            ) : (
              <p className="text-sm text-[var(--nv-text-muted)]">—</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Slug
            </p>
            <p className="text-sm text-[var(--nv-text)] font-mono break-all">
              {slug || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Type de page
            </p>
            <p className="text-sm text-[var(--nv-text)]">
              {pageType || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Keyword cible
            </p>
            <p className="text-sm text-[var(--nv-text)] break-words">
              {targetKeyword || '—'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Canonical
            </p>
            {canonical ? (
              <p className="text-sm text-[var(--nv-text)] font-mono break-all">
                {canonical}
              </p>
            ) : (
              <p className="text-sm text-[var(--nv-text-muted)]">—</p>
            )}
          </div>
        </div>
      </NvCard>
    </section>
  );
}
