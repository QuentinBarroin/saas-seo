'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { NvCard } from '@/components/nv';

type Props = {
  /** 'pending' | 'running'. */
  status: string;
  /** Heure de démarrage déjà formatée côté serveur (évite tout décalage d'hydratation). */
  startedLabel: string;
  /** Libellés des phases déjà terminées (issus du runLog). */
  completedPhases: string[];
};

const POLL_INTERVAL_MS = 4000;

/**
 * Bandeau « audit en cours » + auto-refresh (ADR-012).
 *
 * Tant qu'il est monté (= un audit est actif), il déclenche `router.refresh()`
 * périodiquement — un simple re-render du Server Component, pas de fetching de
 * données côté client. Quand l'audit se termine, le serveur ne rend plus ce
 * composant → le polling s'arrête de lui-même.
 */
export function AuditProgress({ status, startedLabel, completedPhases }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <NvCard padding="md">
      <div className="flex items-start gap-3">
        <Loader2
          size={20}
          strokeWidth={2}
          className="mt-0.5 shrink-0 animate-spin text-[var(--nv-accent-deep)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold tracking-tight text-[var(--nv-navy)]">
            {status === 'running' ? 'Audit en cours' : "Audit en file d'attente"}
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--nv-text-muted)]">
            Lancé à <span className="nv-numeric font-semibold">{startedLabel}</span> — le worker
            Inngest exécute crawl, détecteurs et connecteurs en arrière-plan. Cette page se met à
            jour automatiquement.
          </p>
          {completedPhases.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {completedPhases.map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="rounded-full border border-[var(--nv-success)]/40 bg-[var(--nv-success-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--nv-success)]"
                >
                  {label} ✓
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </NvCard>
  );
}
