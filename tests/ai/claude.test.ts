import { describe, it, expect } from 'vitest';
import { estimateCostUsd } from '@/lib/ai/claude';

describe('estimateCostUsd', () => {
  it('calculates cost for input tokens only', () => {
    const cost = estimateCostUsd(1_000_000, 0, 0);
    expect(cost).toBeCloseTo(3.0, 2);
  });

  it('calculates cost for cached tokens only', () => {
    const cost = estimateCostUsd(0, 1_000_000, 0);
    expect(cost).toBeCloseTo(0.3, 2);
  });

  it('calculates cost for output tokens only', () => {
    const cost = estimateCostUsd(0, 0, 1_000_000);
    expect(cost).toBeCloseTo(15.0, 2);
  });

  it('calculates mixed cost correctly', () => {
    const cost = estimateCostUsd(500_000, 200_000, 100_000);
    const expected = (500_000 / 1_000_000) * 3.0 + (200_000 / 1_000_000) * 0.3 + (100_000 / 1_000_000) * 15.0;
    expect(cost).toBeCloseTo(expected, 4);
  });

  it('handles small token counts', () => {
    const cost = estimateCostUsd(1000, 500, 200);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.01);
  });
});
