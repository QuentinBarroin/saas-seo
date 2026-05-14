import type { FetchSerpLiveResult } from '@/lib/connectors/dataforseo';

export type SerpOrganicItem = {
  rank: number;
  url: string;
  title?: string;
  snippet?: string;
  domain: string;
};

export type SerpStepResult = {
  keyword: string;
  market: string;
  organic: SerpOrganicItem[];
  paa: string[];
};

export type RunSerpStepDeps = {
  fetchSerp: (keyword: string) => Promise<FetchSerpLiveResult>;
  maxBudgetUsd: number;
};

export type RunSerpStepInput = {
  keywords: string[];
  market: string;
};

export type RunSerpStepOutput = {
  results: SerpStepResult[];
  totalCostUsd: number;
  cappedAt: string | null;
  errors: Array<{ keyword: string; reason: string; message: string }>;
};

export async function runSerpStep(
  input: RunSerpStepInput,
  deps: RunSerpStepDeps
): Promise<RunSerpStepOutput> {
  const results: SerpStepResult[] = [];
  const errors: Array<{ keyword: string; reason: string; message: string }> = [];
  let totalCostUsd = 0;
  let cappedAt: string | null = null;

  const estimatedCostPerCall = 0.001;

  for (const keyword of input.keywords) {
    if (totalCostUsd + estimatedCostPerCall > deps.maxBudgetUsd) {
      cappedAt = keyword;
      break;
    }

    const result = await deps.fetchSerp(keyword);

    if (!result.ok) {
      errors.push({
        keyword,
        reason: result.reason,
        message: result.message,
      });
      continue;
    }

    const newTotal = totalCostUsd + result.costUsd;
    if (newTotal > deps.maxBudgetUsd) {
      cappedAt = keyword;
      break;
    }

    results.push({
      keyword: result.keyword,
      market: input.market,
      organic: result.organic,
      paa: result.paa,
    });

    totalCostUsd = newTotal;
  }

  return {
    results,
    totalCostUsd,
    cappedAt,
    errors,
  };
}
