'use client';

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { cn } from '@/lib/utils';

/* ─── NvField — label + hint + error wrapper ─────────────────────────── */
type NvFieldProps = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  /** 'dark' inverse label/hint colors pour fonds sombres (auth, modals on overlay). */
  tone?: 'light' | 'dark';
  htmlFor?: string;
};

export function NvField({
  label,
  required,
  hint,
  error,
  children,
  className,
  tone = 'light',
  htmlFor,
}: NvFieldProps) {
  const labelColor = tone === 'dark' ? 'text-white' : 'text-[var(--nv-navy)]';
  const hintColor = tone === 'dark' ? 'text-white/60' : 'text-[var(--nv-text-muted)]';
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn('mb-2 block text-[13px] font-semibold tracking-tight', labelColor)}
        >
          {label}
          {required && <span className="ml-1 text-[var(--nv-danger)]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-[var(--nv-danger)]">{error}</p>
      ) : hint ? (
        <p className={cn('mt-1.5 text-[12px] leading-relaxed', hintColor)}>{hint}</p>
      ) : null}
    </div>
  );
}

/* ─── NvInput ─────────────────────────────────────────────────────────── */
type NvInputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const NvInput = forwardRef<HTMLInputElement, NvInputProps>(
  ({ invalid, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'nv-focus-ring h-11 w-full rounded-[var(--nv-radius-md)] border bg-[var(--nv-surface)] px-4 text-[14px] text-[var(--nv-navy)] outline-none placeholder:text-[var(--nv-text-dim)] transition-colors',
        invalid
          ? 'border-[var(--nv-danger)] bg-[var(--nv-danger-soft)]'
          : 'border-[var(--nv-border)] hover:border-[var(--nv-border-strong)] focus:border-[var(--nv-navy)]',
        className
      )}
      {...props}
    />
  )
);
NvInput.displayName = 'NvInput';

/* ─── NvTextarea ──────────────────────────────────────────────────────── */
type NvTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const NvTextarea = forwardRef<HTMLTextAreaElement, NvTextareaProps>(
  ({ invalid, className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'nv-focus-ring w-full resize-none rounded-[var(--nv-radius-md)] border bg-[var(--nv-surface)] px-4 py-3 text-[14px] text-[var(--nv-navy)] outline-none placeholder:text-[var(--nv-text-dim)] transition-colors',
        invalid
          ? 'border-[var(--nv-danger)] bg-[var(--nv-danger-soft)]'
          : 'border-[var(--nv-border)] hover:border-[var(--nv-border-strong)] focus:border-[var(--nv-navy)]',
        className
      )}
      {...props}
    />
  )
);
NvTextarea.displayName = 'NvTextarea';

/* ─── NvSelect ────────────────────────────────────────────────────────── */
type NvSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
};

export const NvSelect = forwardRef<HTMLSelectElement, NvSelectProps>(
  ({ invalid, className, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'nv-focus-ring h-11 w-full cursor-pointer appearance-none rounded-[var(--nv-radius-md)] border bg-[var(--nv-surface)] pl-4 pr-10 text-[14px] text-[var(--nv-navy)] outline-none transition-colors',
          invalid
            ? 'border-[var(--nv-danger)] bg-[var(--nv-danger-soft)]'
            : 'border-[var(--nv-border)] hover:border-[var(--nv-border-strong)] focus:border-[var(--nv-navy)]',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--nv-text-muted)]"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
);
NvSelect.displayName = 'NvSelect';

/* ─── NvCheckboxRow ───────────────────────────────────────────────────── */
type NvCheckboxRowProps = {
  label: ReactNode;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function NvCheckboxRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: NvCheckboxRowProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-[var(--nv-radius-md)] border border-[var(--nv-border)] bg-[var(--nv-surface)] px-4 py-3 transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-[var(--nv-border-strong)] hover:bg-[var(--nv-bg)]'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold tracking-tight text-[var(--nv-navy)]">{label}</p>
        {hint && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--nv-text-muted)]">{hint}</p>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="nv-focus-ring mt-0.5 h-4 w-4 rounded border-[var(--nv-border-strong)] accent-[var(--nv-navy)]"
      />
    </label>
  );
}
