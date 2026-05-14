import { FileText } from 'lucide-react';
import { NvCard } from '@/components/nv';

type Props = {
  title: string | null;
  description: string | null;
  h1: string | null;
  wordCount: number | null;
};

export function ContentSection({ title, description, h1, wordCount }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Contenu
        </h2>
      </div>

      <NvCard padding="md">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Title
            </p>
            <p className="text-sm text-[var(--nv-text)] break-words">
              {title || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
              Meta description
            </p>
            <p className="text-sm text-[var(--nv-text)] break-words">
              {description || '—'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                H1
              </p>
              <p className="text-sm text-[var(--nv-text)] break-words">
                {h1 || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)] mb-1">
                Word count
              </p>
              <p className="text-sm text-[var(--nv-text)]">
                {wordCount !== null ? wordCount.toLocaleString('fr-FR') : '—'}
              </p>
            </div>
          </div>
        </div>
      </NvCard>
    </section>
  );
}
