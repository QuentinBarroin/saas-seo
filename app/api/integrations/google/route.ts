import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildAuthUrl } from '@/lib/connectors/gsc';
import {
  GSC_STATE_COOKIE,
  GSC_STATE_MAX_AGE_S,
  encodeOAuthState,
  resolveGscRedirectUri,
} from '@/lib/gsc/oauth-state';

/**
 * `GET /api/integrations/google` — démarre la boucle OAuth Google (S2-01).
 *
 * Vérifie l'auth Supabase, génère un `state` anti-CSRF (projectId + nonce posé
 * en cookie httpOnly), puis redirige vers le consentement Google.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.redirect(new URL('/settings/integrations?gsc=error', req.url));
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?projectId=${projectId}&gsc=not_configured`, req.url)
    );
  }

  const nonce = randomBytes(16).toString('hex');
  const state = encodeOAuthState({ projectId, nonce });

  const authUrl = buildAuthUrl({
    clientId,
    redirectUri: resolveGscRedirectUri(req.url),
    state,
  });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GSC_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GSC_STATE_MAX_AGE_S,
  });
  return res;
}
