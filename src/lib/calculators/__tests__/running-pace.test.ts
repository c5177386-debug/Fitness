import { describe, it, expect } from 'vitest';
import {
  calculatePace,
  formatDuration,
  formatPace,
} from '../running-pace';

describe('Running Pace calculator', () => {
  it('10 km in 50:00 → 5:00/km', () => {
    const r = calculatePace({ distanceKm: 10, hours: 0, minutes: 50, seconds: 0 });
    expect(r.paceSecPerKm).toBe(300);
    expect(r.kmh).toBe(12);
    expect(r.splits.length).toBe(10);
    expect(r.splits[4].time).toBe(1500); // 5 km split
  });

  it('pace per mile = pace per km × 1.609344', () => {
    const r = calculatePace({ distanceKm: 5, hours: 0, minutes: 25, seconds: 0 });
    // 5:00/km → 8:02.7/mile ≈ 482.8 s
    expect(r.paceSecPerMile).toBeCloseTo(482.8, 0);
    expect(r.mph).toBeCloseTo(7.46, 1);
  });

  it('half marathon distance produces partial final split', () => {
    const r = calculatePace({ distanceKm: 21.0975, hours: 1, minutes: 45, seconds: 0 });
    expect(r.splits[r.splits.length - 1].km).toBeCloseTo(21.1, 1);
  });

  it('formats durations and pace', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(300)).toBe('5:00');
    expect(formatPace(300)).toBe('5:00');
  });

  it('throws on zero distance and invalid time', () => {
    expect(() =>
      calculatePace({ distanceKm: 0, hours: 0, minutes: 30, seconds: 0 })
    ).toThrow();
    expect(() =>
      calculatePace({ distanceKm: 5, hours: 0, minutes: 70, seconds: 0 })
    ).toThrow();
  });
});
