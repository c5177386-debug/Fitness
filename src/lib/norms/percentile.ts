/**
 * Percentile / norm evaluation — pure functions shared by the
 * "You vs Your Peers" modules.
 *
 * No React, no I/O: norms are imported as static JSON (inlined at build),
 * percentiles are computed by LINEAR INTERPOLATION inside category bands.
 *
 * Units:
 * - body fat: percent
 * - strength: pounds internally (published source unit); callers convert.
 */
import bodyFatNormJson from '@/data/norms/body-fat.json';
import strengthNormJson from '@/data/norms/strength-1rm.json';
import tdeeNormJson from '@/data/norms/tdee.json';
import waterNormJson from '@/data/norms/water.json';
import macroNormJson from '@/data/norms/macro.json';
import runningNormJson from '@/data/norms/running.json';
import fastingNormJson from '@/data/norms/fasting.json';
import heartrateNormJson from '@/data/norms/heartrate.json';

export type Gender = 'male' | 'female';
export type Lift = 'squat' | 'bench' | 'deadlift';

export interface NormSource {
  id: string;
  name: string;
  shortName: string;
  year: number;
  url?: string;
}

interface AgeBand {
  id: string;
  min: number;
  max: number | null;
  thresholds: Record<Gender, number[]>;
}

export interface BodyFatEvaluation {
  /** Index into the norm `categories` array */
  categoryIndex: number;
  /** 0–100, rounded */
  percentile: number;
  bandId: string;
  /** Thresholds used for this evaluation (lower bounds, %) */
  thresholds: number[];
}

interface BwClass {
  max: number | null;
  squat: number[];
  bench: number[];
  deadlift: number[];
}

export interface StrengthEvaluation {
  categoryIndex: number;
  percentile: number;
  /** Resolved level thresholds in lb: [novice, intermediate, advanced, elite] */
  thresholds: number[];
  axisMax: number;
}

export const bodyFatNorm = bodyFatNormJson as {
  categories: string[];
  percentileAnchors: number[];
  axis: Record<Gender, { min: number; max: number }>;
  density: Record<Gender, { mode: number; shape: number }>;
  sources: NormSource[];
  ageBands: AgeBand[];
};

export const strengthNorm = strengthNormJson as {
  categories: string[];
  percentileAnchors: number[];
  lifts: Lift[];
  sources: NormSource[];
  bwClasses: Record<Gender, BwClass[]>;
};

// ── Body fat ───────────────────────────────────────────────────────

export function pickAgeBand(age: number, bands: AgeBand[] = bodyFatNorm.ageBands): AgeBand {
  for (const band of bands) {
    if (age >= band.min && (band.max === null || age <= band.max)) return band;
  }
  return bands[bands.length - 1];
}

/**
 * Generic threshold interpolation.
 * - thresholds[i] = lower bound of category i
 * - anchors[i]     = percentile at thresholds[i]
 * - anchors[n]     = percentile at axisMax (tail extrapolation)
 * Values below thresholds[0] clamp to anchors[0].
 */
export function interpolateOnThresholds(
  value: number,
  thresholds: number[],
  anchors: number[],
  axisMax: number
): { categoryIndex: number; percentile: number } {
  if (value <= thresholds[0]) {
    return { categoryIndex: 0, percentile: anchors[0] };
  }

  const last = thresholds.length - 1;
  if (value >= thresholds[last]) {
    const span = axisMax - thresholds[last];
    const frac = span > 0 ? Math.min(1, (value - thresholds[last]) / span) : 1;
    return {
      categoryIndex: last,
      percentile: anchors[last] + frac * (anchors[last + 1] - anchors[last]),
    };
  }

  for (let i = 0; i < last; i++) {
    if (value >= thresholds[i] && value < thresholds[i + 1]) {
      const span = thresholds[i + 1] - thresholds[i];
      const frac = span > 0 ? (value - thresholds[i]) / span : 0;
      return {
        categoryIndex: i,
        percentile: anchors[i] + frac * (anchors[i + 1] - anchors[i]),
      };
    }
  }
  return { categoryIndex: last, percentile: anchors[last] };
}

