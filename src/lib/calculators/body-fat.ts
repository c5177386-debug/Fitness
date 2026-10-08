/**
 * Body Fat Calculator Engine
 *
 * Two independent estimates:
 * 1. US Navy circumference method (Hodgdon & Beckett, 1984) — tape only
 * 2. BMI-derived estimate (Deurenberg formula, 1991) — weight/height/age
 *
 * The Navy result is the headline; Deurenberg is shown for comparison.
 * Both are population estimates, not diagnostics — the page says so.
 *
 * All measurements in centimeters.
 */

import type { Gender } from './tdee';

export interface BodyFatInput {
  gender: Gender;
  /** cm */
  height: number;
  /** neck circumference, cm */
  neck: number;
  /** waist circumference, cm */
  waist: number;
  /** hip circumference, cm (women only) */
  hip?: number;
  /** kg (for BMI comparison) */
  weight: number;
  age: number;
}

export type BodyFatCategory =
  | 'essential'
  | 'athletes'
  | 'fitness'
  | 'average'
  | 'obese';

export interface BodyFatResult {
  /** US Navy estimate, % */
  navy: number;
  /** Deurenberg/BMI estimate, % */
  bmiBF: number;
  bmi: number;
  category: BodyFatCategory;
}

export function usNavyBodyFat(input: Omit<BodyFatInput, 'weight' | 'age'>): number {
  const { gender, height, neck, waist, hip } = input;

  if (neck <= 0 || waist <= 0 || height <= 0) {
    throw new Error('Measurements must be positive numbers');
  }

  if (gender === 'male') {
    if (waist <= neck) {
      throw new Error('Waist must be larger than neck for the Navy formula');
    }
    const density =
      1.0324 -
      0.19077 * Math.log10(waist - neck) +
      0.15456 * Math.log10(height);
    return 495 / density - 450;
  }

  if (!hip || hip <= 0) throw new Error('Hip measurement is required');
  if (waist + hip <= neck) {
    throw new Error('Waist + hip must be larger than neck for the Navy formula');
  }
  const density =
    1.29579 -
    0.35004 * Math.log10(waist + hip - neck) +
    0.221 * Math.log10(height);
  return 495 / density - 450;
}

/** Deurenberg: BF% = 1.2 BMI + 0.23 age − 10.8 sex − 5.4 (sex: male 1, female 0) */
export function deurenbergBodyFat(
  gender: Gender,
  weight: number,
  height: number,
  age: number
): { bmi: number; bmiBF: number } {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const sexFactor = gender === 'male' ? 10.8 : 0;
  const bmiBF = 1.2 * bmi + 0.23 * age - sexFactor - 5.4;
  return { bmi, bmiBF };
}

const CATEGORY_RANGES: Record<Gender, Array<[number, BodyFatCategory]>> = {
  // ACE body composition ranges — lower bound of each category
  male: [
    [2, 'essential'],
    [6, 'athletes'],
    [14, 'fitness'],
    [18, 'average'],
    [25, 'obese'],
  ],
  female: [
    [10, 'essential'],
    [14, 'athletes'],
    [21, 'fitness'],
    [25, 'average'],
    [32, 'obese'],
  ],
};

export function classifyBodyFat(gender: Gender, percent: number): BodyFatCategory {
  // Highest category whose lower bound does not exceed the value.
  // Lower-bound classification avoids gaps at band edges (e.g. 31.7%).
  let result: BodyFatCategory = 'essential';
  for (const [low, cat] of CATEGORY_RANGES[gender]) {
    if (percent >= low) result = cat;
  }
  return result;
}

export function calculateBodyFat(input: BodyFatInput): BodyFatResult {
  const { gender, height, neck, waist, hip, weight, age } = input;

  if (height < 100 || height > 250) throw new Error('Height must be 100-250 cm');
  if (weight < 20 || weight > 300) throw new Error('Weight must be 20-300 kg');
  if (age < 10 || age > 100) throw new Error('Age must be 10-100');

  const navy = usNavyBodyFat({ gender, height, neck, waist, hip });
  const { bmi, bmiBF } = deurenbergBodyFat(gender, weight, height, age);

  return {
    navy: round1(navy),
    bmiBF: round1(bmiBF),
    bmi: round1(bmi),
    category: classifyBodyFat(gender, navy),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
