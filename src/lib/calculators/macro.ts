/**
 * Macronutrient Calculator Engine
 *
 * Builds on the TDEE engine, then splits target calories into protein /
 * carbs / fat grams using three diet styles.
 *
 * Evidence base:
 * - Protein 1.6–2.2 g/kg for trained individuals (ISSN position stand, 2017)
 * - Dietary fat floor ≈ 0.7–1.0 g/kg to protect hormone health (ACSM)
 * - Calorie targets: ±500 kcal vs TDEE (consistent with the TDEE page)
 */

import {
  calculateTDEE,
  type ActivityLevel,
  type Gender,
} from './tdee';

export type MacroGoal = 'lose' | 'maintain' | 'gain';
export type DietStyle = 'balanced' | 'low-carb' | 'keto';

export interface MacroInput {
  gender: Gender;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: MacroGoal;
  dietStyle: DietStyle;
  bodyFatPercent?: number;
}

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  proteinPerKg: number;
  dietStyle: DietStyle;
  note?: string;
}

const PROTEIN_G_PER_KG: Record<MacroGoal, number> = {
  lose: 2.0,
  maintain: 1.7,
  gain: 1.8,
};

export function calculateMacros(input: MacroInput): MacroResult {
  const { weight, goal, dietStyle } = input;

  if (weight < 20 || weight > 300) throw new Error('Weight must be between 20-300 kg');

  // Reuse the validated TDEE pipeline
  const tdee = calculateTDEE({
    gender: input.gender,
    weight,
    height: input.height,
    age: input.age,
    activityLevel: input.activityLevel,
    bodyFatPercent: input.bodyFatPercent,
  });

  let calories: number;
  if (goal === 'lose') calories = tdee.targets.lose;
  else if (goal === 'gain') calories = tdee.targets.gain;
  else calories = tdee.targets.maintain;

  const proteinPerKg = PROTEIN_G_PER_KG[goal];
  const protein = Math.round(weight * proteinPerKg);
  const proteinKcal = protein * 4;

  let carbs: number;
  let fat: number;

  if (dietStyle === 'keto') {
    // ≈5% of calories from carbs, protein as set, remainder fat
    carbs = Math.max(0, Math.round((calories * 0.05) / 4));
    fat = Math.max(0, Math.round((calories - proteinKcal - carbs * 4) / 9));
  } else if (dietStyle === 'low-carb') {
    // ≈25% carbs, protein as set, remainder fat
    carbs = Math.max(0, Math.round((calories * 0.25) / 4));
    fat = Math.max(0, Math.round((calories - proteinKcal - carbs * 4) / 9));
  } else {
    // Balanced: fat floor 0.8 g/kg, protein by g/kg, carbs fill the rest
    fat = Math.round(weight * 0.8);
    carbs = Math.max(0, Math.round((calories - proteinKcal - fat * 9) / 4));
  }

  const pctOf = (gramKcal: number) =>
    Math.round((gramKcal / calories) * 100);

  const result: MacroResult = {
    calories,
    protein,
    carbs,
    fat,
    proteinPct: pctOf(proteinKcal),
    carbsPct: pctOf(carbs * 4),
    fatPct: pctOf(fat * 9),
    proteinPerKg,
    dietStyle,
  };

  if (tdee.bmrFormula === 'katch-mcardle') {
    result.note = 'TDEE calculated with the Katch-McArdle formula (body fat % provided).';
  }

  return result;
}
