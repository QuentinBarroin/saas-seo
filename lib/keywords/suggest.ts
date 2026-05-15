import { getAnthropic, DEFAULT_MODEL, estimateCostUsd, extractJsonBlock } from '@/lib/ai/claude';
import {
  SUGGEST_KEYWORDS_SYSTEM_PROMPT,
  buildSuggestUserPrompt,
  suggestResponseSchema,
  type SuggestKeywordsPromptInput,
} from '@/lib/ai/prompts/suggest-keywords';

/** Cap dur sur le nombre de suggestions (PDR-013 — coût Anthropic borné). */
export const MAX_SUGGESTED_KEYWORDS = 20;

export type SuggestSeedKeywordsResult =
  | { ok: true; keywords: string[]; costUsd: number }
  | {
      ok: false;
      reason: 'no_api_key' | 'invalid_json' | 'invalid_schema' | 'api_error';
      message: string;
    };

/**
 * Normalise la liste brute renvoyée par Claude : trim, retrait des vides,
 * dédup insensible à la casse, et cap à MAX_SUGGESTED_KEYWORDS.
 */
export function normalizeSuggestions(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_SUGGESTED_KEYWORDS) break;
  }
  return out;
}

/**
 * Suggère des seed keywords pour un projet via Claude (PDR-013).
 * Réutilise l'infra IA de S2-11 (`lib/ai/claude.ts`), prompt caching activé.
 */
export async function suggestSeedKeywords(
  input: SuggestKeywordsPromptInput
): Promise<SuggestSeedKeywordsResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: 'no_api_key', message: 'ANTHROPIC_API_KEY non configurée' };
  }

  try {
    const anthropic = getAnthropic();

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SUGGEST_KEYWORDS_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildSuggestUserPrompt(input) }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return { ok: false, reason: 'api_error', message: 'Réponse Claude inattendue' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonBlock(content.text));
    } catch {
      return { ok: false, reason: 'invalid_json', message: 'JSON Claude invalide' };
    }

    const validation = suggestResponseSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        ok: false,
        reason: 'invalid_schema',
        message: `Schema invalide : ${validation.error.message}`,
      };
    }

    const usage = response.usage;
    const costUsd = estimateCostUsd(
      usage.input_tokens,
      usage.cache_read_input_tokens ?? 0,
      usage.output_tokens
    );

    return { ok: true, keywords: normalizeSuggestions(validation.data.keywords), costUsd };
  } catch (err) {
    return {
      ok: false,
      reason: 'api_error',
      message: err instanceof Error ? err.message : 'Erreur API Anthropic',
    };
  }
}
