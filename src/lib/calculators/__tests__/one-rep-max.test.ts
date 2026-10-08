import { describe, it, expect } from 'vitest';
import {
  calculateOneRepMax,
  epley,
  brzycki,
  kgToLb,
  lbToKg,
  repSchemeTargets,
} from '../one-rep-max';

describe('One Rep Max Calculator', () => {
  describe('Epley formula', () => {
    it('returns exact weight for 1 rep', () => {
      expect(epley(100, 1)).toBe(100);
    });
    it('calculates 1RM for 80kg x 5', () => {
      // 80 * (1 + 5/30) = 80 * 1.1667 = 93.33
      expect(epley(80, 5)).toBeCloseTo(93.3, 0);
    });
    it('calculates 1RM for 100kg x 10', () => {
      // 100 * (1 + 10/30) = 100 * 1.333 = 133.3
      expect(epley(100, 10)).toBeCloseTo(133.3, 0);
    });
  });

  describe('Brzycki formula', () => {
    it('returns exact weight for 1 rep', () => {
      expect(brzycki(100, 1)).toBe(100);
    });
    it('calculates 1RM for 80kg x 5', () => {
      // 80 * 36 / (37 - 5) = 80 * 36 / 32 = 90
      expect(brzycki(80, 5)).toBeCloseTo(90, 0);
    });
    it('calculates 1RM for 100kg x 10', () => {
      // 100 * 36 / (37 - 10) = 100 * 36 / 27 = 133.33
      expect(brzycki(100, 10)).toBeCloseTo(133.3, 0);
    });
  });

  describe('Full calculation', () => {
    it('computes all formulas for a valid input', () => {
      const result = calculateOneRepMax({ weight: 80, reps: 5 });
      expect(result.epley).toBeGreaterThan(0);
      expect(result.brzycki).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(0);
      expect(result.epley).toBeGreaterThan(result.brzycki); // Epley > Brzycki typically
    });

    it('throws on negative weight', () => {
      expect(() => calculateOneRepMax({ weight: -50, reps: 5 })).toThrow();
    });

    it('warns when reps > 10', () => {
      const result = calculateOneRepMax({ weight: 60, reps: 15 });
      expect(result.warning).toBeDefined();
      expect(result.warning).toMatch(/unreliable/i);
    });
  });

  describe('Unit conversion', () => {
    it('converts kg to lb correctly', () => {
      expect(kgToLb(1)).toBeCloseTo(2.2, 0);
      expect(kgToLb(100)).toBeCloseTo(220.5, 0);
    });
    it('converts lb to kg correctly', () => {
      expect(lbToKg(2.20462)).toBeCloseTo(1, 0);
      expect(lbToKg(220.462)).toBeCloseTo(100, 0);
    });
  });

  describe('Rep scheme targets', () => {
    it('generates percentage table from 1RM', () => {
      const targets = repSchemeTargets(100);
      expect(targets.length).toBeGreaterThanOrEqual(10);
      expect(targets.find((t) => t.reps === 1)?.weight).toBeCloseTo(100, 0);
      expect(targets.find((t) => t.reps === 10)?.percent).toBe(75);
    });
  });
});
