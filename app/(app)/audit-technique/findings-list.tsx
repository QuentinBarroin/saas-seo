'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { NvEmptyState, NvStatusBadge, NvCheckboxRow } from '@/components/nv';
import type { FindingDraft } from '@/lib/scoring/finding';
import type { Severity, RuleCategory } from '@/lib/scoring/rules';

type FindingsListProps = {
  findings: FindingDraft[];
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

const SEVERITY_VARIANTS: Record<Severity, 'danger' | 'pending' | 'neutral'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'pending',
  low: 'neutral',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  technical: 'Technique',
  content: 'Contenu',
  architecture: 'Architecture',
  conversion: 'Conversion',
  geo: 'GEO',
};

export function FindingsList({ findings }: FindingsListProps) {
  const [severityFilters, setSeverityFilters] = useState<Set<Severity>>(
    new Set(['critical', 'high', 'medium', 'low'])
  );
  const [categoryFilters, setCategoryFilters] = useState<Set<RuleCategory>>(
    new Set(['technical', 'content', 'architecture', 'conversion', 'geo'])
  );

  const handleSeverityToggle = (severity: Severity) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const handleCategoryToggle = (category: RuleCategory) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredAndSortedFindings = useMemo(() => {
    const filtered = findings.filter(
      (f) => severityFilters.has(f.severity) && categoryFilters.has(f.category)
    );
    return filtered.sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.category.localeCompare(b.category);
    });
  }, [findings, severityFilters, categoryFilters]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '…';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[var(--nv-navy)]">Sévérité</p>
          <div className="space-y-2">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map((severity) => (
              <NvCheckboxRow
                key={severity}
                label={SEVERITY_LABELS[severity]}
                checked={severityFilters.has(severity)}
                onChange={() => handleSeverityToggle(severity)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[var(--nv-navy)]">Catégorie</p>
          <div className="space-y-2">
            {(['technical', 'content', 'architecture', 'conversion', 'geo'] as RuleCategory[]).map(
              (category) => (
                <NvCheckboxRow
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  checked={categoryFilters.has(category)}
                  onChange={() => handleCategoryToggle(category)}
                />
              )
            )}
          </div>
        </div>
      </div>

      {filteredAndSortedFindings.length === 0 ? (
        <NvEmptyState
          icon={<Search size={28} strokeWidth={1.75} />}
          title="Aucun finding ne match les filtres"
          description="Ajuste les filtres de sévérité et catégorie pour voir plus de résultats."
        />
      ) : (
        <div className="overflow-x-auto rounded-[18px] border border-[var(--nv-border)] bg-[var(--nv-surface)] shadow-[var(--nv-shadow-soft)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--nv-border)] bg-[var(--nv-bg)]">
                <th className="px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
                  Sévérité
                </th>
                <th className="px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
                  Catégorie
                </th>
                <th className="px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
                  Problème
                </th>
                <th className="px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--nv-text-muted)]">
                  Recommandation
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFindings.map((finding, idx) => (
                <tr
                  key={`${finding.ruleId}-${idx}`}
                  className="border-b border-[var(--nv-border)] last:border-0 hover:bg-[var(--nv-bg)] transition-colors"
                >
                  <td className="px-5 py-4">
                    <NvStatusBadge variant={SEVERITY_VARIANTS[finding.severity]}>
                      {SEVERITY_LABELS[finding.severity]}
                    </NvStatusBadge>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[var(--nv-text-muted)]">
                    {CATEGORY_LABELS[finding.category]}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[14px] font-semibold text-[var(--nv-navy)]">
                      {finding.title}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--nv-text-muted)]">
                      {truncateText(finding.description, 120)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[var(--nv-text-muted)]">
                    {truncateText(finding.recommendation, 120)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
