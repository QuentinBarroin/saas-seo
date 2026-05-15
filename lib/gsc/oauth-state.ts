/**
 * State OAuth GSC (S2-01) — protection CSRF du flow.
 *
 * Le `state` transporte le `projectId` (pour savoir quel projet associer au
 * retour) + un `nonce` aléatoire. Le nonce est aussi posé dans un cookie
 * httpOnly : le callback vérifie l'égalité des deux → un attaquant ne peut pas
 * forger un callback valide sans connaître le cookie de la victime.
 */

export const GSC_STATE_COOKIE = 'gsc_oauth_state';
/** Durée de vie du cookie de state (le temps du consentement Google). */
export const GSC_STATE_MAX_AGE_S = 600;

export type OAuthState = { projectId: string; nonce: string };

export function encodeOAuthState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

export function decodeOAuthState(raw: string): OAuthState | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'projectId' in parsed &&
      'nonce' in parsed &&
      typeof parsed.projectId === 'string' &&
      parsed.projectId.length > 0 &&
      typeof parsed.nonce === 'string' &&
      parsed.nonce.length > 0
    ) {
      return { projectId: parsed.projectId, nonce: parsed.nonce };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * URI de redirection OAuth. Priorité à `GOOGLE_OAUTH_REDIRECT_URI` (doit
 * correspondre EXACTEMENT à l'URI enregistrée dans Google Cloud Console) ;
 * à défaut, dérivée de l'origine de la requête.
 */
export function resolveGscRedirectUri(requestUrl: string): string {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    new URL('/api/integrations/google/callback', requestUrl).toString()
  );
}
