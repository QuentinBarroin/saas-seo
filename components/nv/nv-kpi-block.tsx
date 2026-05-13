import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { NvCard } from './nv-card';

type NvKPIBlockProps = {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  hint?: string;
  trailing?: ReactNode;
  /** Sélecteur E2E stable. Convention : `kpi-<page>-<slug>`. */
  testId?: string;
};

export function NvKPIBlock({ label, value, delta, hint, trailing, testId }: NvKPIBlockProps) {
  return (
    <NvCard padding="md" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <p className="nv-eyebrow">{label}</p>
        {trailing}
      </div>
      <p className="nv-numeric mt-3 text-[36px] font-extrabold leading-[44px] tracking-tight text-[var(--nv-navy)]">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            'nv-numeric mt-2 text-[13px] font-medium',
            delta.positive ? 'text-[var(--nv-success)]' : 'text-[var(--nv-danger)]'
          )}
        >
          {delta.positive ? '+' : ''}
          {delta.value}
        </p>
      )}
      {hint && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--nv-text-muted)]">{hint}</p>
      )}
    </NvCard>
  );
}
