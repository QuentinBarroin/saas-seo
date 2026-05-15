import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateBacklog } from '@/lib/backlog/generate';
import type Anthropic from '@anthropic-ai/sdk';

vi.mock('@/lib/ai/claude', () => {
  let mockClient: Partial<Anthropic> | null = null;

  return {
    getAnthropic: vi.fn(() => {
      if (!mockClient) {
        throw new Error('Mock client not set');
      }
      return mockClient;
    }),
    DEFAULT_MODEL: 'claude-sonnet-4-6',
    estimateCostUsd: vi.fn((input: number, cached: number, output: number) => {
      return (input / 1_000_000) * 3.0 + (cached / 1_000_000) * 0.3 + (output / 1_000_000) * 15.0;
    }),
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
const setMockClient = (vi.mocked(claudeMock) as unknown as { setMockClient: (client: Partial<Anthropic>) => void }).setMockClient;

describe('generateBacklog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no_findings when findings array is empty', async () => {
    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('no_findings');
    }
  });

  it('returns ok with valid items when Claude response is valid', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [
                {
                  sourceFindingId: 'finding-1',
                  title: 'Fix title',
                  description: 'Fix the title tag',
                  priority: 'P0',
                  effort: 'S',
                  category: 'technical',
                  filePathsTargeted: [],
                  testsExpected: [],
                  definitionOfDone: 'Title fixed',
                  acceptanceCriteria: [],
                  claudePrompt: 'Fix the title tag in app/layout.tsx',
                },
              ],
            }),
          },
        ],
        usage: {
          input_tokens: 1000,
          cache_read_input_tokens: 500,
          output_tokens: 200,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: 'https://test.com',
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.sourceFindingId).toBe('finding-1');
      expect(result.filteredCount).toBe(0);
    }
  });

  it('filters out items with invalid sourceFindingId', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [
                {
                  sourceFindingId: 'finding-1',
                  title: 'Fix title',
                  description: 'Fix the title tag',
                  priority: 'P0',
                  effort: 'S',
                  category: 'technical',
                  filePathsTargeted: [],
                  testsExpected: [],
                  definitionOfDone: 'Title fixed',
                  acceptanceCriteria: [],
                  claudePrompt: 'Fix the title tag',
                },
                {
                  sourceFindingId: 'invalid-finding',
                  title: 'Invalid',
                  description: 'Invalid finding',
                  priority: 'P1',
                  effort: 'M',
                  category: 'technical',
                  filePathsTargeted: [],
                  testsExpected: [],
                  definitionOfDone: '',
                  acceptanceCriteria: [],
                  claudePrompt: 'Invalid',
                },
              ],
            }),
          },
        ],
        usage: {
          input_tokens: 1000,
          cache_read_input_tokens: 0,
          output_tokens: 300,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.sourceFindingId).toBe('finding-1');
      expect(result.filteredCount).toBe(1);
    }
  });

  it('returns invalid_schema when all items are filtered', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [
                {
                  sourceFindingId: 'invalid-1',
                  title: 'Invalid',
                  description: 'Invalid',
                  priority: 'P0',
                  effort: 'S',
                  category: 'technical',
                  filePathsTargeted: [],
                  testsExpected: [],
                  definitionOfDone: '',
                  acceptanceCriteria: [],
                  claudePrompt: 'Invalid',
                },
              ],
            }),
          },
        ],
        usage: {
          input_tokens: 1000,
          cache_read_input_tokens: 0,
          output_tokens: 200,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_schema');
      expect(result.message).toContain('filtered out');
    }
  });

  it('returns over_budget when cost exceeds maxBudgetUsd', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ items: [] }),
          },
        ],
        usage: {
          input_tokens: 100_000,
          cache_read_input_tokens: 0,
          output_tokens: 50_000,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('over_budget');
    }
  });

  it('returns invalid_json when Claude response is not valid JSON', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
        usage: {
          input_tokens: 1000,
          cache_read_input_tokens: 0,
          output_tokens: 100,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_json');
    }
  });

  it('returns invalid_schema when JSON does not match schema', async () => {
    const mockMessages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [
                {
                  sourceFindingId: 'finding-1',
                  title: 'Fix',
                  priority: 'INVALID',
                },
              ],
            }),
          },
        ],
        usage: {
          input_tokens: 1000,
          cache_read_input_tokens: 0,
          output_tokens: 100,
        },
      }),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_schema');
    }
  });

  it('returns api_error when Anthropic throws', async () => {
    const mockMessages = {
      create: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    setMockClient({ messages: mockMessages } as unknown as Partial<Anthropic>);

    const result = await generateBacklog({
      project: {
        name: 'Test',
        domain: 'test.com',
        type: 'saas',
        businessGoal: 'growth',
        market: 'FR',
      },
      findings: [
        {
          id: 'finding-1',
          ruleId: 'TECH-001',
          category: 'technical',
          severity: 'high',
          title: 'Missing title',
          description: 'Page has no title',
          pageUrl: null,
          filePath: null,
          evidence: {},
        },
      ],
      maxBudgetUsd: 0.5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('api_error');
      expect(result.message).toContain('Network error');
    }
  });
});
