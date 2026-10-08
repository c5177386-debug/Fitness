'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateWaterIntake,
  type WaterIntakeResult,
  type Climate,
} from '@/lib/calculators/water-intake';
import ContentBlocks, { type ContentBlock } from '@/components/ContentBlocks';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import WaterPercentile from '@/components/percentile/WaterPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

const climateValues: Climate[] = ['normal', 'hot', 'humid'];

interface SavedInputs {
  weight: string;
  exerciseMinutes: string;
  climateIndex: number;
}

export default function WaterIntakePage() {
  const t = useTranslations('water');
  const tCommon = useTranslations('common');

  const [weight, setWeight] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState('30');
  const [climateIndex, setClimateIndex] = useState(0);

  const [result, setResult] = useState<WaterIntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, WaterIntakeResult>(
    'water-intake-calculator'
  );

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ weight, exerciseMinutes, climateIndex });
  inputsRef.current = { weight, exerciseMinutes, climateIndex };

  /** Apply a chart patch and recompute (no history write). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.exerciseMinutes !== undefined)
      setExerciseMinutes(m.exerciseMinutes);
    try {
      const w = parseFloat(m.weight);
      const ex = parseInt(m.exerciseMinutes, 10) || 0;
      if (Number.isNaN(w)) throw new Error('bad');
      if (ex < 0 || ex > 480) throw new Error('bad');
      setError(null);
      setResult(
        calculateWaterIntake({
          weight: w,
          exerciseMinutes: ex,
          climate: climateValues[m.climateIndex],
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
      const w = parseFloat(weight);
      const ex = parseInt(exerciseMinutes) || 0;
      if (isNaN(w)) throw new Error(t('errors.weight'));
      if (ex < 0 || ex > 480) throw new Error(t('errors.exercise'));

      const res = calculateWaterIntake({
        weight: w,
        exerciseMinutes: ex,
        climate: climateValues[climateIndex],
      });
      setResult(res);
      history.addRecord({ weight, exerciseMinutes, climateIndex }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, WaterIntakeResult>) => {
    const i = entry.inputs;
    return {
      input: `${i.weight} kg · ${i.exerciseMinutes} min`,
      output: `${entry.result.totalLiters} L`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, WaterIntakeResult>) => {
    const i = entry.inputs;
    if (typeof i.weight === 'string') setWeight(i.weight);
    if (typeof i.exerciseMinutes === 'string') setExerciseMinutes(i.exerciseMinutes);
    if (Number.isInteger(i.climateIndex)) setClimateIndex(i.climateIndex);
    setResult(null);
    setError(null);
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Form */}
      <div id="calculator" className="card mb-8 scroll-mt-28">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('form.cardTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">{t('form.weight')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.weightPlaceholder')}
              min={5}
              max={300}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="calc-label">{t('form.exercise')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.exercisePlaceholder')}
              min={0}
              max={480}
              step={5}
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="calc-label">{t('form.climate')}</label>
            <select
              className="calc-input"
              value={climateIndex}
              onChange={(e) => setClimateIndex(parseInt(e.target.value))}
            >
              {climateValues.map((_, i) => (
                <option key={i} value={i}>
                  {t(`form.climateOptions.${i}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateWater')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="result-card mb-8 space-y-4">
          <h2 className="text-xl font-bold text-primary-800">{t('result.title')}</h2>

          <div className="text-center py-6 bg-white rounded-xl border border-primary-200">
            <div className="text-sm text-slate-600 uppercase tracking-wide">
              {t('result.dailyWater')}
            </div>
            <div className="text-5xl font-bold text-primary-700 mt-2">
              {result.totalLiters}
            </div>
            <div className="text-sm text-slate-500 mt-1">{t('result.liters')}</div>
            <div className="flex justify-center gap-4 text-sm text-slate-600 mt-3">
              <span>{result.totalOunces} oz</span>
              <span>{result.totalCups} cups</span>
              <span>{result.totalMl} ml</span>
            </div>
          </div>

          <div className="pt-4 border-t border-primary-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{t('result.howWeGot')}</h3>
            <div className="bg-white rounded-xl overflow-hidden text-sm">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold">{t('result.base')}</td>
                    <td className="p-3 text-right text-slate-600">{result.breakdown.base} ml</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">{t('result.activity')}</td>
                    <td className="p-3 text-right text-slate-600">
                      {result.breakdown.activity} ml
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">{t('result.climate')}</td>
                    <td className="p-3 text-right text-slate-600">
                      {result.breakdown.climate} ml
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3">{t('result.total')}</td>
                    <td className="p-3 text-right text-primary-700">{result.totalMl} ml</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <WaterPercentile
        weightStr={weight}
        climate={climateValues[climateIndex]}
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