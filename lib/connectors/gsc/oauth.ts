import { z } from 'zod';
import { undiciFetcher } from './client';
import type { GscError, GscFetcher, GscOAuthTokens } from './types';

/** Endpoint d'autorisation OAuth2 de Google (consentement utilisateur). */
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
/** Endpoint d'échange / refresh de token. */
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** Scope minimal : lecture seule Search Console. */
export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

/**
 * Construit l'URL de consentement Google.
 *
 * `access_type=offline` + `prompt=consent` garantissent qu'un `refresh_token`
 * est renvoyé même si l'utilisateur a déjà autorisé l'app — sans ça, Google
 * n'envoie le refresh token qu'au tout premier consentement.
 */
export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GSC_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', params.state);
  return url.toString();
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number(),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().optional().default(''),
  token_type: z.string().optional().default('Bearer'),
});

const tokenErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

export type GscTokenResult = { ok: true; tokens: GscOAuthTokens } | GscError;

async function postToken(
  fetcher: GscFetcher,
  form: Record<string, string>
): Promise<GscTokenResult> {
  let response;
  try {
    response = await fetcher(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams(form).toString(),
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      status: 0,
      message: err instanceof Error ? err.message : 'Erreur réseau Google OAuth',
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Réponse OAuth Google non-JSON',
    };
  }

  if (response.status >= 400) {
    const parsedError = tokenErrorSchema.safeParse(json);
    const reason =
      parsedError.success && parsedError.data.error === 'invalid_grant'
        ? 'invalid_grant'
        : 'api_error';
    const message = parsedError.success
      ? `${parsedError.data.error}: ${parsedError.data.error_description ?? ''}`.trim()
      : `Erreur OAuth Google (${response.status})`;
    return { ok: false, reason, status: response.status, message };
  }

  const parsed = tokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Shape de réponse token OAuth Google inattendue',
    };
  }

  return {
    ok: true,
    tokens: {
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token,
      expiresIn: parsed.data.expires_in,
      scope: parsed.data.scope,
      tokenType: parsed.data.token_type,
    },
  };
}

/** Échange un `code` d'autorisation contre un access + refresh token. */
export async function exchangeCodeForTokens(
  params: { code: string; clientId: string; clientSecret: string; redirectUri: string },
  fetcher: GscFetcher = undiciFetcher
): Promise<GscTokenResult> {
  return postToken(fetcher, {
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });
}

/** Régénère un access token à partir d'un refresh token stocké. */
export async function refreshAccessToken(
  params: { refreshToken: string; clientId: string; clientSecret: string },
  fetcher: GscFetcher = undiciFetcher
): Promise<GscTokenResult> {
  return postToken(fetcher, {
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'refresh_token',
  });
}
