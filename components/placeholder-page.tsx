import { NvCard, NvPageHeader, NvStatusBadge } from '@/components/nv';

type Props = {
  title: string;
  description: string;
  sprintLabel: string;
  taskIds?: string[];
};

export function PlaceholderPage({ title, description, sprintLabel, taskIds }: Props) {
  return (
    <div className="space-y-8">
      <NvPageHeader title={title} subtitle={description} />
      <NvCard padding="lg">
        <div className="flex flex-col items-start gap-4">
          <NvStatusBadge variant="pending">{sprintLabel}</NvStatusBadge>
          <div className="space-y-2">
            <p className="text-[16px] font-semibold text-[var(--nv-navy)]">
              Pas encore disponible
            </p>
            <p className="text-[14px] leading-relaxed text-[var(--nv-text-muted)]">
              Cette section sera livrée en <strong>{sprintLabel}</strong>.
              {taskIds && taskIds.length > 0 ? (
                <>
                  {' Tâches : '}
                  <span className="font-mono text-[13px] text-[var(--nv-navy)]">
                    {taskIds.join(', ')}
                  </span>
                  .
                </>
              ) : null}
            </p>
            <p className="text-[13px] text-[var(--nv-text-muted)]">
              Lance d&apos;abord un audit depuis un projet créé sur le Dashboard.
            </p>
          </div>
        </div>
      </NvCard>
    </div>
  );
}
