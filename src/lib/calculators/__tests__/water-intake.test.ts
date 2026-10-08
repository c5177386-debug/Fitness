import { describe, it, expect } from 'vitest';
import { calculateWaterIntake } from '../water-intake';

describe('Water Intake Calculator', () => {
  it('calculates base intake for 70kg sedentary person', () => {
    // 70 * 33 = 2310ml
    const result = calculateWaterIntake({ weight: 70, exerciseMinutes: 0, climate: 'normal' });
    expect(result.totalMl).toBeCloseTo(2310, 0);
    expect(result.breakdown.base).toBeCloseTo(2310, -1);
  });

  it('adds exercise adjustment correctly', () => {
    // 70kg + 60min exercise = 2310 + 1000 = 3310ml
    const result = calculateWaterIntake({ weight: 70, exerciseMinutes: 60, climate: 'normal' });
    expect(result.totalMl).toBeCloseTo(3310, 0);
    expect(result.breakdown.activity).toBe(1000);
  });

  it('adds hot climate adjustment', () => {
    const result = calculateWaterIntake({ weight: 70, exerciseMinutes: 0, climate: 'hot' });
    expect(result.breakdown.climate).toBe(500);
    expect(result.totalMl).toBeCloseTo(2810, 0);
  });

  it('adds humid climate adjustment', () => {
    const result = calculateWaterIntake({ weight: 70, exerciseMinutes: 0, climate: 'humid' });
    expect(result.breakdown.climate).toBe(750);
  });

  it('converts between units correctly', () => {
    const result = calculateWaterIntake({ weight: 100, exerciseMinutes: 0, climate: 'normal' });
    expect(result.totalLiters).toBeCloseTo(3.3, 1);
    expect(result.totalOunces).toBeGreaterThan(0);
    expect(result.totalCups).toBeGreaterThan(0);
  });

  it('throws on invalid weight', () => {
    expect(() => calculateWaterIntake({ weight: 0, exerciseMinutes: 0, climate: 'normal' })).toThrow();
  });
});
