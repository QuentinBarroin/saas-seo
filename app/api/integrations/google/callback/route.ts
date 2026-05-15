import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/connectors/gsc';
import { setGscConnection } from '@/lib/projects/integrations';
import {
  GSC_STATE_COOKIE,
  decodeOAuthState,
  resolveGscRedirectUri,
} from '@/lib/gsc/oauth-state';

/**
 * `GET /api/integrations/google/callback` — fin de la boucle OAuth (S2-01).
 *
 * Vérifie le state anti-CSRF, échange le `code` contre un refresh token, et
 * stocke ce dernier chiffré dans `SeoProject.integrationsEnc`. Redirige
 * toujours vers `/settings/integrations` avec un statut `?gsc=...`.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const params = req.nextUrl.searchParams;
  const oauthError = params.get('error');
  const code = params.get('code');
  const rawState = params.get('state');
  const state = rawState ? decodeOAuthState(rawState) : null;
  const projectId = state?.projectId ?? null;

  /** Redirige vers la page integrations avec un statut, et purge le cookie de state. */
  const back = (status: string): NextResponse => {
    const target = projectId
      ? `/settings/integrations?projectId=${projectId}&gsc=${status}`
      : `/settings/integrations?gsc=${status}`;
    const res = NextResponse.redirect(new URL(target, req.url));
    res.cookies.delete(GSC_STATE_COOKIE);
    return res;
  };

  if (oauthError) {
    return back(oauthError === 'access_denied' ? 'denied' : 'error');
  }

  if (!code || !state) {
    return back('error');
  }

  // Anti-CSRF : le nonce du state doit correspondre au cookie httpOnly.
  const cookieNonce = req.cookies.get(GSC_STATE_COOKIE)?.value;
  if (!cookieNonce || cookieNonce !== state.nonce) {
    return back('error');
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return back('not_configured');
  }

  const exchanged = await exchangeCodeForTokens({
    code,
    clientId,
    clientSecret,
    redirectUri: resolveGscRedirectUri(req.url),
  });

  if (!exchanged.ok) {
    return back('error');
  }

  if (!exchanged.tokens.refreshToken) {
    // Google n'a pas renvoyé de refresh token (consentement déjà accordé sans
    // `prompt=consent`). buildAuthUrl force ce prompt — ce cas est défensif.
    return back('no_refresh_token');
  }

  try {
    await setGscConnection(state.projectId, exchanged.tokens.refreshToken);
  } catch {
    return back('error');
  }

  return back('connected');
}
