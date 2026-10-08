/**
 * Intermittent Fasting Schedule Engine
 *
 * Given a wake time and a fasting method, produces the daily schedule:
 * previous-day fast start, wake, eating-window start/end.
 *
 * The eating window is centered after wake using the standard offset
 * (24 − eating hours) / 2, matching common 16:8 guidance (e.g. wake 7:00
 * → eat 11:00–19:00, fast from 19:00 the prior evening).
 */

export type IFMethod = '16:8' | '18:6' | '14:10' | '20:4' | 'omad';

export interface IFInput {
  /** wake hour, 0-23 */
  wakeHour: number;
  /** wake minute, 0-59 */
  wakeMinute?: number;
  method: IFMethod;
}

export interface IFSchedule {
  method: IFMethod;
  fastingHours: number;
  eatingHours: number;
  /** clock minutes from midnight (0-1439) */
  wake: number;
  eatingStart: number;
  eatingEnd: number;
  /** fast began previous evening */
  fastStart: number;
}

const METHOD_HOURS: Record<IFMethod, { fast: number; eat: number }> = {
  '16:8': { fast: 16, eat: 8 },
  '18:6': { fast: 18, eat: 6 },
  '14:10': { fast: 14, eat: 10 },
  '20:4': { fast: 20, eat: 4 },
  omad: { fast: 23, eat: 1 },
};

export function calculateSchedule(input: IFInput): IFSchedule {
  const { wakeHour, wakeMinute = 0, method } = input;

  if (wakeHour < 0 || wakeHour > 23) throw new Error('Wake hour must be 0-23');
  if (wakeMinute < 0 || wakeMinute > 59) throw new Error('Wake minute must be 0-59');

  const { fast: fastingHours, eat: eatingHours } = METHOD_HOURS[method];
  const wake = wakeHour * 60 + wakeMinute;
  // Standard schedule: eating window ends 12h after wake
  // (16:8, wake 07:00 → eat 11:00–19:00, fast from 19:00 prior evening)
  const offsetHours = fastingHours - 12;

  const eatingStartRaw = wake + offsetHours * 60;
  const eatingStart = mod(eatingStartRaw, 1440);
  const eatingEnd = mod(eatingStartRaw + eatingHours * 60, 1440);
  const fastStart = mod(eatingStartRaw + eatingHours * 60, 1440);

  return {
    method,
    fastingHours,
    eatingHours,
    wake,
    eatingStart,
    eatingEnd,
    fastStart,
  };
}

/** Format clock minutes as HH:MM */
export function formatClock(minutes: number): string {
  const h = Math.floor(mod(minutes, 1440) / 60);
  const m = Math.round(mod(minutes, 1440) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
