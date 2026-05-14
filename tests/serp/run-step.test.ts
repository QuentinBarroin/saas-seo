import { describe, it, expect } from 'vitest';
import { runSerpStep } from '@/lib/serp/run-step';
import type { RunSerpStepDeps, RunSerpStepInput } from '@/lib/serp/run-step';
import type { FetchSerpLiveResult } from '@/lib/connectors/dataforseo';

describe('runSerpStep', () => {
  it('all keywords pass, totalCostUsd summed', async () => {
    const mockFetch = async (keyword: string): Promise<FetchSerpLiveResult> => ({
      ok: true,
      keyword,
      organic: [{ rank: 1, url: 'https://example.com', domain: 'example.com' }],
      paa: ['Q1'],
      costUsd: 0.002,
    });

    const deps: RunSerpStepDeps = {
      fetchSerp: mockFetch,
      maxBudgetUsd: 0.5,
    };

    const input: RunSerpStepInput = {
      keywords: ['kw1', 'kw2', 'kw3'],
      market: 'FR',
    };

    const result = await runSerpStep(input, deps);

    expect(result.results).toHaveLength(3);
    expect(result.totalCostUsd).toBe(0.006);
    expect(result.cappedAt).toBeNull();
    expect(result.errors).toEqual([]);
  });

  it('cap budget reached in the middle: cappedAt set to keyword not called', async () => {
    const mockFetch = async (keyword: string): Promise<FetchSerpLiveResult> => ({
      ok: true,
      keyword,
      organic: [],
      paa: [],
      costUsd: 0.3,
    });

    const deps: RunSerpStepDeps = {
      fetchSerp: mockFetch,
      maxBudgetUsd: 0.5,
    };

    const input: RunSerpStepInput = {
      keywords: ['kw1', 'kw2', 'kw3'],
      market: 'FR',
    };

    const result = await runSerpStep(input, deps);

    expect(result.results).toHaveLength(1);
    expect(result.totalCostUsd).toBe(0.3);
    expect(result.cappedAt).toBe('kw2');
    expect(result.errors).toEqual([]);
  });

  it('one keyword returns ok:false → push in errors, loop continues', async () => {
    const mockFetch = async (keyword: string): Promise<FetchSerpLiveResult> => {
      if (keyword === 'kw2') {
        return {
          ok: false,
          reason: 'api_error',
          status: 500,
          message: 'Server error',
        };
      }
      return {
        ok: true,
        keyword,
        organic: [{ rank: 1, url: 'https://example.com', domain: 'example.com' }],
        paa: [],
        costUsd: 0.001,
      };
    };

    const deps: RunSerpStepDeps = {
      fetchSerp: mockFetch,
      maxBudgetUsd: 0.5,
    };

    const input: RunSerpStepInput = {
      keywords: ['kw1', 'kw2', 'kw3'],
      market: 'FR',
    };

    const result = await runSerpStep(input, deps);

    expect(result.results).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.keyword).toBe('kw2');
    expect(result.errors[0]?.reason).toBe('api_error');
    expect(result.totalCostUsd).toBe(0.002);
    expect(result.cappedAt).toBeNull();
  });

  it('empty list → output coherent', async () => {
    const mockFetch = async (): Promise<FetchSerpLiveResult> => ({
      ok: true,
      keyword: '',
      organic: [],
      paa: [],
      costUsd: 0,
    });

    const deps: RunSerpStepDeps = {
      fetchSerp: mockFetch,
      maxBudgetUsd: 0.5,
    };

    const input: RunSerpStepInput = {
      keywords: [],
      market: 'FR',
    };

    const result = await runSerpStep(input, deps);

    expect(result.results).toEqual([]);
    expect(result.totalCostUsd).toBe(0);
    expect(result.cappedAt).toBeNull();
    expect(result.errors).toEqual([]);
  });
});
