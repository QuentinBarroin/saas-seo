import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import {
  suggestSeedKeywords,
  normalizeSuggestions,
  MAX_SUGGESTED_KEYWORDS,
} from '@/lib/keywords/suggest';

vi.mock('@/lib/ai/claude', () => {
  let mockClient: Partial<Anthropic> | null = null;
  return {
    getAnthropic: vi.fn(() => {
      if (!mockClient) throw new Error('Mock client not set');
      return mockClient;
    }),
    DEFAULT_MODEL: 'claude-sonnet-4-6',
    estimateCostUsd: vi.fn(() => 0.01),
    extractJsonBlock: (text: string) => {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      return start !== -1 && end > start ? text.slice(start, end + 1) : text.trim();
    },
    setMockClient: (client: Partial<Anthropic>) => {
      mockClient = client;
    },
  };
});

const claudeMock = await import('@/lib/ai/claude');
const setMockClient = (
  vi.mocked(claudeMock) as unknown as { setMockClient: (c: Partial<Anthropic>) => void }
).setMockClient;

const PROJECT = {
  name: 'Novera Talent',
  domain: 'novera-talent.com',
  type: 'lead gen',
  businessGoal: 'générer des leads recrutement',
  market: 'FR',
};

function clientReturning(text: string): Partial<Anthropic> {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text }],
        usage: { input_tokens: 500, cache_read_input_tokens: 0, output_tokens: 100 },
      }),
    },
  } as unknown as Partial<Anthropic>;
}

let originalKey: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-test';
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
});

describe('keywords/suggest · normalizeSuggestions', () => {
  it('trim + dédup insensible à la casse + retrait des vides', () => {
    expect(normalizeSuggestions(['  Audit SEO ', 'audit seo', '', '   ', 'recrutement'])).toEqual([
      'Audit SEO',
      'recrutement',
    ]);
  });

  it('cappe à MAX_SUGGESTED_KEYWORDS', () => {
    const many = Array.from({ length: 40 }, (_, i) => `keyword ${i}`);
    expect(normalizeSuggestions(many)).toHaveLength(MAX_SUGGESTED_KEYWORDS);
  });

  it('liste vide → tableau vide', () => {
    expect(normalizeSuggestions([])).toEqual([]);
  });
});

describe('keywords/suggest · suggestSeedKeywords', () => {
  it('no_api_key quand ANTHROPIC_API_KEY est absente', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await suggestSeedKeywords(PROJECT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no_api_key');
  });

  it('ok avec une réponse valide (suggestions normalisées)', async () => {
    setMockClient(
      clientReturning(
        JSON.stringify({
          keywords: ['cabinet recrutement', 'recrutement tech', 'cabinet recrutement', '  '],
        })
      )
    );
    const result = await suggestSeedKeywords(PROJECT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.keywords).toEqual(['cabinet recrutement', 'recrutement tech']);
    }
  });

  it('invalid_json quand la réponse n\'est pas du JSON', async () => {
    setMockClient(clientReturning('voici des mots-clés...'));
    const result = await suggestSeedKeywords(PROJECT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_json');
  });

  it('invalid_schema quand le JSON ne respecte pas le schema', async () => {
    setMockClient(clientReturning(JSON.stringify({ mots: ['x'] })));
    const result = await suggestSeedKeywords(PROJECT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_schema');
  });

  it('api_error quand le SDK Anthropic throw', async () => {
    setMockClient({
      messages: { create: vi.fn().mockRejectedValue(new Error('boom réseau')) },
    } as unknown as Partial<Anthropic>);
    const result = await suggestSeedKeywords(PROJECT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('api_error');
      expect(result.message).toContain('boom réseau');
    }
  });
});
