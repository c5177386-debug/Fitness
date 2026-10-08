'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateOneRepMax,
  repSchemeTargets,
  kgToLb,
  lbToKg,
  type OneRepMaxResult,
} from '@/lib/calculators/one-rep-max';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import StrengthPercentile from '@/components/percentile/StrengthPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  weight: string;
  reps: string;
  units: 'metric' | 'imperial';
}

export default function OneRepMaxPage() {
  const t = useTranslations('oneRM');
  const tCommon = useTranslations('common');

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [result, setResult] = useState<OneRepMaxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, OneRepMaxResult>(
    'one-rep-max-calculator'
  );

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ weight, reps, units });
  inputsRef.current = { weight, reps, units };

  /** Apply a patch from the draggable chart and recompute (no history). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.weight !== undefined) setWeight(m.weight);
    try {
      let w = parseFloat(m.weight);
      const r = parseInt(m.reps, 10);
      if (Number.isNaN(w) || w <= 0) throw new Error('bad');
      if (Number.isNaN(r) || r <= 0 || r > 50) throw new Error('bad');
      if (m.units === 'imperial') w = lbToKg(w);
      setError(null);
      setResult(calculateOneRepMax({ weight: w, reps: r }));
    } catch {
      // transient — keep last good result
    }
  };

  const handleCalc = () => {
    setError(null);
    setResult(null);
    try {
      let w = parseFloat(weight);
      const r = parseInt(reps);
      if (isNaN(w) || w <= 0) throw new Error(t('errors.weight'));
      if (isNaN(r) || r <= 0) throw new Error(t('errors.reps'));
      if (r > 50) throw new Error(t('errors.maxReps'));
      const rawW = w;
      if (units === 'imperial') w = lbToKg(w);
      const res = calculateOneRepMax({ weight: w, reps: r });
      setResult(res);
      history.addRecord({ weight: String(rawW), reps, units }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, OneRepMaxResult>) => {
    const { inputs, result: res } = entry;
    const unitLabel = inputs.units === 'imperial' ? 'lb' : 'kg';
    const avg =
      inputs.units === 'imperial' ? kgToLb(res.average) : res.average;
    return {
      input: `${inputs.weight} ${unitLabel} × ${inputs.reps}`,
      output: `1RM ${avg} ${unitLabel}`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, OneRepMaxResult>) => {
    const i = entry.inputs;
    if (typeof i.weight === 'string') setWeight(i.weight);
    if (typeof i.reps === 'string') setReps(i.reps);
    if (i.units === 'metric' || i.units === 'imperial') setUnits(i.units);
    setResult(null);
    setError(null);
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const display = (kg: number) =>
    units === 'imperial' ? `${kgToLb(kg)} lb` : `${kg} kg`;

  return (
    <>
      {/* Form */}
      <div id="calculator" className="card mb-8 scroll-mt-28">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('form.cardTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">{t('form.weight')}</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="calc-input flex-1"
                placeholder={t('form.weightPlaceholder')}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-label={t('form.weight')}
              />
              <select
                className="calc-input w-28 !py-3"
                value={units}
                onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
                aria-label="Units"
              >
                <option value="metric">kg</option>
                <option value="imperial">lb</option>
              </select>
            </div>
          </div>
          <div>
            <label className="calc-label">{t('form.reps')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.repsPlaceholder')}
              min={1}
              max={50}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              aria-label={t('form.reps')}
            />
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculate1RM')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="result-card mb-8">
          <h2 className="text-xl font-bold text-primary-800 mb-4">{t('result.title')}</h2>

          <div className="text-center py-4 border-b border-primary-200">
            <div className="text-sm text-slate-600 uppercase tracking-wide">
              {t('result.average')}
            </div>
            <div className="text-5xl font-bold text-primary-700 mt-2">
              {display(result.average)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 font-semibold">Epley</div>
              <div className="text-xl font-bold text-slate-900">{display(result.epley)}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 font-semibold">Brzycki</div>
              <div className="text-xl font-bold text-slate-900">{display(result.brzycki)}</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-primary-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              {t('result.trainingWeights')}
            </h3>
            <div className="bg-white rounded-xl overflow-hidden text-sm">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                      {t('result.colReps')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                      {t('result.colPercent')}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">
                      {t('result.colWeight')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repSchemeTargets(result.average).map((row) => (
                    <tr key={row.reps} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold">{row.reps}</td>
                      <td className="px-3 py-2 text-slate-600">{row.percent}%</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {display(row.weight)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.warning && (
            <div className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-200">
              ⚠️ {result.warning}
            </div>
          )}
        </div>
      )}

      <StrengthPercentile
        unit={units === 'metric' ? 'kg' : 'lb'}
        oneRmKg={result ? result.average : null}
        repsStr={reps}
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
