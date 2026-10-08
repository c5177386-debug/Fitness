import { describe, it, expect } from 'vitest';
import { calculateMacros } from '../macro';

const base = {
  gender: 'male' as const,
  weight: 80,
  height: 180,
  age: 30,
  activityLevel: 'moderately-active' as const,
};

describe('Macro calculator', () => {
  it('maintain / balanced: protein = 1.7 × 80 = 136g', () => {
    const r = calculateMacros({ ...base, goal: 'maintain', dietStyle: 'balanced' });
    expect(r.protein).toBe(136);
    expect(r.fat).toBe(64); // 0.8 × 80
    // calories = TDEE = 2759 for this profile
    expect(r.calories).toBe(2759);
    // carbs kcal = 2759 − 544 − 576 = 1639 → 410g
    expect(r.carbs).toBe(410);
  });

  it('lose / balanced uses TDEE − 500', () => {
    const r = calculateMacros({ ...base, goal: 'lose', dietStyle: 'balanced' });
    expect(r.calories).toBe(2259);
    expect(r.protein).toBe(160); // 2.0 × 80
  });

  it('gain uses TDEE + 500', () => {
    const r = calculateMacros({ ...base, goal: 'gain', dietStyle: 'balanced' });
    expect(r.calories).toBe(3259);
  });

  it('keto keeps carbs ≈ 5% of calories', () => {
    const r = calculateMacros({ ...base, goal: 'maintain', dietStyle: 'keto' });
    // 2759 * 0.05 / 4 = 34.5 → 34g
    expect(r.carbs).toBeLessThanOrEqual(35);
    expect(r.fatPct).toBeGreaterThan(55);
  });

  it('percentages sum to 100', () => {
    const r = calculateMacros({ ...base, goal: 'maintain', dietStyle: 'low-carb' });
    expect(r.proteinPct + r.carbsPct + r.fatPct).toBe(100);
  });

  it('throws on unrealistic weight', () => {
    expect(() =>
      calculateMacros({ ...base, weight: 500, goal: 'lose', dietStyle: 'balanced' })
    ).toThrow();
  });
});
