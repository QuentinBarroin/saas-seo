import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NvBreadcrumbItem = { label: string; href?: Route };

type NvBreadcrumbProps = { items: NvBreadcrumbItem[]; className?: string };

export function NvBreadcrumb({ items, className }: NvBreadcrumbProps) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center gap-2 text-[12px] text-[var(--nv-text-muted)]', className)}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {isLast || !item.href ? (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={
                  isLast
                    ? 'font-semibold text-[var(--nv-navy)]'
                    : 'text-[var(--nv-text-muted)]'
                }
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-[var(--nv-navy)]"
              >
                {item.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight
                size={12}
                strokeWidth={2}
                aria-hidden
                className="text-[var(--nv-text-muted)]"
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
