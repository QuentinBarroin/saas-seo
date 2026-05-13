import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'plain' | 'soft' | 'premium';
type Padding = 'sm' | 'md' | 'lg';

type NvCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  padding?: Padding;
  children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  plain:
    'bg-[var(--nv-surface)] border border-[var(--nv-border)] shadow-[var(--nv-shadow-soft)]',
  soft: 'bg-[var(--nv-surface)] border border-[var(--nv-border)]',
  premium:
    'bg-[var(--nv-navy)] text-white border border-[var(--nv-navy-soft)] shadow-[var(--nv-shadow-premium)]',
};

const paddingClasses: Record<Padding, string> = {
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-8',
};

export function NvCard({
  variant = 'plain',
  padding = 'md',
  className,
  children,
  ...props
}: NvCardProps) {
  return (
    <div
      className={cn(
        'rounded-[18px] transition-shadow duration-200 ease-out',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
