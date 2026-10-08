import { describe, it, expect } from 'vitest';
import {
  evaluateTDEE,
  evaluateWater,
  evaluateRunning,
  evaluateFasting,
  evaluateRestingHR,
  waistForBodyFat,
  weightForTDEE,
  exerciseForLiters,
  finishTimeForPace,
  methodForFastingHours,
  workingWeightFor1RM,
  tdeeNorm,
  waterNorm,
  runningNorm,
  fastingNorm,
  heartrateNorm,
} from '../percentile';

describe('evaluateTDEE', () => {
  it('center value lands on the 50th percentile', () => {
    const r = evaluateTDEE('male', 25, 2800);
    expect(r.percentile).toBe(50);
    expect(r.bandId).toBe('18-29');
  });

  it('higher kcal → higher percentile; below-floor clamps', () => {
    expect(evaluateTDEE('male', 25, 3000).percentile).toBe(74);
    expect(evaluateTDEE('male', 25, 2000).percentile).toBe(3);
  });
});

describe('evaluateWater', () => {
  it('center → 50; above center interpolates', () => {
    expect(evaluateWater('male', 3.2).percentile).toBe(50);
    expect(evaluateWater('male', 4.0).percentile).toBe(90);
  });
});

describe('evaluateRunning — inverted scale', () => {
  it('slower pace → lower percentile', () => {
    expect(evaluateRunning('male', 300).percentile).toBe(65);
    expect(evaluateRunning('male', 180).percentile).toBe(98);
    expect(evaluateRunning('male', 540).percentile).toBe(3);
    expect(evaluateRunning('male', 420).percentile).toBe(20);
  });
});

describe('evaluateFasting — snap bands', () => {
  it('maps hours to levels', () => {
    expect(evaluateFasting(16).percentile).toBe(45);
    expect(evaluateFasting(17).percentile).toBe(58);
    expect(evaluateFasting(23).categoryIndex).toBe(4);
  });
});

describe('evaluateRestingHR — inverted scale', () => {
  it('lower RHR → higher percentile', () => {
    expect(evaluateRestingHR('male', 65).percentile).toBe(63);
    expect(evaluateRestingHR('male', 40).percentile).toBe(95);
    expect(evaluateRestingHR('male', 90).percentile).toBe(13);
  });
});

describe('inverse mappings — axis value → form patch', () => {
  it('waistForBodyFat: target 28% female → waist ≈80.1 cm (round-trips)', () => {
    const w = waistForBodyFat(28, 'female', 165, 35, 94);
    expect(Math.round(w * 10) / 10).toBe(80.1);
  });

  it('weightForTDEE: 2800 kcal moderate male 175cm/30y → ≈85.8 kg (MSJ)', () => {
    const w = weightForTDEE(2800, 1.55, {
      gender: 'male',
      height: 175,
      age: 30,
    });
    expect(Math.round(w * 10) / 10).toBe(85.8);
  });

  it('weightForTDEE switches to the Katch inversion when body fat given', () => {
    const w = weightForTDEE(2800, 1.55, {
      gender: 'male',
      height: 175,
      age: 30,
      bodyFatPercent: 20,
    });
    expect(Math.round(w * 10) / 10).toBe(83.1);
  });

  it('exerciseForLiters: 3.225 L at 75 kg → 45 minutes; hot climate → 15', () => {
    expect(exerciseForLiters(3.225, 75, 'normal')).toBe(45);
    expect(exerciseForLiters(3.225, 75, 'hot')).toBe(15);
  });

  it('finishTimeForPace: 10 km at 5:00/km → 0:50:00', () => {
    expect(finishTimeForPace(10, 300)).toEqual({
      hours: 0,
      minutes: 50,
      seconds: 0,
    });
  });

  it('methodForFastingHours snaps to nearest method', () => {
    expect(methodForFastingHours(17)).toBe('16:8');
    expect(methodForFastingHours(19)).toBe('18:6');
  });

  it('workingWeightFor1RM: 100 kg at 5 reps → ≈87.3 kg working', () => {
    const w = workingWeightFor1RM(100, 5);
    expect(Math.round(w * 10) / 10).toBe(87.3);
  });
});

describe('norm datasets integrity', () => {
  it('thresholds/anchors are aligned and sorted', () => {
    for (const norm of [tdeeNorm, waterNorm] as Array<{
      multiples: number[];
      percentileAnchors: number[];
    }>) {
      for (let i = 1; i < norm.multiples.length; i++) {
        expect(norm.multiples[i]).toBeGreaterThan(norm.multiples[i - 1]);
      }
      expect(norm.percentileAnchors.length).toBe(norm.multiples.length + 1);
    }
    for (const gender of ['male', 'female'] as const) {
      const t = runningNorm.thresholds[gender];
      for (let i = 1; i < t.length; i++) {
        expect(t[i]).toBeGreaterThan(t[i - 1]);
      }
      expect(fastingNorm.snapValues).toHaveLength(5);
      expect(heartrateNorm.thresholds[gender]).toHaveLength(5);
    }
  });
});
