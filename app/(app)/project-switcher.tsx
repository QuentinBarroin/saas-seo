'use client';

import { type ChangeEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';

type Project = { id: string; name: string };

type Props = {
  projects: Project[];
  /** Projet courant (cookie `nv_project`), null si aucun. */
  currentId: string | null;
};

/**
 * Sélecteur de projet de la sidebar. Le choix est persisté dans un cookie de
 * préférence (`nv_project`, non sensible) que le layout relit pour propager le
 * `?projectId=` à tous les liens de navigation. Changer de projet recharge la
 * page courante avec le nouveau projet.
 */
export function ProjectSwitcher({ projects, currentId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    document.cookie = `nv_project=${id}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(`${pathname}?projectId=${id}` as Route);
  }

  if (projects.length === 0) {
    return (
      <p className="mb-4 px-3 py-2 text-[12px] leading-relaxed text-white/45">
        Aucun projet. Crée-en un depuis le dashboard.
      </p>
    );
  }

  return (
    <div className="mb-4">
      <label
        htmlFor="nv-project-switcher"
        className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-wide text-white/45"
      >
        Projet
      </label>
      <select
        id="nv-project-switcher"
        defaultValue={currentId ?? ''}
        onChange={handleChange}
        className="nv-focus-ring w-full cursor-pointer rounded-[var(--nv-radius-sm)] border border-[var(--nv-navy-soft)] bg-[var(--nv-navy-soft)] px-3 py-2 text-[13px] font-medium text-white outline-none transition-colors hover:border-white/30"
      >
        <option value="" disabled>
          — Sélectionner —
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
