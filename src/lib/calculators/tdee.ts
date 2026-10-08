/**
 * TDEE Calculator Engines
 *
 * Formula hierarchy (per exercise science consensus):
 * 1. Mifflin-St Jeor (2005) — current gold standard when body composition unknown
 * 2. Katch-McArdle (1996) — more accurate when body fat % is known
 *
 * Activity multipliers (all formulas use same):
 * - Sedentary (office job): 1.2
 * - Lightly active (1-3 days/week): 1.375
 * - Moderately active (3-5 days/week): 1.55
 * - Very active (6-7 days/week): 1.725
 * - Extra active (physical job + training): 1.9
 *
 * Reference: ACSM's Resources for the Personal Trainer, 6th ed.
 */

export type Gender = 'male' | 'female';

export interface TDEEInput {
  gender: Gender;
  /** kg */
  weight: number;
  /** cm */
  height: number;
  /** years */
  age: number;
  activityLevel: ActivityLevel;
  /** Optional: body fat % (enables Katch-McArdle) */
  bodyFatPercent?: number;
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly-active'
  | 'moderately-active'
  | 'very-active'
  | 'extra-active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extra-active': 1.9,
};

export function activityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[level];
}

/** Mifflin-St Jeor BMR */
export function mifflinStJeorBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/** Katch-McArdle BMR (requires body fat %) */
export function katchMcArdleBMR(weight: number, bodyFatPercent: number): number {
  const leanMass = weight * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMass;
}

export interface TDEEResult {
  bmr: number;
  bmrFormula: 'mifflin-st-jeor' | 'katch-mcardle';
  tdee: number;
  activityMultiplier: number;
  /** Calorie targets for common goals */
  targets: {
    lose: number;
    maintain: number;
    gain: number;
  };
  /** Note if Katch-McArdle was used */
  note?: string;
}

export function calculateTDEE(input: TDEEInput): TDEEResult {
  const { gender, weight, height, age, activityLevel, bodyFatPercent } = input;

  // Validation
  if (weight < 20 || weight > 300) throw new Error('Please enter a weight between 20-300 kg');
  if (height < 100 || height > 250) throw new Error('Please enter a height between 100-250 cm');
  if (age < 10 || age > 100) throw new Error('Please enter an age between 10-100');

  let bmr: number;
  let formula: 'mifflin-st-jeor' | 'katch-mcardle';
  let note: string | undefined;

  if (bodyFatPercent && bodyFatPercent > 3 && bodyFatPercent < 60) {
    bmr = katchMcArdleBMR(weight, bodyFatPercent);
    formula = 'katch-mcardle';
    note = 'Using Katch-McArdle formula (body fat % provided — more accurate).';
  } else {
    bmr = mifflinStJeorBMR(gender, weight, height, age);
    formula = 'mifflin-st-jeor';
  }

  const multiplier = activityMultiplier(activityLevel);
  const tdee = Math.round(bmr * multiplier);

  return {
    bmr: Math.round(bmr),
    bmrFormula: formula,
    tdee,
    activityMultiplier: multiplier,
    targets: {
      lose: tdee - 500,
      maintain: tdee,
      gain: tdee + 500,
    },
    note,
  };
}
