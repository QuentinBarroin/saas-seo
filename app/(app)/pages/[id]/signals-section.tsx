import { Code } from 'lucide-react';
import { NvCard, NvStatusBadge } from '@/components/nv';

type Props = {
  indexable: boolean | null;
  hasJsonLd: boolean | null;
  hasFaq: boolean | null;
  hasCta: boolean | null;
};

function getBooleanVariant(
  value: boolean | null
): React.ComponentProps<typeof NvStatusBadge>['variant'] {
  if (value === null) return 'pending';
  return value ? 'active' : 'neutral';
}

function getBooleanLabel(value: boolean | null): string {
  if (value === null) return 'Non défini';
  return value ? 'Oui' : 'Non';
}

export function SignalsSection({
  indexable,
  hasJsonLd,
  hasFaq,
  hasCta,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Code size={20} strokeWidth={2} className="text-[var(--nv-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--nv-navy)]">
          Signaux techniques
        </h2>
      </div>

      <NvCard padding="md">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)]">
              Indexable
            </p>
            <NvStatusBadge variant={getBooleanVariant(indexable)}>
              {getBooleanLabel(indexable)}
            </NvStatusBadge>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)]">
              JSON-LD
            </p>
            <NvStatusBadge variant={getBooleanVariant(hasJsonLd)}>
              {getBooleanLabel(hasJsonLd)}
            </NvStatusBadge>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)]">
              FAQ
            </p>
            <NvStatusBadge variant={getBooleanVariant(hasFaq)}>
              {getBooleanLabel(hasFaq)}
            </NvStatusBadge>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--nv-text-muted)]">
              CTA
            </p>
            <NvStatusBadge variant={getBooleanVariant(hasCta)}>
              {getBooleanLabel(hasCta)}
            </NvStatusBadge>
          </div>
        </div>
      </NvCard>
    </section>
  );
}
