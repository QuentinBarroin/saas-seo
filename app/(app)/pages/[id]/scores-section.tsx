import { BarChart3 } from 'lucide-react';
import { NvCard } from '@/components/nv';

type Props = {
  scores: {
    technical: number | null;
    content: number | null;
    geo: number | null;
    conversion: number | null;
  };
};

export function ScoresSection({ scores }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Scores par axe
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Technique</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {scores.technical !== null ? scores.technical.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[var(--nv-text-muted)]">/ 100</p>
          </div>
        </NvCard>

        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Contenu</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {scores.content !== null ? scores.content.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[var(--nv-text-muted)]">/ 100</p>
          </div>
        </NvCard>

        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">GEO</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {scores.geo !== null ? scores.geo.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[var(--nv-text-muted)]">/ 100</p>
          </div>
        </NvCard>

        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Conversion</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {scores.conversion !== null ? scores.conversion.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[var(--nv-text-muted)]">/ 100</p>
          </div>
        </NvCard>
      </div>
    </section>
  );
}
