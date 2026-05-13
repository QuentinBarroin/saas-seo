import { type ReactNode } from 'react';
import { NvCard } from './nv-card';

type NvEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
};

export function NvEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: NvEmptyStateProps) {
  return (
    <NvCard padding="lg" className="!p-12">
      <div className="mx-auto max-w-[460px] text-center">
        {icon && (
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--nv-accent-soft)]/40 text-[var(--nv-accent-deep)]">
            {icon}
          </div>
        )}
        <h3 className="text-[22px] font-bold tracking-tight text-[var(--nv-navy)]">{title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--nv-text-muted)]">
          {description}
        </p>
        {(primaryAction || secondaryAction) && (
          <div className="mt-7 flex items-center justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </NvCard>
  );
}
