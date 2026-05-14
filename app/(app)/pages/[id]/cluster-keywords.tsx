import { Tag, Sparkles } from 'lucide-react';
import { NvCard } from '@/components/nv';

type Props = {
  cluster: string | null;
  keywords: Array<{ query: string; isMoneyKeyword: boolean }>;
};

export function ClusterKeywords({ cluster, keywords }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Keywords du cluster
        </h2>
        {cluster && (
          <span className="text-sm text-[var(--nv-text-muted)]">
            ({cluster})
          </span>
        )}
      </div>

      <NvCard padding="md">
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <div
              key={kw.query}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--nv-bg-subtle)] border border-[var(--nv-border)]"
            >
              <span className="text-sm text-[var(--nv-text)]">{kw.query}</span>
              {kw.isMoneyKeyword && (
                <Sparkles
                  size={14}
                  strokeWidth={2}
                  className="text-[var(--nv-accent)] flex-shrink-0"
                  aria-label="Money keyword"
                />
              )}
            </div>
          ))}
        </div>
        {keywords.length === 0 && (
          <p className="text-sm text-[var(--nv-text-muted)]">
            Aucun keyword dans ce cluster.
          </p>
        )}
      </NvCard>
    </section>
  );
}
