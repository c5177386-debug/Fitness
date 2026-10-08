'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculatePace,
  formatDuration,
  formatPace,
  type PaceResult,
} from '@/lib/calculators/running-pace';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import RunningPercentile from '@/components/percentile/RunningPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  preset: string;
  distanceKm: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const pad = (s: string) => String(parseInt(s) || 0).padStart(2, '0');

const PRESET_LABELS: Record<string, string> = {
  '5': '5k',
  '10': '10k',
  '21.0975': 'Half',
  '42.195': 'Full',
};
const presetLabel = (preset: string) => PRESET_LABELS[preset] ?? '5k';

export default function RunningPacePage() {
  const t = useTranslations('running');
  const tCommon = useTranslations('common');

  const [preset, setPreset] = useState('10');
  const [distanceKm, setDistanceKm] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const [result, setResult] = useState<PaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, PaceResult>('running-pace-calculator');

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ preset, distanceKm, hours, minutes, seconds });
  inputsRef.current = { preset, distanceKm, hours, minutes, seconds };

  /** Apply a chart patch (finish time parts) and recompute (no history). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.hours !== undefined) setHours(m.hours);
    if (patch.minutes !== undefined) setMinutes(m.minutes);
    if (patch.seconds !== undefined) setSeconds(m.seconds);
    try {
      const dist =
        m.preset === 'custom'
          ? parseFloat(m.distanceKm)
          : parseFloat(m.preset);
      const h = parseInt(m.hours, 10) || 0;
      const min = parseInt(m.minutes, 10);
      const sec = parseInt(m.seconds, 10);
      if (Number.isNaN(dist) || dist <= 0) throw new Error('bad');
      if (Number.isNaN(min) || Number.isNaN(sec)) throw new Error('bad');
      if (min >= 60 || sec >= 60) throw new Error('bad');
      setError(null);
      setResult(
        calculatePace({ distanceKm: dist, hours: h, minutes: min, seconds: sec })
      );
    } catch {
      // transient — keep last good result
    }
  };

  const handleCalc = () => {
    setError(null);
    setResult(null);
    try {
      const dist = preset === 'custom' ? parseFloat(distanceKm) : parseFloat(preset);
      if (isNaN(dist)) throw new Error(t('errors.distance'));
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes);
      const s = parseInt(seconds);
      if (isNaN(m)) throw new Error(t('errors.minutes'));
      if (isNaN(s)) throw new Error(t('errors.seconds'));
      const res = calculatePace({ distanceKm: dist, hours: h, minutes: m, seconds: s });
      setResult(res);
      history.addRecord({ preset, distanceKm, hours, minutes, seconds }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, PaceResult>) => {
    const i = entry.inputs;
    const distLabel =
      i.preset === 'custom'
        ? `${i.distanceKm} km`
        : t(`form.preset${presetLabel(i.preset)}`);
    const h = parseInt(i.hours) || 0;
    const timeLabel = `${h}:${pad(i.minutes)}:${pad(i.seconds)}`;
    return {
      input: `${distLabel} · ${timeLabel}`,
      output: `${formatPace(entry.result.paceSecPerKm)}/km`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, PaceResult>) => {
    const i = entry.inputs;
    if (typeof i.preset === 'string') setPreset(i.preset);
    if (typeof i.distanceKm === 'string') setDistanceKm(i.distanceKm);
    if (typeof i.hours === 'string') setHours(i.hours);
    if (typeof i.minutes === 'string') setMinutes(i.minutes);
    if (typeof i.seconds === 'string') setSeconds(i.seconds);
    setResult(null);
    setError(null);
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div id="calculator" className="card mb-8 scroll-mt-28">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('form.cardTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="calc-label">{t('form.preset')}</label>
            <select className="calc-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="5">{t('form.preset5k')}</option>
              <option value="10">{t('form.preset10k')}</option>
              <option value="21.0975">{t('form.presetHalf')}</option>
              <option value="42.195">{t('form.presetFull')}</option>
              <option value="custom">{t('form.presetCustom')}</option>
            </select>
          </div>
          {preset === 'custom' && (
            <div className="sm:col-span-2">
              <label className="calc-label">{t('form.distanceKm')}</label>
              <input className="calc-input" type="number" step="0.1" placeholder={t('form.distancePlaceholder')} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
            </div>
          )}
          <div>
            <label className="calc-label">{t('form.hours')}</label>
            <input className="calc-input" type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.minutes')}</label>
            <input className="calc-input" type="number" min={0} max={59} placeholder={t('form.minutesPlaceholder')} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.seconds')}</label>
            <input className="calc-input" type="number" min={0} max={59} placeholder={t('form.secondsPlaceholder')} value={seconds} onChange={(e) => setSeconds(e.target.value)} />
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculatePace')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>
        )}
      </div>

      {result && (
        <div className="result-card mb-8">
          <h2 className="text-xl font-bold text-primary-800 mb-4">{t('result.title')}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.paceKm')}</div>
              <div className="text-3xl font-bold text-slate-900">{formatPace(result.paceSecPerKm)}</div>
              <div className="text-xs text-slate-500">/km</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.paceMile')}</div>
              <div className="text-3xl font-bold text-slate-900">{formatPace(result.paceSecPerMile)}</div>
              <div className="text-xs text-slate-500">/mile</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500">{t('result.kmh')}</div>
              <div className="text-lg font-bold text-slate-900">{result.kmh}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500">{t('result.mph')}</div>
              <div className="text-lg font-bold text-slate-900">{result.mph}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500">{t('result.finish')}</div>
              <div className="text-lg font-bold text-slate-900">{formatDuration(result.totalSeconds)}</div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-primary-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{t('result.splits')}</h3>
            <div className="bg-white rounded-xl max-h-72 overflow-y-auto text-sm">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {result.splits.map((split) => (
                    <tr key={split.km}>
                      <td className="px-3 py-2 font-semibold">{split.km} km</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatDuration(split.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <RunningPercentile
        distanceKm={
          Number.isNaN(
            preset === 'custom'
              ? parseFloat(distanceKm)
              : parseFloat(preset)
          )
            ? null
            : preset === 'custom'
              ? parseFloat(distanceKm)
              : parseFloat(preset)
        }
        result={result}
        onPatch={applyPatch}
      />

      <HistoryPanel
        records={history.records}
        isHydrated={history.isHydrated}
        isStorageAvailable={history.isStorageAvailable}
        summarize={summarize}
        onRestore={restoreEntry}
        onRemove={history.removeRecord}
        onClear={history.clearRecords}
      />
    </>
  );
}
