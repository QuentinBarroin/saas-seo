import type { ReactNode } from 'react';
import { BarChart3, CheckCircle2, Lock } from 'lucide-react';
import { NvButton, NvCard, NvField, NvSelect, NvStatusBadge } from '@/components/nv';
import type { GscIntegration } from '@/lib/projects/integrations';
import type { GscPropertiesResult } from '@/lib/gsc/list-properties';
import { associateGscPropertyAction, disconnectGscAction } from './actions';

type Props = {
  projectId: string;
  gsc: GscIntegration | null;
  /** `GOOGLE_OAUTH_CLIENT_ID` présent dans l'environnement. */
  oauthConfigured: boolean;
  /** Propriétés GSC listées (null si projet non connecté). */
  properties: GscPropertiesResult | null;
};

function Notice({ tone, children }: { tone: 'muted' | 'error'; children: ReactNode }) {
  const styles =
    tone === 'error'
      ? 'border-[var(--nv-danger)]/40 bg-[var(--nv-danger-soft)] text-[var(--nv-danger)]'
      : 'border-[var(--nv-border)] bg-[var(--nv-bg)] text-[var(--nv-text-muted)]';
  return (
    <div className={`rounded-[var(--nv-radius-md)] border px-4 py-3 text-[13px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

export function GscCard({ projectId, gsc, oauthConfigured, properties }: Props) {
  const hasProperty = Boolean(gsc?.propertyUrl);
  const connectHref = `/api/integrations/google?projectId=${projectId}`;

  const badge = !oauthConfigured ? (
    <NvStatusBadge variant="neutral">Non configuré</NvStatusBadge>
  ) : !gsc ? (
    <NvStatusBadge variant="neutral">Non connecté</NvStatusBadge>
  ) : hasProperty ? (
    <NvStatusBadge variant="active">
      <Lock size={11} strokeWidth={2.5} />
      Configuré
    </NvStatusBadge>
  ) : (
    <NvStatusBadge variant="pending">Propriété à choisir</NvStatusBadge>
  );

  return (
    <NvCard padding="md">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--nv-accent-soft)]/40 text-[var(--nv-accent-deep)]">
            <BarChart3 size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-[var(--nv-navy)]">
              Google Search Console
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--nv-text-muted)]">
              Import des clics / impressions / position 90 jours. Refresh token OAuth chiffré
              AES-256-GCM par projet.
            </p>
          </div>
        </div>
        {badge}
      </div>

      {!oauthConfigured ? (
        <Notice tone="muted">
          L&apos;app OAuth Google n&apos;est pas configurée. Renseigne{' '}
          <span className="nv-numeric font-semibold">GOOGLE_OAUTH_CLIENT_ID</span> et{' '}
          <span className="nv-numeric font-semibold">GOOGLE_OAUTH_CLIENT_SECRET</span> dans{' '}
          <span className="nv-numeric font-semibold">.env</span> — guide pas-à-pas :{' '}
          <span className="nv-numeric font-semibold">docs/WORKFLOWS/setup-google-oauth.md</span>.
        </Notice>
      ) : !gsc ? (
        <div className="space-y-4">
          <p className="text-[13px] text-[var(--nv-text-muted)]">
            Connecte un compte Google ayant accès aux propriétés Search Console à auditer. Seul le
            scope lecture seule est demandé.
          </p>
          <NvButton asChild variant="primary" size="md">
            <a href={connectHref}>Connecter Google Search Console</a>
          </NvButton>
        </div>
      ) : (
        <div className="space-y-5">
          {hasProperty ? (
            <div className="flex items-start gap-2 rounded-[var(--nv-radius-md)] border border-[var(--nv-success)]/40 bg-[var(--nv-success-soft)] px-4 py-3 text-[13px] text-[var(--nv-success)]">
              <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
              <p>
                Propriété auditée :{' '}
                <span className="nv-numeric font-semibold">{gsc.propertyUrl}</span>
              </p>
            </div>
          ) : null}

          {properties && !properties.ok ? (
            <Notice tone="error">
              {properties.message}
              {properties.reason === 'auth_error'
                ? ' Utilise « Reconnecter le compte Google » ci-dessous.'
                : null}
            </Notice>
          ) : null}

          {properties && properties.ok && properties.sites.length === 0 ? (
            <Notice tone="muted">
              Aucune propriété accessible avec ce compte Google. Vérifie qu&apos;il dispose d&apos;un
              accès (au moins « lecture seule ») à des propriétés dans Search Console.
            </Notice>
          ) : null}

          {properties && properties.ok && properties.sites.length > 0 ? (
            <form action={associateGscPropertyAction} className="space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <NvField
                label={hasProperty ? 'Changer de propriété' : 'Choisir la propriété à auditer'}
                htmlFor="gsc-property"
                required
              >
                <NvSelect
                  id="gsc-property"
                  name="siteUrl"
                  required
                  defaultValue={gsc.propertyUrl ?? ''}
                  placeholder="Sélectionne une propriété"
                  options={properties.sites.map((s) => ({ label: s.siteUrl, value: s.siteUrl }))}
                />
              </NvField>
              <div className="flex justify-end">
                <NvButton type="submit" variant="primary" size="md">
                  Enregistrer la propriété
                </NvButton>
              </div>
            </form>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--nv-border)] pt-4">
            <a
              href={connectHref}
              className="nv-focus-ring rounded-[6px] text-[13px] font-medium text-[var(--nv-text-muted)] underline-offset-2 hover:text-[var(--nv-navy)] hover:underline"
            >
              Reconnecter le compte Google
            </a>
            <form action={disconnectGscAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <NvButton type="submit" variant="ghost" size="sm">
                Déconnecter
              </NvButton>
            </form>
          </div>
        </div>
      )}
    </NvCard>
  );
}
