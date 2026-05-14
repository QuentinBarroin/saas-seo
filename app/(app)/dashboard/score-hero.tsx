import { NvCard } from '@/components/nv';

type ScoreHeroProps = {
  scores: {
    global: number | null;
    technical: number | null;
    content: number | null;
    architecture: number | null;
    conversion: number | null;
    geo: number | null;
  };
};

type ScoreBar = {
  label: string;
  value: number | null;
  key: keyof Omit<ScoreHeroProps['scores'], 'global'>;
};

function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--nv-text-muted)';
  if (score < 50) return '#EF4444';
  if (score < 75) return '#F59E0B';
  return '#10B981';
}

export function ScoreHero({ scores }: ScoreHeroProps) {
  const bars: ScoreBar[] = [
    { label: 'Technique', value: scores.technical, key: 'technical' },
    { label: 'Contenu', value: scores.content, key: 'content' },
    { label: 'Architecture', value: scores.architecture, key: 'architecture' },
    { label: 'Conversion', value: scores.conversion, key: 'conversion' },
    { label: 'GEO', value: scores.geo, key: 'geo' },
  ];

  return (
    <NvCard padding="lg">
      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
        <div className="text-center">
          <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--nv-text-muted)]">
            Score global
          </p>
          <p
            className="nv-numeric mt-3 text-[64px] font-bold leading-none"
            style={{ color: getScoreColor(scores.global) }}
          >
            {scores.global !== null ? scores.global.toFixed(1) : '—'}
          </p>
          <p className="mt-2 text-[14px] text-[var(--nv-text-muted)]">sur 100</p>
        </div>

        <div className="w-full max-w-lg space-y-4">
          {bars.map((bar) => (
            <div key={bar.key}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--nv-navy)]">
                  {bar.label}
                </span>
                <span
                  className="nv-numeric text-[13px] font-bold"
                  style={{ color: getScoreColor(bar.value) }}
                >
                  {bar.value !== null ? bar.value.toFixed(0) : '—'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--nv-bg-subtle)]">
                {bar.value !== null && (
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, bar.value))}%`,
                      backgroundColor: getScoreColor(bar.value),
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </NvCard>
  );
}
