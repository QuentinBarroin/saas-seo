'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

type NvModalProps = {
  isOpen?: boolean;
  onClose: () => void;
  size?: Size;
  /** Bloque close-on-overlay-click et ESC (ex: pendant un submit en cours). */
  locked?: boolean;
  ariaLabelledBy?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizeClasses: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  xxl: 'max-w-6xl',
};

export function NvModal({
  isOpen = true,
  onClose,
  size = 'md',
  locked = false,
  ariaLabelledBy,
  children,
}: NvModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const id = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panel).focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('inert'));
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, locked, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      onClick={() => !locked && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'nv-fade-in max-h-[90vh] w-full overflow-y-auto rounded-[var(--nv-radius-xl)] border border-[var(--nv-border)] bg-[var(--nv-surface)] text-[var(--nv-text)] shadow-[var(--nv-shadow-premium)] focus:outline-none',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    </div>
  );
}

type NvModalHeaderProps = {
  eyebrow?: string;
  title: string;
  icon?: ReactNode;
  onClose?: () => void;
  closeDisabled?: boolean;
};

export function NvModalHeader({
  eyebrow,
  title,
  icon,
  onClose,
  closeDisabled = false,
}: NvModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-[var(--nv-border)] bg-[var(--nv-surface)] px-7 py-5">
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="nv-eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-[20px] font-bold leading-snug tracking-tight text-[var(--nv-navy)]">
          {title}
        </h2>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          disabled={closeDisabled}
          className="nv-focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--nv-text-muted)] transition-colors hover:bg-[var(--nv-bg)] hover:text-[var(--nv-navy)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Fermer"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function NvModalBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('px-7 py-6', className)}>{children}</div>;
}

export function NvModalFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex items-center justify-end gap-3 border-t border-[var(--nv-border)] bg-[var(--nv-surface)] px-7 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}
