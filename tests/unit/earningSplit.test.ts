import { describe, it, expect } from 'vitest';
import { calculateEarningSplit, PLATFORM_FEE_RATE } from '../../src/models/instructorEarningModel.js';

describe('calculateEarningSplit', () => {
  it('applies the 30% platform fee by default', () => {
    expect(PLATFORM_FEE_RATE).toBe(0.3);
    expect(calculateEarningSplit(100)).toEqual({ platformFee: 30, netEarning: 70 });
  });

  it('rounds to cents and never loses or invents money', () => {
    for (const amount of [0.01, 9.99, 19.95, 33.33, 49.99, 1234.56]) {
      const { platformFee, netEarning } = calculateEarningSplit(amount);
      expect(Number.isInteger(Math.round(platformFee * 100))).toBe(true);
      expect(Math.round((platformFee + netEarning) * 100)).toBe(Math.round(amount * 100));
    }
  });

  it('handles a free course', () => {
    expect(calculateEarningSplit(0)).toEqual({ platformFee: 0, netEarning: 0 });
  });

  it('accepts a custom fee rate', () => {
    expect(calculateEarningSplit(200, 0.15)).toEqual({ platformFee: 30, netEarning: 170 });
  });

  it('rejects negative and non-finite amounts', () => {
    expect(() => calculateEarningSplit(-1)).toThrow(RangeError);
    expect(() => calculateEarningSplit(Number.NaN)).toThrow(RangeError);
    expect(() => calculateEarningSplit(Infinity)).toThrow(RangeError);
  });
});
