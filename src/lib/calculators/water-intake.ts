/**
 * Water Intake Calculator Engine
 *
 * Methodology (based on Institute of Medicine & NASM guidelines):
 * - Base requirement: 33 ml per kg of body weight
 * - Activity adjustment: +500 ml per 30 min of moderate-to-vigorous exercise
 * - Climate adjustment: +500-1000 ml for hot/humid conditions
 * - Age adjustment: Older adults (65+) may need to be more mindful of intake
 *
 * Note: Individual needs vary. This provides a science-based starting point.
 */

export type Climate = 'normal' | 'hot' | 'humid';

export interface WaterIntakeInput {
  /** kg */
  weight: number;
  /** minutes of daily exercise */
  exerciseMinutes: number;
  climate: Climate;
  /** ml per kg base rate */
  baseRate?: number;
}

export interface WaterIntakeResult {
  /** ml */
  totalMl: number;
  /** Liters (rounded to 1 decimal) */
  totalLiters: number;
  /** Ounces */
  totalOunces: number;
  /** Cups (US) */
  totalCups: number;
  breakdown: {
    base: number;
    activity: number;
    climate: number;
  };
}

const ML_PER_OUNCE = 29.5735;
const ML_PER_CUP = 236.588;
const DEFAULT_BASE_RATE = 33; // ml per kg

function roundToInt(n: number): number {
  return Math.round(n);
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calculateWaterIntake(input: WaterIntakeInput): WaterIntakeResult {
  const { weight, exerciseMinutes, climate, baseRate = DEFAULT_BASE_RATE } = input;

  // Validation
  if (weight < 5 || weight > 300) throw new Error('Please enter a weight between 5-300 kg');
  if (exerciseMinutes < 0 || exerciseMinutes > 480) throw new Error('Exercise time should be 0-480 minutes');

  // Base: weight * baseRate
  const base = weight * baseRate;

  // Activity: +500 ml per 30 min (pro-rated)
  const activity = (exerciseMinutes / 30) * 500;

  // Climate adjustment
  let climateAdjust = 0;
  if (climate === 'hot') climateAdjust = 500;
  if (climate === 'humid') climateAdjust = 750;

  const total = base + activity + climateAdjust;

  return {
    totalMl: roundToInt(total),
    totalLiters: roundTo1(total / 1000),
    totalOunces: roundTo1(total / ML_PER_OUNCE),
    totalCups: roundTo1(total / ML_PER_CUP),
    breakdown: {
      base: roundToInt(base),
      activity: roundToInt(activity),
      climate: climateAdjust,
    },
  };
}
