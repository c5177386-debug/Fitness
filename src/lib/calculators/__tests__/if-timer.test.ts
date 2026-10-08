import { describe, it, expect } from 'vitest';
import { calculateSchedule, formatClock } from '../if-timer';

describe('Intermittent Fasting schedule', () => {
  it('16:8 with wake 07:00 → eat 11:00–19:00, fast from 19:00 prior day', () => {
    const r = calculateSchedule({ wakeHour: 7, method: '16:8' });
    expect(r.eatingStart).toBe(11 * 60);
    expect(r.eatingEnd).toBe(19 * 60);
    expect(r.fastStart).toBe(19 * 60);
    expect(r.fastingHours).toBe(16);
  });

  it('18:6 with wake 07:00 → offset 6h → eat 13:00–19:00', () => {
    const r = calculateSchedule({ wakeHour: 7, method: '18:6' });
    expect(r.eatingStart).toBe(13 * 60);
    expect(r.eatingEnd).toBe(19 * 60);
  });

  it('OMAD with wake 07:00 → offset 11h → eat 18:00–19:00', () => {
    const r = calculateSchedule({ wakeHour: 7, method: 'omad' });
    expect(r.eatingStart).toBe(18 * 60);
  });

  it('wraps past midnight (wake 14:00, 18:6)', () => {
    // offset = 6h → eat 20:00, end 02:00 next day, fast starts 02:00
    const r = calculateSchedule({ wakeHour: 14, method: '18:6' });
    expect(r.eatingStart).toBe(20 * 60);
    expect(r.eatingEnd).toBe(2 * 60);
    expect(r.fastStart).toBe(2 * 60);
  });

  it('formats clock times', () => {
    expect(formatClock(11 * 60)).toBe('11:00');
    expect(formatClock(18 * 60 + 30)).toBe('18:30');
  });

  it('throws on invalid wake hour', () => {
    expect(() => calculateSchedule({ wakeHour: 25, method: '16:8' })).toThrow();
  });
});
