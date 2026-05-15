import { getAnthropic, DEFAULT_MODEL, estimateCostUsd, extractJsonBlock } from '@/lib/ai/claude';
import {
  type BacklogPromptInput,
  BACKLOG_SYSTEM_PROMPT,
  buildUserPrompt,
  backlogResponseSchema,
  type BacklogResponse,
} from '@/lib/ai/prompts/generate-backlog';

export type GenerateBacklogInput = {
  project: {
    name: string;
    domain: string;
    type: string;
    businessGoal: string;
    market: string;
  };
  findings: Array<{
    id: string;
    ruleId: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    pageUrl?: string | null;
    filePath?: string | null;
    evidence?: unknown;
  }>;
  maxBudgetUsd: number;
};

export type GenerateBacklogOutput =
  | {
      ok: true;
      items: BacklogResponse['items'];
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      filteredCount: number;
    }
  | {
      ok: false;
      reason: 'invalid_json' | 'invalid_schema' | 'api_error' | 'no_findings' | 'over_budget';
      message: string;
      costUsd?: number;
    };

export async function generateBacklog(
  input: GenerateBacklogInput
): Promise<GenerateBacklogOutput> {
  if (input.findings.length === 0) {
    return { ok: false, reason: 'no_findings', message: 'No findings to process' };
  }

  const validFindingIds = new Set(input.findings.map((f) => f.id));

  const promptInput: BacklogPromptInput = {
    project: input.project,
    stack: { framework: 'nextjs-15', language: 'typescript' },
    findings: input.findings.map((f) => {
      const evidence = f.evidence as Record<string, unknown> | undefined;
      const recommendation =
        typeof evidence?.recommendation === 'string' ? evidence.recommendation : undefined;

      return {
        id: f.id,
        ruleId: f.ruleId,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        pageUrl: f.pageUrl ?? undefined,
        filePath: f.filePath ?? undefined,
        recommendation,
      };
    }),
  };

  const userPrompt = buildUserPrompt(promptInput);

  try {
    const anthropic = getAnthropic();

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: BACKLOG_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const inputTokens = response.usage.input_tokens;
    const cachedTokens = response.usage.cache_read_input_tokens ?? 0;
    const outputTokens = response.usage.output_tokens;
    const costUsd = estimateCostUsd(inputTokens, cachedTokens, outputTokens);

    if (costUsd > input.maxBudgetUsd) {
      return {
        ok: false,
        reason: 'over_budget',
        message: `Cost ${costUsd.toFixed(4)} USD exceeds budget ${input.maxBudgetUsd} USD`,
        costUsd,
      };
    }

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return {
        ok: false,
        reason: 'api_error',
        message: 'Unexpected response type from Claude',
        costUsd,
      };
    }

    const rawText = content.text;

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonBlock(rawText));
    } catch {
      return {
        ok: false,
        reason: 'invalid_json',
        message: 'Failed to parse JSON from Claude response',
        costUsd,
      };
    }

    const validation = backlogResponseSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        ok: false,
        reason: 'invalid_schema',
        message: `Schema validation failed: ${validation.error.message}`,
        costUsd,
      };
    }

    const data = validation.data;

    const validItems = data.items.filter((item) => validFindingIds.has(item.sourceFindingId));
    const filteredCount = data.items.length - validItems.length;

    if (validItems.length === 0) {
      return {
        ok: false,
        reason: 'invalid_schema',
        message: `All ${data.items.length} BacklogItems filtered out: invalid sourceFindingId`,
        costUsd,
      };
    }

    return {
      ok: true,
      items: validItems,
      costUsd,
      inputTokens,
      outputTokens,
      cachedTokens,
      filteredCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown API error';
    return {
      ok: false,
      reason: 'api_error',
      message,
    };
  }
}
