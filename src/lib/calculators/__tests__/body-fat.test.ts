import { describe, it, expect } from 'vitest';
import {
  calculateBodyFat,
  usNavyBodyFat,
  deurenbergBodyFat,
  classifyBodyFat,
} from '../body-fat';

describe('Body Fat calculator', () => {
  describe('US Navy male', () => {
    it('returns a plausible value for known sample (height 180, neck 38, waist 85)', () => {
      const r = usNavyBodyFat({
        gender: 'male',
        height: 180,
        neck: 38,
        waist: 85,
      });
      expect(r).toBeGreaterThan(10);
      expect(r).toBeLessThan(25);
    });

    it('throws when waist ≤ neck', () => {
      expect(() =>
        usNavyBodyFat({ gender: 'male', height: 180, neck: 90, waist: 80 })
      ).toThrow();
    });
  });

  describe('US Navy female', () => {
    it('requires hip measurement', () => {
      expect(() =>
        usNavyBodyFat({ gender: 'female', height: 165, neck: 33, waist: 70 })
      ).toThrow();
    });

    it('returns a plausible value with hip provided', () => {
      const r = usNavyBodyFat({
        gender: 'female',
        height: 165,
        neck: 33,
        waist: 70,
        hip: 95,
      });
      expect(r).toBeGreaterThan(15);
      expect(r).toBeLessThan(35);
    });
  });

  describe('Deurenberg comparison', () => {
    it('computes BMI and BF for 80kg / 180cm / 30yo male', () => {
      const { bmi, bmiBF } = deurenbergBodyFat('male', 80, 180, 30);
      // BMI = 80 / 3.24 = 24.69
      expect(bmi).toBeCloseTo(24.7, 1);
      // 1.2*24.69 + 0.23*30 − 10.8 − 5.4 = 20.3
      expect(bmiBF).toBeCloseTo(20.3, 0);
    });
  });

  describe('Classification', () => {
    it('classifies ranges per ACE', () => {
      expect(classifyBodyFat('male', 12)).toBe('athletes');
      expect(classifyBodyFat('male', 20)).toBe('average');
      expect(classifyBodyFat('female', 22)).toBe('fitness');
      expect(classifyBodyFat('female', 30)).toBe('average');
    });

    it('has no gap at female average/obese edge (31 < v < 32)', () => {
      expect(classifyBodyFat('female', 31.7)).toBe('average');
      expect(classifyBodyFat('female', 32)).toBe('obese');
      expect(classifyBodyFat('female', 31.99)).toBe('average');
    });
  });

  describe('Full result', () => {
    it('assembles both estimates', () => {
      const r = calculateBodyFat({
        gender: 'male',
        height: 180,
        neck: 38,
        waist: 85,
        weight: 80,
        age: 30,
      });
      expect(r.navy).toBeGreaterThan(0);
      expect(r.bmi).toBeCloseTo(24.7, 1);
      expect(['athletes', 'fitness', 'average']).toContain(r.category);
    });

    it('throws on bad height', () => {
      expect(() =>
        calculateBodyFat({
          gender: 'male',
          height: 90,
          neck: 38,
          waist: 85,
          weight: 80,
          age: 30,
        })
      ).toThrow();
    });
  });
});
