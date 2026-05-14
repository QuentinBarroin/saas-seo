import { AlertTriangle } from 'lucide-react';
import { NvCard, NvStatusBadge, NvEmptyState } from '@/components/nv';

type Risk = {
  id: string;
  severity: 'critical' | 'high';
  title: string;
  pageUrl: string | null;
  filePath: string | null;
  rule: string;
};

type RisksListProps = {
  risks: Risk[];
};

export function RisksList({ risks }: RisksListProps) {
  if (risks.length === 0) {
    return (
      <NvEmptyState
        icon={<AlertTriangle size={28} strokeWidth={1.75} />}
        title="Aucun risque critique détecté"
        description="Tous les problèmes majeurs ont été résolus."
      />
    );
  }

  return (
    <div className="space-y-3">
      {risks.map((risk) => (
        <NvCard key={risk.id} padding="sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <NvStatusBadge
                variant={risk.severity === 'critical' ? 'danger' : 'pending'}
              >
                {risk.severity === 'critical' ? 'Critical' : 'High'}
              </NvStatusBadge>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--nv-navy)]">
                {risk.title}
              </p>
              {(risk.pageUrl || risk.filePath) && (
                <p className="mt-1 truncate text-[12px] text-[var(--nv-text-muted)]">
                  {risk.pageUrl || risk.filePath}
                </p>
              )}
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--nv-text-muted)]">
                Règle: {risk.rule}
              </p>
            </div>
          </div>
        </NvCard>
      ))}
    </div>
  );
}
