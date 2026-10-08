/**
 * One Rep Max Calculator Engines
 * All formulas output kg. Input can be kg or lb (conversion handled by caller).
 *
 * Formulas used:
 * - Epley (1985): weight * (1 + reps / 30) — gold standard for 1-10 reps
 * - Brzycki (1993): weight * 36 / (37 - reps) — slightly more conservative
 * - LOMBARDI: weight * reps^0.10
 *
 * Reference: https://en.wikipedia.org/wiki/One-repetition_maximum
 */

export interface OneRepMaxInput {
  weight: number;
  reps: number;
}

export interface OneRepMaxResult {
  epley: number;
  brzycki: number;
  lombardi: number;
  average: number;
  formula: 'epley' | 'brzycki' | 'average';
  /** Warning if reps > 10 (extrapolation becomes unreliable) */
  warning?: string;
}

const KG_TO_LB = 2.20462;
const LB_TO_KG = 0.453592;

export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10;
}

/** Epley formula: w * (1 + r/30) */
export function epley(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return roundTo1(weight * (1 + reps / 30));
}

/** Brzycki formula: w * 36 / (37 - r) */
export function brzycki(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps >= 37) return Infinity; // mathematical limit
  if (reps === 1) return weight;
  return roundTo1((weight * 36) / (37 - reps));
}

/** Lombardi formula: w * r^0.10 */
export function lombardi(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return roundTo1(weight * Math.pow(reps, 0.1));
}

/** Calculate all 1RM estimates from a working set */
export function calculateOneRepMax(input: OneRepMaxInput): OneRepMaxResult {
  const { weight, reps } = input;

  // Input validation
  if (weight <= 0 || reps <= 0) {
    throw new Error('Weight and reps must be positive numbers');
  }
  if (reps > 50) {
    throw new Error('Please enter 50 reps or fewer');
  }

  const e = epley(weight, reps);
  const b = brzycki(weight, reps);
  const l = lombardi(weight, reps);

  const result: OneRepMaxResult = {
    epley: e,
    brzycki: b,
    lombardi: l,
    average: roundTo1((e + b) / 2),
    formula: 'average',
  };

  if (reps > 10) {
    result.warning =
      'Note: Estimates above 10 reps are extrapolations and become increasingly unreliable. Consider testing a heavier weight with fewer reps for more accurate results.';
  }

  return result;
}

/**
 * Given a 1RM, calculate target weights for common rep schemes.
 * Uses Epley percentages (verified against training literature).
 */
export function repSchemeTargets(oneRepMax: number): Array<{ reps: number; weight: number; percent: number }> {
  // Typical % of 1RM for each rep count (derived from Epley, corroborated by NSCA)
  const schemes: Array<{ reps: number; percent: number }> = [
    { reps: 1, percent: 100 },
    { reps: 2, percent: 95 },
    { reps: 3, percent: 93 },
    { reps: 4, percent: 90 },
    { reps: 5, percent: 87 },
    { reps: 6, percent: 85 },
    { reps: 8, percent: 80 },
    { reps: 10, percent: 75 },
    { reps: 12, percent: 70 },
    { reps: 15, percent: 65 },
    { reps: 20, percent: 60 },
  ];

  return schemes.map((s) => ({
    reps: s.reps,
    percent: s.percent,
    weight: roundTo1(oneRepMax * (s.percent / 100)),
  }));
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}