export function evaluateBodyFat(
  gender: Gender,
  age: number,
  percent: number
): BodyFatEvaluation {
  const band = pickAgeBand(age);
  const thresholds = band.thresholds[gender];
  const { categoryIndex, percentile } = interpolateOnThresholds(
    percent,
    thresholds,
    bodyFatNorm.percentileAnchors,
    bodyFatNorm.axis[gender].max
  );
  return {
    categoryIndex,
    percentile: Math.round(percentile),
    bandId: band.id,
    thresholds,
  };
}

// ── Strength ───────────────────────────────────────────────────────

/**
 * Resolve the four level thresholds for a body weight, linearly
 * interpolating between adjacent published body-weight classes.
 */
export function resolveLiftThresholds(
  gender: Gender,
  lift: Lift,
  bwLb: number
): number[] {
  const classes = strengthNorm.bwClasses[gender];

  const row = (c: BwClass) => c[lift];

  // At or below the lightest class
  if (classes[0].max !== null && bwLb <= classes[0].max) {
    return row(classes[0]);
  }

  for (let i = 1; i < classes.length; i++) {
    const upper = classes[i].max;
    if (upper === null || bwLb <= upper) {
      const prev = classes[i - 1];
      if (upper === null || prev.max === null) return row(classes[i]);

      const frac = (bwLb - prev.max) / (upper - prev.max);
      return row(prev).map((v, k) => v + frac * (row(classes[i])[k] - v));
    }
  }
  return row(classes[classes.length - 1]);
}

/**
 * Strength percentile in lb.
 * Categories: untrained [0 → novice), novice, intermediate, advanced, elite;
 * the chart axis extends to elite × 1.25 for the final tail segment.
 */
export function evaluateStrength(
  gender: Gender,
  lift: Lift,
  bwLb: number,
  lift1RmLb: number
): StrengthEvaluation {
  const levelThresholds = resolveLiftThresholds(gender, lift, bwLb);
  const axisMax = levelThresholds[3] * 1.25;

  // 0 is the implicit lower bound of the "untrained" band, so thresholds
  // for the generic interpolator include 0 as the first lower bound.
  const thresholds = [0, ...levelThresholds];

  const { categoryIndex, percentile } = interpolateOnThresholds(
    lift1RmLb,
    thresholds,
    strengthNorm.percentileAnchors,
    axisMax
  );

  return {
    categoryIndex,
    percentile: Math.round(percentile),
    thresholds: levelThresholds,
    axisMax,
  };
}

// ── Density curves for the distribution chart ──────────────────────

export function normalPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Lognormal density (right-skewed) parameterized by mode + shape. */
export function lognormalPdf(x: number, mode: number, shape: number): number {
  if (x <= 0 || mode <= 0) return 0;
  const mu = Math.log(mode) + shape * shape;
  const z = (Math.log(x) - mu) / shape;
  return Math.exp(-0.5 * z * z) / (x * shape * Math.sqrt(2 * Math.PI));
}

/** Relative strength follows an approximately normal distribution. */
export function strengthDensity(
  x: number,
  thresholds: number[]
): number {
  const [novice, intermediate, , elite] = thresholds;
  const mu = intermediate;
  const sigma = Math.max((elite - novice) / 4, 1);
  return normalPdf(x, mu, sigma);
}

/** Body-fat populations are right-skewed. */
export function bodyFatDensity(gender: Gender, x: number): number {
  const { mode, shape } = bodyFatNorm.density[gender];
  return lognormalPdf(x, mode, shape);
}

// ══════════════════════════════════════════════════════════════════
// Center-based generic norms (TDEE / water / macro calories)
// ══════════════════════════════════════════════════════════════════

export interface SimpleNorm {
  categories: string[];
  percentileAnchors: number[];
  multiples: number[];
  sigma: number;
  axisExtent: number;
  sources: NormSource[];
  ageBands?: Array<{
    id: string;
    min: number;
    max: number | null;
    centers: Record<Gender, number>;
  }>;
  rows?: Array<{ id: string; center: number }>;
}

export interface SimpleEvaluation {
  categoryIndex: number;
  percentile: number;
  thresholds: number[];
  axisMin: number;
  axisMax: number;
  bandId: string | null;
  center: number;
}

function centerThresholds(center: number, sigma: number, multiples: number[], decimals = 0) {
  const f = decimals === 0 ? Math.round : (n: number) => Math.round(n * 10) / 10;
  return multiples.map((m) => f(center + m * sigma));
}

