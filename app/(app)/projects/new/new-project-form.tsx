'use client';

import { useActionState } from 'react';
import {
  NvButton,
  NvField,
  NvInput,
  NvSelect,
  NvTextarea,
} from '@/components/nv';
import { createProjectAction, type CreateProjectState } from './actions';

const initialState: CreateProjectState = {};

const PROJECT_TYPE_OPTIONS = [
  { value: 'saas', label: 'SaaS' },
  { value: 'local_seo', label: 'Local SEO' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'blog', label: 'Blog / contenu' },
  { value: 'lead_gen', label: 'Lead gen' },
];

const BUSINESS_GOAL_OPTIONS = [
  { value: 'demos', label: 'Démos' },
  { value: 'leads', label: 'Leads' },
  { value: 'inscriptions', label: 'Inscriptions' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'visibilite', label: 'Visibilité' },
];

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <NvField label="Nom du projet" required htmlFor="name">
        <NvInput id="name" name="name" required maxLength={100} placeholder="Shooting Pilot" />
      </NvField>

      <NvField label="Domaine" required htmlFor="domain" hint="URL complète avec https://">
        <NvInput
          id="domain"
          name="domain"
          type="url"
          required
          placeholder="https://shootingpilot.com"
        />
      </NvField>

      <NvField label="URL du repo" htmlFor="repoUrl" hint="Optionnel — pour scan code Next.js">
        <NvInput
          id="repoUrl"
          name="repoUrl"
          type="url"
          placeholder="https://github.com/org/repo"
        />
      </NvField>

      <div className="grid grid-cols-2 gap-4">
        <NvField label="Type" required htmlFor="type">
          <NvSelect
            id="type"
            name="type"
            required
            defaultValue="saas"
            options={PROJECT_TYPE_OPTIONS}
          />
        </NvField>
        <NvField label="Marché" htmlFor="market">
          <NvInput id="market" name="market" defaultValue="FR" maxLength={10} />
        </NvField>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-[13px] font-semibold tracking-tight text-[var(--nv-navy)]">
          Objectifs business
          <span className="ml-1 text-[var(--nv-danger)]">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
          {BUSINESS_GOAL_OPTIONS.map((g) => (
            <label
              key={g.value}
              className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--nv-navy)]"
            >
              <input
                type="checkbox"
                name="businessGoals"
                value={g.value}
                className="nv-focus-ring h-4 w-4 rounded border-[var(--nv-border-strong)] accent-[var(--nv-navy)]"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      <NvField
        label="Concurrents"
        htmlFor="competitors"
        hint="1 domaine par ligne (ex: concurrent1.com)"
      >
        <NvTextarea
          id="competitors"
          name="competitors"
          rows={4}
          placeholder={'concurrent1.com\nconcurrent2.com'}
        />
      </NvField>

      <NvField
        label="Seed keywords"
        htmlFor="seedKeywords"
        hint="1 mot-clé par ligne — point de départ avant import GSC/DataForSEO"
      >
        <NvTextarea
          id="seedKeywords"
          name="seedKeywords"
          rows={4}
          placeholder={'audit seo\nbacklog claude code'}
        />
      </NvField>

      {state.error ? (
        <p role="alert" className="text-[13px] text-[var(--nv-danger)]">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <NvButton type="submit" disabled={pending} variant="primary">
          {pending ? 'Création…' : 'Créer le projet'}
        </NvButton>
      </div>
    </form>
  );
}
