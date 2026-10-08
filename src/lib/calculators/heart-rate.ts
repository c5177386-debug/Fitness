/**
 * Target Heart Rate Calculator Engine
 *
 * Max HR:
 * - Tanaka (2001): 208 − 0.7 × age  — current consensus estimate
 * - Fox (1971): 220 − age — classic, shown for comparison
 *
 * Training zones use the Karvonen method:
 * target = restingHR + %HRR where HRR = max − resting.
 */

export interface HeartRateInput {
  age: number;
  /** resting heart rate, bpm */
  restingHR: number;
}

export interface HeartRateZone {
  /** zone number 1-5 */
  zone: number;
  low: number;
  high: number;
  lowPct: number;
  highPct: number;
}

export interface HeartRateResult {
  tanakaMax: number;
  foxMax: number;
  hrr: number;
  zones: HeartRateZone[];
}

export function tanakaMaxHR(age: number): number {
  return 208 - 0.7 * age;
}

export function foxMaxHR(age: number): number {
  return 220 - age;
}

const ZONE_PERCENTS: Array<[number, number]> = [
  [50, 60], // recovery
  [60, 70], // aerobic
  [70, 80], // tempo
  [80, 90], // threshold
  [90, 100], // VO2 max
];

export function calculateHeartRate(input: HeartRateInput): HeartRateResult {
  const { age, restingHR } = input;

  if (age < 10 || age > 100) throw new Error('Age must be 10-100');
  if (restingHR < 30 || restingHR > 120)
    throw new Error('Resting heart rate must be 30-120 bpm');

  const tanakaMax = Math.round(tanakaMaxHR(age));
  const foxMax = foxMaxHR(age);
  const hrr = tanakaMax - restingHR;

  if (hrr <= 0) throw new Error('Resting HR cannot exceed maximum HR');

  const zones: HeartRateZone[] = ZONE_PERCENTS.map(([lowPct, highPct], i) => ({
    zone: i + 1,
    lowPct,
    highPct,
    low: Math.round(restingHR + (lowPct / 100) * hrr),
    high: Math.round(restingHR + (highPct / 100) * hrr),
  }));

  return { tanakaMax, foxMax, hrr, zones };
}