/** Public: category lower bounds for a center-based norm (kcal, L…). */
export function thresholdsForCenter(
  norm: SimpleNorm,
  center: number,
  decimals = 0
): number[] {
  return centerThresholds(center, norm.sigma, norm.multiples, decimals);
}

function evaluateCenterNorm(
  norm: SimpleNorm,
  center: number,
  value: number,
  bandId: string | null,
  decimals = 0
): SimpleEvaluation {
  const thresholds = centerThresholds(center, norm.sigma, norm.multiples, decimals);
  const axisMin = decimals === 0
    ? Math.round(center - norm.axisExtent * norm.sigma)
    : Math.round((center - norm.axisExtent * norm.sigma) * 10) / 10;
  const axisMax = decimals === 0
    ? Math.round(center + norm.axisExtent * norm.sigma)
    : Math.round((center + norm.axisExtent * norm.sigma) * 10) / 10;

  const { categoryIndex, percentile } = interpolateOnThresholds(
    value,
    thresholds,
    norm.percentileAnchors,
    axisMax
  );

  return {
    categoryIndex,
    percentile: Math.round(percentile),
    thresholds,
    axisMin: Math.max(decimals === 0 ? 0 : 0.4, axisMin),
    axisMax,
    bandId,
    center,
  };
}

export const tdeeNorm = tdeeNormJson as SimpleNorm;
export const macroNorm = macroNormJson as SimpleNorm;
export const waterNorm = waterNormJson as SimpleNorm & { decimals?: number };

export function evaluateTDEE(gender: Gender, age: number, kcal: number): SimpleEvaluation {
  const realBand = tdeeNorm.ageBands?.find(
    (b) => age >= b.min && (b.max === null || age <= b.max)
  ) ?? tdeeNorm.ageBands![tdeeNorm.ageBands!.length - 1];
  return evaluateCenterNorm(tdeeNorm, realBand.centers[gender], kcal, realBand.id);
}

export function evaluateMacroCalories(
  gender: Gender,
  age: number,
  kcal: number
): SimpleEvaluation {
  const realBand = macroNorm.ageBands?.find(
    (b) => age >= b.min && (b.max === null || age <= b.max)
  ) ?? macroNorm.ageBands![macroNorm.ageBands!.length - 1];
  return evaluateCenterNorm(macroNorm, realBand.centers[gender], kcal, realBand.id);
}

export function evaluateWater(gender: Gender, liters: number): SimpleEvaluation {
  const row = waterNorm.rows!.find((r) => r.id === gender)!;
  const ev = evaluateCenterNorm(waterNorm, row.center, liters, null, 1);
  return ev;
}

// ══════════════════════════════════════════════════════════════════
// Explicit-threshold norms (running pace / resting HR)
// ══════════════════════════════════════════════════════════════════

export interface ThresholdNorm {
  categories: string[];
  percentileAnchors: number[];
  axis: { min: number; max: number };
  thresholds: Record<Gender, number[]>;
  density: Record<Gender, { center: number; sigma: number }>;
  sources: NormSource[];
}

export interface ThresholdEvaluation {
  categoryIndex: number;
  percentile: number;
  thresholds: number[];
}

export const runningNorm = runningNormJson as ThresholdNorm;
export const heartrateNorm = heartrateNormJson as ThresholdNorm;

function evaluateThresholdNorm(
  norm: ThresholdNorm,
  gender: Gender,
  value: number
): ThresholdEvaluation {
  const thresholds = norm.thresholds[gender];
  const { categoryIndex, percentile } = interpolateOnThresholds(
    value,
    thresholds,
    norm.percentileAnchors,
    norm.axis.max
  );
  return { categoryIndex, percentile: Math.round(percentile), thresholds };
}

export function evaluateRunning(gender: Gender, paceSecPerKm: number): ThresholdEvaluation {
  return evaluateThresholdNorm(runningNorm, gender, paceSecPerKm);
}

export function evaluateRestingHR(gender: Gender, rhr: number): ThresholdEvaluation {
  return evaluateThresholdNorm(heartrateNorm, gender, rhr);
}

// ══════════════════════════════════════════════════════════════════
// Fasting — snap/categorical norm
// ══════════════════════════════════════════════════════════════════

export interface FastingNorm {
  categories: string[];
  percentileAnchors: number[];
  axis: { min: number; max: number };
  snapValues: number[];
  methods: Record<string, { hours: number; categoryIndex: number }>;
  sources: NormSource[];
}

