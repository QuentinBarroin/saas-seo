import { describe, expect, it } from 'vitest';
import {
  buildAuthHeader,
  createDataForSeoClient,
  DATAFORSEO_BASE_URL,
  testCredentials,
  type Fetcher,
} from '@/lib/connectors/dataforseo';

const CREDS = { login: 'user@example.com', password: 'pa$$word' };

function mockFetcher(routes: Record<string, { status: number; body: string }>): Fetcher {
  return async (url) => {
    const route = routes[url];
    if (route) return route;
    return { status: 404, body: '{"status_code":40400,"status_message":"Not found"}' };
  };
}

describe('dataforseo/client · buildAuthHeader', () => {
  it('encode `login:password` en Basic base64', () => {
    expect(buildAuthHeader({ login: 'a', password: 'b' })).toBe('Basic YTpi');
    // 'user@example.com:pa$$word' base64
    expect(buildAuthHeader(CREDS)).toMatch(/^Basic [A-Za-z0-9+/=]+$/);
  });
});

describe('dataforseo/client · createDataForSeoClient', () => {
  it('GET → forwarde l\'URL complète, Authorization Basic + Accept JSON', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    const fetcher: Fetcher = async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      return { status: 200, body: '{}' };
    };
    const client = createDataForSeoClient(CREDS, fetcher);
    await client.get('/appendix/user_data');
    expect(capturedUrl).toBe(`${DATAFORSEO_BASE_URL}/appendix/user_data`);
    expect(capturedHeaders.authorization).toMatch(/^Basic /);
    expect(capturedHeaders.accept).toBe('application/json');
  });

  it('POST → ajoute Content-Type JSON et sérialise le body', async () => {
    let capturedBody = '';
    let capturedHeaders: Record<string, string> = {};
    const fetcher: Fetcher = async (_url, init) => {
      capturedBody = init.body ?? '';
      capturedHeaders = init.headers;
      return { status: 200, body: '{}' };
    };
    const client = createDataForSeoClient(CREDS, fetcher);
    await client.post('/serp/google/organic/live', [{ keyword: 'foo' }]);
    expect(capturedHeaders['content-type']).toBe('application/json');
    expect(JSON.parse(capturedBody)).toEqual([{ keyword: 'foo' }]);
  });
});

describe('dataforseo/test-credentials', () => {
  const OK_BODY = JSON.stringify({
    status_code: 20000,
    status_message: 'Ok.',
    tasks: [
      {
        id: 'task1',
        status_code: 20000,
        status_message: 'Ok.',
        result: [
          {
            login: 'user@example.com',
            timezone: 'Europe/Paris',
            money: { balance: 42.5, currency: 'USD' },
          },
        ],
      },
    ],
  });

  it('200 + envelope OK → ok:true avec account', async () => {
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 200, body: OK_BODY },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.account.login).toBe('user@example.com');
      expect(r.account.timezone).toBe('Europe/Paris');
      expect(r.account.money?.balance).toBe(42.5);
    }
  });

  it('401 HTTP → unauthorized', async () => {
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 401, body: '' },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unauthorized');
  });

  it('200 + envelope status_code 40100 → unauthorized (DFS encode auth en envelope)', async () => {
    const body = JSON.stringify({
      status_code: 40100,
      status_message: 'Unauthorized.',
    });
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 200, body },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unauthorized');
  });

  it('500 HTTP → network', async () => {
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 503, body: '' },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('network');
  });

  it('body non-JSON → invalid_response', async () => {
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 200, body: '<html>error</html>' },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_response');
  });

  it('envelope status_code autre (ex 40400) → api_error', async () => {
    const body = JSON.stringify({ status_code: 40400, status_message: 'Quota exceeded.' });
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 200, body },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('api_error');
      expect(r.message).toContain('40400');
    }
  });

  it('20000 mais result sans login → invalid_response', async () => {
    const body = JSON.stringify({
      status_code: 20000,
      status_message: 'Ok.',
      tasks: [{ id: 't1', status_code: 20000, status_message: 'Ok.', result: [{}] }],
    });
    const fetcher = mockFetcher({
      [`${DATAFORSEO_BASE_URL}/appendix/user_data`]: { status: 200, body },
    });
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_response');
  });

  it('fetcher throw → network error capturée', async () => {
    const fetcher: Fetcher = async () => {
      throw new Error('ECONNREFUSED');
    };
    const r = await testCredentials(CREDS, fetcher);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('network');
      expect(r.message).toContain('ECONNREFUSED');
    }
  });
});
