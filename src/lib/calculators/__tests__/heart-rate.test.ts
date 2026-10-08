import { describe, it, expect } from 'vitest';
import {
  calculateHeartRate,
  tanakaMaxHR,
  foxMaxHR,
} from '../heart-rate';

describe('Target Heart Rate calculator', () => {
  it('Tanaka max for age 30: 208 − 21 = 187', () => {
    expect(tanakaMaxHR(30)).toBe(187);
  });

  it('Fox max for age 30: 190', () => {
    expect(foxMaxHR(30)).toBe(190);
  });

  it('five Karvonen zones for resting HR 60, age 30', () => {
    const r = calculateHeartRate({ age: 30, restingHR: 60 });
    expect(r.tanakaMax).toBe(187);
    expect(r.hrr).toBe(127);
    // Z1 low = 60 + 0.5*127 = 123.5 → 124
    expect(r.zones[0].low).toBe(124);
    // Z5 high = 60 + 1.0*127 = 187
    expect(r.zones[4].high).toBe(187);
    expect(r.zones).toHaveLength(5);
  });

  it('zones ascend continuously', () => {
    const r = calculateHeartRate({ age: 40, restingHR: 55 });
    for (let i = 1; i < r.zones.length; i++) {
      expect(r.zones[i].low).toBe(r.zones[i - 1].high);
    }
  });

  it('throws on invalid age and resting HR', () => {
    expect(() => calculateHeartRate({ age: 5, restingHR: 60 })).toThrow();
    expect(() => calculateHeartRate({ age: 30, restingHR: 200 })).toThrow();
  });
});
