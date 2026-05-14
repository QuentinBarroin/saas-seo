import { ExternalLink } from 'lucide-react';

type Props = {
  organic: Array<{
    rank: number;
    url: string;
    title: string | null;
    snippet: string | null;
    domain: string;
  }>;
};

export function OrganicTable({ organic }: Props) {
  return (
    <div className="overflow-hidden rounded-[var(--nv-radius-md)] ring-1 ring-[var(--nv-border)]">
      <table className="w-full border-collapse">
        <thead className="bg-[var(--nv-bg)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Rang
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Résultat
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
              Domaine
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--nv-border)] bg-[var(--nv-surface)]">
          {organic.map((row) => (
            <tr
              key={`${row.rank}-${row.url}`}
              className="transition-colors duration-[var(--nv-duration)] hover:bg-[var(--nv-bg)]"
            >
              <td className="nv-numeric px-4 py-4 text-sm font-semibold text-[var(--nv-navy)]">
                {row.rank}
              </td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nv-navy)] hover:text-[var(--nv-accent-deep)] hover:underline"
                  >
                    <span>{row.title ?? 'Sans titre'}</span>
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                  {row.snippet && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[var(--nv-text-muted)]">
                      {row.snippet}
                    </p>
                  )}
                  <p className="text-xs text-[var(--nv-text-dim)]">{row.url}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center rounded-md bg-[var(--nv-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--nv-accent-deep)]">
                  {row.domain}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
