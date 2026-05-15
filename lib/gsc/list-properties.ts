import { getGscIntegration } from '@/lib/projects/integrations';
import { listSites, refreshAccessToken, type GscSite } from '@/lib/connectors/gsc';

/**
 * Liste les propriétés GSC accessibles pour un projet connecté (S2-02).
 * Utilisé par la page `/settings/integrations` pour peupler le sélecteur de
 * propriété. Fait un refresh de token + un appel API à chaque rendu — coût
 * acceptable pour un outil interne mono-utilisateur.
 */

export type GscPropertiesResult =
  | { ok: true; sites: GscSite[] }
  | {
      ok: false;
      reason: 'not_connected' | 'no_oauth_app' | 'auth_error' | 'api_error';
      message: string;
    };

export async function listGscProperties(projectId: string): Promise<GscPropertiesResult> {
  const gsc = await getGscIntegration(projectId);
  if (!gsc) {
    return { ok: false, reason: 'not_connected', message: 'GSC non connecté pour ce projet' };
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, reason: 'no_oauth_app', message: 'App OAuth Google non configurée' };
  }

  const token = await refreshAccessToken({
    refreshToken: gsc.refreshToken,
    clientId,
    clientSecret,
  });
  if (!token.ok) {
    return {
      ok: false,
      reason: 'auth_error',
      message: `Échec du refresh token (${token.reason}). Reconnexion nécessaire.`,
    };
  }

  const sites = await listSites(token.tokens.accessToken);
  if (!sites.ok) {
    return { ok: false, reason: 'api_error', message: sites.message };
  }

  return { ok: true, sites: sites.sites };
}
