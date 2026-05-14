import { describe, it, expect } from 'vitest';
import { fetchSerpLive } from '@/lib/connectors/dataforseo/fetch-serp-live';
import type { DataForSeoCredentials, Fetcher, DataForSeoEnvelope } from '@/lib/connectors/dataforseo/types';

const mockCreds: DataForSeoCredentials = { login: 'test', password: 'test' };

describe('fetchSerpLive', () => {
  it('happy path: 10 organic + 4 PAA, costUsd extracted', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.002,
        tasks: [
          {
            id: 'task-123',
            status_code: 20000,
            status_message: 'Ok.',
            result: [
              {
                items: [
                  {
                    type: 'organic',
                    rank_absolute: 1,
                    url: 'https://example.com/page1',
                    title: 'Page 1',
                    description: 'Snippet 1',
                    domain: 'example.com',
                  },
                  {
                    type: 'organic',
                    rank_absolute: 2,
                    url: 'https://example.com/page2',
                    domain: 'example.com',
                  },
                  {
                    type: 'people_also_ask',
                    items: [{ title: 'Question 1?' }, { title: 'Question 2?' }],
                  },
                  {
                    type: 'organic',
                    rank_absolute: 3,
                    url: 'https://example.com/page3',
                    domain: 'example.com',
                  },
                ],
              },
            ],
          },
        ],
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };

    const result = await fetchSerpLive(mockCreds, { keyword: 'test keyword' }, mockFetcher);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.keyword).toBe('test keyword');
      expect(result.organic).toHaveLength(3);
      expect(result.organic[0]?.rank).toBe(1);
      expect(result.organic[0]?.title).toBe('Page 1');
      expect(result.organic[0]?.snippet).toBe('Snippet 1');
      expect(result.paa).toEqual(['Question 1?', 'Question 2?']);
      expect(result.costUsd).toBe(0.002);
    }
  });

  it('401 → unauthorized', async () => {
    const mockFetcher: Fetcher = async () => ({ status: 401, body: '' });
    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unauthorized');
      expect(result.status).toBe(401);
    }
  });

  it('status 200 + status_code DFS 40101 → unauthorized', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 40101,
        status_message: 'Unauthorized',
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };
    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unauthorized');
    }
  });

  it('network error → network', async () => {
    const mockFetcher: Fetcher = async () => {
      throw new Error('Connection refused');
    };
    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('network');
      expect(result.message).toContain('Connection refused');
    }
  });

  it('JSON parse fail → invalid_response', async () => {
    const mockFetcher: Fetcher = async () => ({ status: 200, body: 'not-json{' });
    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_response');
      expect(result.message).toContain('non-JSON');
    }
  });

  it('status_code 50000 (DFS error) → api_error', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 50000,
        status_message: 'Internal error',
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };
    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('api_error');
      expect(result.message).toContain('50000');
    }
  });

  it('PAA nested in items[] (real DFS case)', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.001,
        tasks: [
          {
            id: 'task-123',
            status_code: 20000,
            status_message: 'Ok.',
            result: [
              {
                items: [
                  {
                    type: 'people_also_ask',
                    items: [{ title: 'Q1' }, { title: 'Q2' }, { title: 'Q3' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };

    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paa).toEqual(['Q1', 'Q2', 'Q3']);
    }
  });

  it('url without domain DFS → extraction via URL()', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.001,
        tasks: [
          {
            id: 'task-123',
            status_code: 20000,
            status_message: 'Ok.',
            result: [
              {
                items: [
                  {
                    type: 'organic',
                    rank_absolute: 1,
                    url: 'https://example.org/test',
                  },
                ],
              },
            ],
          },
        ],
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };

    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.organic).toHaveLength(1);
      expect(result.organic[0]?.domain).toBe('example.org');
    }
  });

  it('empty result → ok but empty arrays', async () => {
    const mockFetcher: Fetcher = async () => {
      const envelope: DataForSeoEnvelope<unknown> = {
        status_code: 20000,
        status_message: 'Ok.',
        cost: 0.001,
        tasks: [
          {
            id: 'task-123',
            status_code: 20000,
            status_message: 'Ok.',
            result: [{ items: [] }],
          },
        ],
      };
      return { status: 200, body: JSON.stringify(envelope) };
    };

    const result = await fetchSerpLive(mockCreds, { keyword: 'test' }, mockFetcher);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.organic).toEqual([]);
      expect(result.paa).toEqual([]);
    }
  });
});
