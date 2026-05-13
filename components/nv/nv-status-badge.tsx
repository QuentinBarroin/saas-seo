import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'active' | 'pending' | 'premium' | 'danger' | 'neutral';

type NvStatusBadgeProps = {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  active: 'bg-[var(--nv-success-soft)] text-[var(--nv-success)]',
  pending: 'bg-[var(--nv-warning-soft)] text-[var(--nv-warning-text)]',
  premium: 'bg-[var(--nv-accent-soft)]/40 text-[var(--nv-accent-deep)]',
  danger: 'bg-[var(--nv-danger-soft)] text-[var(--nv-danger)]',
  neutral:
    'bg-[var(--nv-bg)] text-[var(--nv-text-muted)] border border-[var(--nv-border)]',
};

export function NvStatusBadge({ variant = 'neutral', children, icon }: NvStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-tight',
        variantClasses[variant]
      )}
    >
      {icon}
      {children}
    </span>
  );
}
