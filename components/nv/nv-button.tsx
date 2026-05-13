import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type NvButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--nv-accent)] text-[var(--nv-navy)] hover:bg-[var(--nv-accent-soft)] font-bold',
  secondary:
    'bg-[var(--nv-surface)] text-[var(--nv-navy)] border border-[var(--nv-border)] hover:bg-[var(--nv-bg)] font-semibold',
  dark: 'bg-[var(--nv-navy)] text-white hover:bg-[var(--nv-navy-soft)] font-semibold',
  ghost: 'bg-transparent text-[var(--nv-navy)] hover:bg-[var(--nv-bg)] font-medium',
  danger: 'bg-[var(--nv-danger)] text-white hover:opacity-90 font-semibold',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-12 px-7 text-[15px]',
};

export const NvButton = forwardRef<HTMLButtonElement, NvButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'nv-focus-ring inline-flex items-center justify-center gap-2 rounded-[12px] tracking-tight transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
NvButton.displayName = 'NvButton';
