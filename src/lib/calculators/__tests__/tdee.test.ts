import { describe, it, expect } from 'vitest';
import { calculateTDEE, mifflinStJeorBMR, katchMcArdleBMR } from '../tdee';

describe('TDEE Calculator', () => {
  describe('Mifflin-St Jeor BMR', () => {
    it('calculates for a 30yo male: 80kg, 180cm', () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(mifflinStJeorBMR('male', 80, 180, 30)).toBe(1780);
    });
    it('calculates for a 25yo female: 60kg, 165cm', () => {
      // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(mifflinStJeorBMR('female', 60, 165, 25)).toBeCloseTo(1345, 0);
    });
  });

  describe('Katch-McArdle BMR', () => {
    it('calculates for 80kg male with 15% body fat', () => {
      // lean mass = 80 * 0.85 = 68
      // 370 + 21.6 * 68 = 370 + 1468.8 = 1838.8
      expect(katchMcArdleBMR(80, 15)).toBeCloseTo(1839, 0);
    });
  });

  describe('Full TDEE calculation', () => {
    it('uses Mifflin-St Jeor when no body fat provided', () => {
      const result = calculateTDEE({
        gender: 'male',
        weight: 80,
        height: 180,
        age: 30,
        activityLevel: 'moderately-active',
      });
      expect(result.bmrFormula).toBe('mifflin-st-jeor');
      expect(result.bmr).toBe(1780);
      expect(result.activityMultiplier).toBe(1.55);
      expect(result.tdee).toBe(Math.round(1780 * 1.55));
    });

    it('uses Katch-McArdle when body fat provided', () => {
      const result = calculateTDEE({
        gender: 'male',
        weight: 80,
        height: 180,
        age: 30,
        activityLevel: 'lightly-active',
        bodyFatPercent: 15,
      });
      expect(result.bmrFormula).toBe('katch-mcardle');
      expect(result.note).toBeDefined();
    });

    it('calculates calorie targets', () => {
      const result = calculateTDEE({
        gender: 'male',
        weight: 80,
        height: 180,
        age: 30,
        activityLevel: 'moderately-active',
      });
      expect(result.targets.maintain).toBe(result.tdee);
      expect(result.targets.lose).toBe(result.tdee - 500);
      expect(result.targets.gain).toBe(result.tdee + 500);
    });

    it('throws on out-of-range weight', () => {
      expect(() =>
        calculateTDEE({ gender: 'male', weight: 500, height: 180, age: 30, activityLevel: 'sedentary' })
      ).toThrow();
    });
  });
});
