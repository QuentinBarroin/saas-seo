import { describe, expect, it } from 'vitest';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  GSC_SCOPE,
  type GscFetcher,
} from '@/lib/connectors/gsc';

const AUTH_PARAMS = {
  clientId: 'client-123.apps.googleusercontent.com',
  redirectUri: 'http://localhost:3434/api/integrations/google/callback',
  state: 'encoded-state',
};

const okTokenBody = JSON.stringify({
  access_token: 'ya29.access',
  expires_in: 3599,
  refresh_token: '1//refresh-token',
  scope: GSC_SCOPE,
  token_type: 'Bearer',
});

describe('gsc/oauth · buildAuthUrl', () => {
  it('construit une URL de consentement complète', () => {
    const url = new URL(buildAuthUrl(AUTH_PARAMS));
    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_AUTH_URL);
    expect(url.searchParams.get('client_id')).toBe(AUTH_PARAMS.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(AUTH_PARAMS.redirectUri);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe(GSC_SCOPE);
    expect(url.searchParams.get('state')).toBe('encoded-state');
  });

  it('force access_type=offline + prompt=consent (pour obtenir un refresh token)', () => {
    const url = new URL(buildAuthUrl(AUTH_PARAMS));
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
  });
});

describe('gsc/oauth · exchangeCodeForTokens', () => {
  it('échange un code valide → tokens', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    const fetcher: GscFetcher = async (url, init) => {
      capturedUrl = url;
      capturedBody = init.body ?? '';
      return { status: 200, body: okTokenBody };
    };

    const result = await exchangeCodeForTokens(
      { code: 'auth-code', clientId: 'cid', clientSecret: 'secret', redirectUri: 'http://x/cb' },
      fetcher
    );

    expect(capturedUrl).toBe(GOOGLE_TOKEN_URL);
    expect(capturedBody).toContain('grant_type=authorization_code');
    expect(capturedBody).toContain('code=auth-code');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tokens.accessToken).toBe('ya29.access');
      expect(result.tokens.refreshToken).toBe('1//refresh-token');
      expect(result.tokens.expiresIn).toBe(3599);
    }
  });

  it('code expiré (invalid_grant) → reason invalid_grant', async () => {
    const fetcher: GscFetcher = async () => ({
      status: 400,
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Bad Request' }),
    });
    const result = await exchangeCodeForTokens(
      { code: 'stale', clientId: 'c', clientSecret: 's', redirectUri: 'http://x/cb' },
      fetcher
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_grant');
  });

  it('autre erreur 4xx → reason api_error', async () => {
    const fetcher: GscFetcher = async () => ({
      status: 401,
      body: JSON.stringify({ error: 'unauthorized_client' }),
    });
    const result = await exchangeCodeForTokens(
      { code: 'c', clientId: 'c', clientSecret: 's', redirectUri: 'http://x/cb' },
      fetcher
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('api_error');
  });

  it('réponse non-JSON → reason invalid_response', async () => {
    const fetcher: GscFetcher = async () => ({ status: 200, body: '<html>oops</html>' });
    const result = await exchangeCodeForTokens(
      { code: 'c', clientId: 'c', clientSecret: 's', redirectUri: 'http://x/cb' },
      fetcher
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_response');
  });

  it('erreur réseau → reason network', async () => {
    const fetcher: GscFetcher = async () => {
      throw new Error('ECONNREFUSED');
    };
    const result = await exchangeCodeForTokens(
      { code: 'c', clientId: 'c', clientSecret: 's', redirectUri: 'http://x/cb' },
      fetcher
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('network');
  });
});

describe('gsc/oauth · refreshAccessToken', () => {
  it('régénère un access token (sans refresh token dans la réponse)', async () => {
    let capturedBody = '';
    const fetcher: GscFetcher = async (_url, init) => {
      capturedBody = init.body ?? '';
      return {
        status: 200,
        body: JSON.stringify({ access_token: 'ya29.fresh', expires_in: 3599 }),
      };
    };

    const result = await refreshAccessToken(
      { refreshToken: '1//rt', clientId: 'c', clientSecret: 's' },
      fetcher
    );

    expect(capturedBody).toContain('grant_type=refresh_token');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tokens.accessToken).toBe('ya29.fresh');
      expect(result.tokens.refreshToken).toBeUndefined();
    }
  });

  it('refresh token révoqué → reason invalid_grant', async () => {
    const fetcher: GscFetcher = async () => ({
      status: 400,
      body: JSON.stringify({ error: 'invalid_grant' }),
    });
    const result = await refreshAccessToken(
      { refreshToken: '1//revoked', clientId: 'c', clientSecret: 's' },
      fetcher
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_grant');
  });
});
