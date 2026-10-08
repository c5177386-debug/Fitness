import { describe, it, expect } from 'vitest';
import { kgToLb } from '@/lib/calculators/one-rep-max';
import {
  evaluateBodyFat,
  evaluateStrength,
  pickAgeBand,
  resolveLiftThresholds,
  bodyFatDensity,
  strengthDensity,
  bodyFatNorm,
} from '../percentile';

describe('evaluateBodyFat — ACE/Gallagher norms', () => {
  it('acceptance: 25 y/o female at 28% → Average category, 57th percentile', () => {
    const r = evaluateBodyFat('female', 25, 28);
    expect(bodyFatNorm.categories[r.categoryIndex]).toBe('average');
    expect(r.bandId).toBe('18-29');
    expect(r.percentile).toBe(57);
  });

  it('lower body fat inside a band maps to a higher percentile', () => {
    const leaner = evaluateBodyFat('female', 25, 25);
    const higher = evaluateBodyFat('female', 25, 31);
    expect(leaner.percentile).toBe(70);
    expect(higher.percentile).toBe(44);
    expect(leaner.percentile).toBeGreaterThan(higher.percentile);
  });

  it('values at/below the essential floor clamp to the top anchor', () => {
    const r = evaluateBodyFat('female', 25, 8);
    expect(bodyFatNorm.categories[r.categoryIndex]).toBe('essential');
    expect(r.percentile).toBe(99);
  });

  it('values in the obese tail interpolate toward the bottom anchor', () => {
    const r = evaluateBodyFat('female', 25, 40);
    expect(bodyFatNorm.categories[r.categoryIndex]).toBe('obese');
    expect(r.percentile).toBeLessThan(25);
  });

  it('age bands shift thresholds upward with age (40-59 bands)', () => {
    const young = evaluateBodyFat('male', 25, 20);
    const older = evaluateBodyFat('male', 55, 20);
    expect(bodyFatNorm.categories[young.categoryIndex]).toBe('average');
    expect(bodyFatNorm.categories[older.categoryIndex]).toBe('fitness');
    expect(older.percentile).toBeGreaterThan(young.percentile);
  });
});

describe('pickAgeBand', () => {
  it('picks inclusive bands at every boundary', () => {
    expect(pickAgeBand(18).id).toBe('18-29');
    expect(pickAgeBand(29).id).toBe('18-29');
    expect(pickAgeBand(30).id).toBe('30-39');
    expect(pickAgeBand(69).id).toBe('60-69');
    expect(pickAgeBand(70).id).toBe('70+');
    expect(pickAgeBand(99).id).toBe('70+');
  });
});

describe('evaluateStrength — Kilgore/Practical Programming norms', () => {
  it('acceptance: 80 kg male squat 1RM 100 kg → Untrained near top, ~18th percentile', () => {
    const r = evaluateStrength('male', 'squat', kgToLb(80), kgToLb(100));
    expect(r.categoryIndex).toBe(0); // untrained
    expect(r.percentile).toBe(18);
  });

  it('an exact body-weight class resolves to the published table row', () => {
    const t = resolveLiftThresholds('male', 'squat', 165);
    expect(t).toEqual([229, 338, 496, 634]);
  });

  it('thresholds interpolate linearly between adjacent classes', () => {
    const mid = resolveLiftThresholds('male', 'squat', 173); // halfway 165→181
    expect(mid[1]).toBe(350.5); // (338 + 363) / 2
  });

  it('an elite-level squat lands in the elite category', () => {
    const r = evaluateStrength('male', 'squat', kgToLb(80), kgToLb(330));
    expect(r.categoryIndex).toBe(4);
    expect(r.percentile).toBeGreaterThanOrEqual(90);
  });

  it('percentile increases monotonically with lifted weight', () => {
    const bw = kgToLb(80);
    const samples = [60, 100, 150, 220, 330].map((kg) =>
      evaluateStrength('male', 'squat', bw, kgToLb(kg)).percentile
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it('density curves are non-negative and peak inside the axis', () => {
    const thresholds = resolveLiftThresholds('male', 'squat', 176);
    const peak = strengthDensity(355, thresholds);
    const tail = strengthDensity(30, thresholds);
    expect(peak).toBeGreaterThan(tail);
    expect(bodyFatDensity('female', 25)).toBeGreaterThan(bodyFatDensity('female', 45));
  });
});
