type Props = {
  competitors: Array<{ domain: string; frequency: number; source: string }>;
};

export function CompetitorsTable({ competitors }: Props) {
  if (competitors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--nv-text-muted)]">
        Aucun concurrent détecté dans le top 10 des seed keywords.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--nv-radius-md)] ring-1 ring-[var(--nv-border)]">
      <table className="w-full border-collapse">
        <thead className="bg-[var(--nv-bg)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Rang
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Domaine
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Source
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Fréquence top 10
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--nv-border)] bg-[var(--nv-surface)]">
          {competitors.map((comp, idx) => (
            <tr
              key={comp.domain}
              className="transition-colors duration-[var(--nv-duration)] hover:bg-[var(--nv-bg)]"
            >
              <td className="nv-numeric px-4 py-3 text-sm font-semibold text-[var(--nv-text-muted)]">
                {idx + 1}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-[var(--nv-navy)]">
                {comp.domain}
              </td>
              <td className="px-4 py-3 text-center">
                {comp.source === 'manual' ? (
                  <span className="inline-flex items-center rounded-full bg-[var(--nv-gold)] px-2 py-0.5 text-xs font-medium text-[var(--nv-navy)]">
                    Manuel
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[var(--nv-bg)] px-2 py-0.5 text-xs font-medium text-[var(--nv-text-muted)]">
                    Auto
                  </span>
                )}
              </td>
              <td className="nv-numeric px-4 py-3 text-right text-sm font-semibold text-[var(--nv-navy)]">
                {comp.frequency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
