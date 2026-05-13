import Link from 'next/link';
import { FolderSearch } from 'lucide-react';
import { NvButton, NvCard, NvEmptyState, NvPageHeader } from '@/components/nv';
import { MOCK_FINDINGS } from './_mock';
import { FindingsList } from './findings-list';
import type { Severity } from '@/lib/scoring/rules';

export default function AuditTechniquePage() {
  const findings = MOCK_FINDINGS;

  if (findings.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Audit technique"
          subtitle="Findings du crawler et du scan repo (TECH-*, CODE-*, GEO-*)."
        />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Aucun audit lancé"
          description="Crée un projet et lance un audit depuis le dashboard pour voir les findings techniques."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/dashboard">Aller au dashboard</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const breakdown: Record<Severity, number> = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  const mockDate = new Date('2026-05-12T14:30:00Z').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Audit technique"
        subtitle={`${findings.length} finding${findings.length > 1 ? 's' : ''} · dernier audit le ${mockDate}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Critical</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-danger)]">
              {breakdown.critical}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">High</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-danger)]">
              {breakdown.high}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Medium + Low</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-warning-text)]">
              {breakdown.medium + breakdown.low}
            </p>
          </div>
        </NvCard>
        <NvCard padding="sm">
          <div className="space-y-1">
            <p className="nv-eyebrow">Total findings</p>
            <p className="nv-numeric text-[32px] font-bold tracking-tight text-[var(--nv-navy)]">
              {findings.length}
            </p>
          </div>
        </NvCard>
      </div>

      <FindingsList findings={findings} />
    </div>
  );
}
