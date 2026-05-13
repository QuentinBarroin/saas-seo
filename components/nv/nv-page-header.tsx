import { type ReactNode } from 'react';

type NvPageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function NvPageHeader({ title, subtitle, action }: NvPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-[var(--nv-border)] pb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[32px] font-extrabold leading-[40px] tracking-[-0.02em] text-[var(--nv-navy)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--nv-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}
