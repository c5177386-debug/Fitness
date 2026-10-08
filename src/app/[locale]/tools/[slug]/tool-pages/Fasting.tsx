'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateSchedule,
  formatClock,
  type IFSchedule,
  type IFMethod,
} from '@/lib/calculators/if-timer';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import FastingPercentile from '@/components/percentile/FastingPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  method: IFMethod;
  wakeHour: string;
  wakeMinute: string;
}

const pad2 = (s: string) => String(parseInt(s) || 0).padStart(2, '0');

export default function FastingPage() {
  const t = useTranslations('fasting');
  const tCommon = useTranslations('common');

  const [method, setMethod] = useState<IFMethod>('16:8');
  const [wakeHour, setWakeHour] = useState('7');
  const [wakeMinute, setWakeMinute] = useState('0');

  const [result, setResult] = useState<IFSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, IFSchedule>(
    'intermittent-fasting-calculator'
  );

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ method, wakeHour, wakeMinute });
  inputsRef.current = { method, wakeHour, wakeMinute };

  /** Apply a chart patch (method selection) and recompute (no history). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.method !== undefined) setMethod(m.method as IFMethod);
    try {
      const h = parseInt(m.wakeHour, 10);
      const min = parseInt(m.wakeMinute, 10);
      if (Number.isNaN(h) || Number.isNaN(min)) throw new Error('bad');
      setError(null);
      setResult(
        calculateSchedule({
          wakeHour: h,
          wakeMinute: min,
          method: m.method as IFMethod,
        })
      );
    } catch {
      // transient — keep last good result
    }
  };

  const handleCalc = () => {
    setError(null);
    setResult(null);
    try {
      const h = parseInt(wakeHour);
      const m = parseInt(wakeMinute);
      if (isNaN(h)) throw new Error(t('errors.wakeHour'));
      if (isNaN(m)) throw new Error(t('errors.wakeMinute'));
      const res = calculateSchedule({ wakeHour: h, wakeMinute: m, method });
      setResult(res);
      history.addRecord({ method, wakeHour, wakeMinute }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, IFSchedule>) => {
    const i = entry.inputs;
    const r = entry.result;
    return {
      input: `${i.method} · wake ${pad2(i.wakeHour)}:${pad2(i.wakeMinute)}`,
      output: `${formatClock(r.eatingStart)}–${formatClock(r.eatingEnd)}`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, IFSchedule>) => {
    const i = entry.inputs;
    if (typeof i.method === 'string') setMethod(i.method as IFMethod);
    if (typeof i.wakeHour === 'string') setWakeHour(i.wakeHour);
    if (typeof i.wakeMinute === 'string') setWakeMinute(i.wakeMinute);
    setResult(null);
    setError(null);
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Timeline events in display order
  const events = result
    ? [
        { icon: '🌙', label: t('events.fastStart'), time: formatClock(result.fastStart), note: t('events.priorDay') },
        { icon: '🌅', label: t('events.wake'), time: formatClock(result.wake), note: '' },
        { icon: '🍽️', label: t('events.eatStart'), time: formatClock(result.eatingStart), note: '' },
        { icon: '⏰', label: t('events.eatEnd'), time: formatClock(result.eatingEnd), note: '' },
      ]
    : [];

  return (
    <>
      <div id="calculator" className="card mb-8 scroll-mt-28">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('form.cardTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="calc-label">{t('form.method')}</label>
            <select className="calc-input" value={method} onChange={(e) => setMethod(e.target.value as IFMethod)}>
              {(['14:10','16:8','18:6','20:4','omad'] as const).map((m) => (
                <option key={m} value={m}>{t(`form.method_${m.replace(':', '_')}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="calc-label">{t('form.wakeHour')}</label>
            <input className="calc-input" type="number" min={0} max={23} value={wakeHour} onChange={(e) => setWakeHour(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.wakeMinute')}</label>
            <input className="calc-input" type="number" min={0} max={59} value={wakeMinute} onChange={(e) => setWakeMinute(e.target.value)} />
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateFasting')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>
        )}
      </div>

      {result && (
        <div className="result-card mb-8">
          <h2 className="text-xl font-bold text-primary-800 mb-4">
            {t('result.title', { fast: result.fastingHours, eat: result.eatingHours })}
          </h2>

          <div className="bg-white rounded-xl divide-y divide-slate-100">
            {events.map((ev) => (
              <div key={ev.label} className="flex items-center gap-4 p-4">
                <div className="text-2xl">{ev.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{ev.label}</div>
                  {ev.note && <div className="text-xs text-slate-500">{ev.note}</div>}
                </div>
                <div className="text-lg font-bold text-primary-700 tabular-nums">{ev.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FastingPercentile result={result} onPatch={applyPatch} />

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