export const fastingNorm = fastingNormJson as FastingNorm;

export interface FastingEvaluation {
  categoryIndex: number;
  percentile: number;
  hours: number;
}

export function evaluateFasting(hours: number): FastingEvaluation {
  const { categoryIndex, percentile } = interpolateOnThresholds(
    hours,
    fastingNorm.snapValues,
    fastingNorm.percentileAnchors,
    fastingNorm.axis.max
  );
  return { categoryIndex, percentile: Math.round(percentile), hours };
}

/** Stepped density: equal bar inside each snap band (categorical data). */
export function fastingDensity(x: number): number {
  if (x < fastingNorm.axis.min || x > fastingNorm.axis.max) return 0;
  for (const h of fastingNorm.snapValues) {
    if (Math.abs(x - h) <= 1.2) return 1;
  }
  return 0.25;
}

// ══════════════════════════════════════════════════════════════════
// Inverse mappings — chart axis value → form field values
// (semantic names so a future cloud UI can reuse them)
// ══════════════════════════════════════════════════════════════════

/**
 * Body fat % → waist circumference (inverts the US Navy formula, cm).
 * Other measurements stay fixed; waist is the main driver.
 */
export function waistForBodyFat(
  targetPct: number,
  gender: Gender,
  height: number,
  neck: number,
  hip?: number
): number {
  const density = 495 / (targetPct + 450);

  if (gender === 'male') {
    const logDiff = (1.0324 + 0.15456 * Math.log10(height) - density) / 0.19077;
    return neck + Math.pow(10, logDiff);
  }

  const logSum = (1.29579 + 0.221 * Math.log10(height) - density) / 0.35004;
  return neck + Math.pow(10, logSum) - (hip ?? 0);
}

/**
 * Target 1RM (kg) → working weight (kg) for fixed reps.
 * Inverts the exact Epley+Brzycki average used on the page.
 */
export function workingWeightFor1RM(targetKg: number, reps: number): number {
  const epleyFactor = 1 + reps / 30;
  const brzyckiFactor = 36 / (37 - reps);
  const combined = (epleyFactor + brzyckiFactor) / 2;
  return targetKg / combined;
}

export interface TDEEProfile {
  gender: Gender;
  height: number;
  age: number;
  /** Katch-McArdle body fat; when set the KM inversion is used */
  bodyFatPercent?: number;
}

/** Target TDEE kcal → body weight (kg) for fixed activity multiplier. */
export function weightForTDEE(
  targetKcal: number,
  activityMult: number,
  profile: TDEEProfile
): number {
  const bmrTarget = targetKcal / activityMult;
  const { gender, height, age, bodyFatPercent } = profile;

  if (bodyFatPercent && bodyFatPercent > 3 && bodyFatPercent < 60) {
    const leanFactor = 21.6 * (1 - bodyFatPercent / 100);
    return (bmrTarget - 370) / leanFactor;
  }

  const sexConst = gender === 'male' ? 5 : -161;
  return (bmrTarget - 6.25 * height + 5 * age - sexConst) / 10;
}

/** Target total water (L) → daily exercise minutes. */
export function exerciseForLiters(
  targetLiters: number,
  weight: number,
  climate: 'normal' | 'hot' | 'humid'
): number {
  const climateMl = climate === 'hot' ? 500 : climate === 'humid' ? 750 : 0;
  const minutes = ((targetLiters * 1000 - weight * 33 - climateMl) * 30) / 500;
  return Math.max(0, Math.min(480, Math.round(minutes / 5) * 5));
}

/** Target pace (sec/km) → finish time parts for the selected distance. */
export function finishTimeForPace(
  distanceKm: number,
  paceSecPerKm: number
): { hours: number; minutes: number; seconds: number } {
  const total = paceSecPerKm * distanceKm;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.round(total % 60);
  return { hours, minutes, seconds: seconds === 60 ? 59 : seconds };
}

/** Fasting hours → nearest published method. */
export function methodForFastingHours(hours: number): string {
  const entries = Object.entries(fastingNorm.methods);
  let best = entries[0];
  for (const e of entries) {
    if (Math.abs(e[1].hours - hours) < Math.abs(best[1].hours - hours)) best = e;
  }
  return best[0];
}
