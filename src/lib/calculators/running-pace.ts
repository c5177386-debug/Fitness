/**
 * Running Pace Calculator Engine
 *
 * Inputs: race distance (km) + total finish time (h/m/s).
 * Outputs: pace per km and per mile, speed, formatted time, and
 * per-kilometer split markers.
 */

export interface PaceInput {
  distanceKm: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface PaceSplit {
  km: number;
  /** cumulative split time, seconds */
  time: number;
}

export interface PaceResult {
  totalSeconds: number;
  /** seconds per km */
  paceSecPerKm: number;
  /** seconds per mile */
  paceSecPerMile: number;
  kmh: number;
  mph: number;
  splits: PaceSplit[];
}

const KM_PER_MILE = 1.609344;

export function calculatePace(input: PaceInput): PaceResult {
  const { distanceKm, hours, minutes, seconds } = input;

  if (!distanceKm || distanceKm <= 0) throw new Error('Enter a distance');
  if (distanceKm > 500) throw new Error('Distance is unrealistically large');
  if (hours < 0 || minutes < 0 || seconds < 0) throw new Error('Time cannot be negative');
  if (minutes >= 60 || seconds >= 60) throw new Error('Minutes and seconds must be below 60');

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds <= 0) throw new Error('Enter a finish time');

  const paceSecPerKm = totalSeconds / distanceKm;
  const paceSecPerMile = paceSecPerKm * KM_PER_MILE;
  const kmh = (distanceKm / totalSeconds) * 3600;
  const mph = kmh / KM_PER_MILE;

  // Whole-kilometer cumulative splits
  const splits: PaceSplit[] = [];
  for (let km = 1; km <= Math.floor(distanceKm); km++) {
    splits.push({ km, time: Math.round(paceSecPerKm * km) });
  }
  // Partial final split if distance isn't whole km (e.g. half/full marathon)
  if (distanceKm % 1 !== 0) {
    splits.push({
      km: Math.round(distanceKm * 100) / 100,
      time: totalSeconds,
    });
  }

  return {
    totalSeconds,
    paceSecPerKm,
    paceSecPerMile,
    kmh: round2(kmh),
    mph: round2(mph),
    splits,
  };
}

/** Format a duration as H:MM:SS or M:SS */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Pace format M:SS/unit */
export function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
