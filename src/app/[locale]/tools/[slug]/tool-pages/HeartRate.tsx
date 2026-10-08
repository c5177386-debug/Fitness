'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateHeartRate,
  type HeartRateResult,
} from '@/lib/calculators/heart-rate';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import HeartRatePercentile from '@/components/percentile/HeartRatePercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  age: string;
  restingHR: string;
}

const zoneColors = [
  'bg-slate-300',
  'bg-green-400',
  'bg-yellow-400',
  'bg-orange-400',
  'bg-red-500',
];

export default function HeartRatePage() {
  const t = useTranslations('heartRate');
  const tCommon = useTranslations('common');

  const [age, setAge] = useState('');
  const [restingHR, setRestingHR] = useState('');

  const [result, setResult] = useState<HeartRateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, HeartRateResult>(
    'target-heart-rate-calculator'
  );

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ age, restingHR });
  inputsRef.current = { age, restingHR };

  /** Apply a chart patch (resting HR) and recompute (no history write). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.restingHR !== undefined) setRestingHR(m.restingHR);
    try {
      const a = parseInt(m.age, 10);
      const r = parseInt(m.restingHR, 10);
      if (Number.isNaN(a) || Number.isNaN(r)) throw new Error('bad');
      setError(null);
      setResult(calculateHeartRate({ age: a, restingHR: r }));
    } catch {
      // transient — keep last good result
    }
  };

  const handleCalc = () => {
    setError(null);
    setResult(null);
    try {
      const a = parseInt(age);
      const r = parseInt(restingHR);
      if (isNaN(a)) throw new Error(t('errors.age'));
      if (isNaN(r)) throw new Error(t('errors.resting'));
      const res = calculateHeartRate({ age: a, restingHR: r });
      setResult(res);
      history.addRecord({ age, restingHR }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, HeartRateResult>) => {
    const i = entry.inputs;
    const r = entry.result;
    return {
      input: `${i.age} y · RHR ${i.restingHR}`,
      output: `Max ${r.tanakaMax} · ${r.zones[0].low}–${r.zones[4].high}`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, HeartRateResult>) => {
    const i = entry.inputs;
    if (typeof i.age === 'string') setAge(i.age);
    if (typeof i.restingHR === 'string') setRestingHR(i.restingHR);
    setResult(null);
    setError(null);
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div id="calculator" className="card mb-8 scroll-mt-28">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('form.cardTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">{t('form.age')}</label>
            <input className="calc-input" type="number" placeholder={t('form.agePlaceholder')} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.resting')}</label>
            <input className="calc-input" type="number" placeholder={t('form.restingPlaceholder')} value={restingHR} onChange={(e) => setRestingHR(e.target.value)} />
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateHeartRate')}
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
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.tanakaMax')}</div>
              <div className="text-3xl font-bold text-slate-900">{result.tanakaMax}</div>
              <div className="text-xs text-slate-500">bpm</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.foxMax')}</div>
              <div className="text-3xl font-bold text-slate-900">{result.foxMax}</div>
              <div className="text-xs text-slate-500">bpm</div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-primary-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{t('result.zones')}</h3>
            <div className="bg-white rounded-xl divide-y divide-slate-100">
              {result.zones.map((zone) => (
                <div key={zone.zone} className="flex items-center gap-3 p-3">
                  <div className={`w-8 h-8 rounded-lg ${zoneColors[zone.zone - 1]} flex items-center justify-center text-sm font-bold text-slate-800`}>
                    {zone.zone}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {t(`zones.z${zone.zone}`)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {zone.lowPct}–{zone.highPct}% HRR
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 tabular-nums">
                    {zone.low}–{zone.high} <span className="text-xs font-normal text-slate-500">bpm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <HeartRatePercentile
        restingHrStr={restingHR}
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
