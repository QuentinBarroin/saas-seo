'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
      <div className="space-y-2">
        <Label htmlFor="name">Nom du projet</Label>
        <Input id="name" name="name" required maxLength={100} placeholder="Shooting Pilot" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domaine</Label>
        <Input id="domain" name="domain" type="url" required placeholder="https://shootingpilot.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repoUrl">URL du repo (optionnel)</Label>
        <Input id="repoUrl" name="repoUrl" type="url" placeholder="https://github.com/org/repo" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" required defaultValue="saas">
            {PROJECT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="market">Marché</Label>
          <Input id="market" name="market" defaultValue="FR" maxLength={10} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none">Objectifs business</legend>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
          {BUSINESS_GOAL_OPTIONS.map((g) => (
            <label key={g.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="businessGoals"
                value={g.value}
                className="h-4 w-4 rounded border-input"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="competitors">Concurrents (1 domaine par ligne)</Label>
        <Textarea
          id="competitors"
          name="competitors"
          rows={4}
          placeholder={'concurrent1.com\nconcurrent2.com'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seedKeywords">Seed keywords (1 par ligne)</Label>
        <Textarea
          id="seedKeywords"
          name="seedKeywords"
          rows={4}
          placeholder={'audit seo\nbacklog claude code'}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  );
}
