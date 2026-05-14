import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    client = new Anthropic({ apiKey });
  }
  return client;
}

export type ClaudeCallResult<T> =
  | {
      ok: true;
      data: T;
      costUsd: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
    }
  | {
      ok: false;
      reason: 'invalid_json' | 'invalid_schema' | 'api_error' | 'over_budget';
      message: string;
      costUsd?: number;
    };

const PRICING_USD_PER_M_TOKENS = {
  input: 3.0,
  cachedInput: 0.3,
  output: 15.0,
};

export function estimateCostUsd(
  inputTokens: number,
  cachedTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING_USD_PER_M_TOKENS.input;
  const cachedCost = (cachedTokens / 1_000_000) * PRICING_USD_PER_M_TOKENS.cachedInput;
  const outputCost = (outputTokens / 1_000_000) * PRICING_USD_PER_M_TOKENS.output;
  return inputCost + cachedCost + outputCost;
}
