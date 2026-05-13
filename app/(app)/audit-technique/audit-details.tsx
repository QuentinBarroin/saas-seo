import { NvCard, NvStatusBadge } from '@/components/nv';
import type { AuditDisplay } from '@/lib/audits/get-display-findings';

const PHASE_LABEL: Record<string, string> = {
  init: 'Initialisation',
  crawl: 'Crawl',
  'repo-scan': 'Scan repo',
  'findings-crawler': 'Détecteurs crawler',
  'findings-repo': 'Détecteurs repo',
  'findings-geo': 'Détecteurs GEO',
  score: 'Scoring',
  finalize: 'Finalisation',
};

const CATEGORY_LABEL: Record<keyof AuditDisplay['perCategory'], string> = {
  technical: 'Technique',
  content: 'Contenu',
  architecture: 'Architecture',
  conversion: 'Conversion',
  geo: 'GEO',
};

type Props = {
  audit: AuditDisplay;
};

export function AuditDetails({ audit }: Props) {
  const durationMs =
    audit.startedAt && audit.finishedAt
      ? new Date(audit.finishedAt).getTime() - new Date(audit.startedAt).getTime()
      : null;
  const durationLabel =
    durationMs !== null ? `${(durationMs / 1000).toFixed(1)}s` : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] font-bold tracking-tight text-[var(--nv-navy)]">
          Détails de l&apos;audit
        </h2>
        <p className="text-[12px] text-[var(--nv-text-muted)]">
          Durée totale <span className="nv-numeric font-semibold">{durationLabel}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Scores par axe */}
        <NvCard padding="sm">
          <p className="nv-eyebrow mb-4">Scores par axe</p>
          <div className="space-y-2">
            {(Object.keys(audit.perCategory) as Array<keyof AuditDisplay['perCategory']>).map(
              (cat) => {
                const score = audit.perCategory[cat];
                return (
                  <div key={cat} className="flex items-center justify-between text-[13px]">
                    <span className="text-[var(--nv-text)]">{CATEGORY_LABEL[cat]}</span>
                    <span
                      className={`nv-numeric font-semibold ${
                        score === null
                          ? 'text-[var(--nv-text-dim)]'
                          : score >= 70
                            ? 'text-[var(--nv-success)]'
                            : score >= 40
                              ? 'text-[var(--nv-warning-text)]'
                              : 'text-[var(--nv-danger)]'
                      }`}
                    >
                      {score !== null ? score.toFixed(1) : '—'}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </NvCard>

        {/* runLog phases */}
        <NvCard padding="sm">
          <p className="nv-eyebrow mb-4">Étapes d&apos;exécution</p>
          {audit.runLog.length === 0 ? (
            <p className="text-[13px] text-[var(--nv-text-muted)]">
              Aucun log d&apos;exécution disponible.
            </p>
          ) : (
            <div className="space-y-2">
              {audit.runLog.map((entry, idx) => (
                <div
                  key={`${entry.phase}-${idx}`}
                  className="flex items-start justify-between gap-3 text-[13px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--nv-text)]">
                      {PHASE_LABEL[entry.phase] ?? entry.phase}
                    </p>
                    {entry.meta ? (
                      <p className="mt-0.5 text-[12px] text-[var(--nv-text-muted)]">
                        {formatMeta(entry.meta)}
                      </p>
                    ) : null}
                    {entry.error ? (
                      <p className="mt-0.5 text-[12px] text-[var(--nv-danger)]">
                        {entry.error}
                      </p>
                    ) : null}
                  </div>
                  <NvStatusBadge variant={entry.ok ? 'active' : 'danger'}>
                    {entry.ok ? 'OK' : 'Erreur'}
                  </NvStatusBadge>
                </div>
              ))}
            </div>
          )}
        </NvCard>
      </div>
    </div>
  );
}

function formatMeta(meta: Record<string, unknown>): string {
  return Object.entries(meta)
    .map(([k, v]) => `${k}: ${formatValue(v)}`)
    .join(' · ');
}

function formatValue(v: unknown): string {
  if (v === null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1);
  return String(v);
}
