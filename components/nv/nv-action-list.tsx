import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NvCard } from './nv-card';
import { NvStatusBadge } from './nv-status-badge';

export type NvActionItem = {
  icon: ReactNode;
  label: string;
  detail: string;
  amount?: string;
  badge?: {
    variant: 'active' | 'pending' | 'premium' | 'danger' | 'neutral';
    text: string;
  };
  onClick?: () => void;
};

type NvActionListProps = { items: NvActionItem[] };

export function NvActionList({ items }: NvActionListProps) {
  return (
    <NvCard padding="sm" className="!p-0 overflow-hidden">
      <ul>
        {items.map((item, idx) => (
          <li
            key={idx}
            className={cn(
              'group flex cursor-pointer items-center gap-5 px-6 py-5 transition-colors duration-150 hover:bg-[var(--nv-bg)]',
              idx !== items.length - 1 && 'border-b border-[var(--nv-border)]'
            )}
            onClick={item.onClick}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--nv-bg)] text-[var(--nv-navy)]">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <p className="truncate text-[15px] font-semibold text-[var(--nv-navy)]">
                  {item.label}
                </p>
                {item.badge && (
                  <NvStatusBadge variant={item.badge.variant}>{item.badge.text}</NvStatusBadge>
                )}
              </div>
              <p className="mt-0.5 truncate text-[13px] text-[var(--nv-text-muted)]">
                {item.detail}
              </p>
            </div>
            {item.amount && (
              <p className="nv-numeric shrink-0 whitespace-nowrap text-[16px] font-bold text-[var(--nv-navy)]">
                {item.amount}
              </p>
            )}
            <ArrowRight
              size={16}
              className="shrink-0 text-[var(--nv-text-dim)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--nv-navy)]"
            />
          </li>
        ))}
      </ul>
    </NvCard>
  );
}
