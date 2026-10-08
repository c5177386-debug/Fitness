'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateTDEE,
  type TDEEResult,
  type ActivityLevel,
  type Gender,
} from '@/lib/calculators/tdee';
import ContentBlocks, { type ContentBlock } from '@/components/ContentBlocks';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import TDEEPercentile from '@/components/percentile/TDEEPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

const activityValues: ActivityLevel[] = [
  'sedentary',
  'lightly-active',
  'moderately-active',
  'very-active',
  'extra-active',
];

interface SavedInputs {
  gender: Gender;
  weight: string;
  height: string;
  age: string;
  activityIndex: number;
  showBodyFat: boolean;
  bodyFatPercent: string;
}

export default function TDEEPage() {
  const t = useTranslations('tdee');
  const tCommon = useTranslations('common');

  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activityIndex, setActivityIndex] = useState(2);
  const [bodyFatPercent, setBodyFatPercent] = useState('');
  const [showBodyFat, setShowBodyFat] = useState(false);

  const [result, setResult] = useState<TDEEResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, TDEEResult>('tdee-calculator');

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({
    gender, weight, height, age, activityIndex, bodyFatPercent, showBodyFat,
  });
  inputsRef.current = { gender, weight, height, age, activityIndex, bodyFatPercent, showBodyFat };

  /** Apply a patch from the chart and recompute (no history write). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.weight !== undefined) setWeight(m.weight);
    try {
      const w = parseFloat(m.weight);
      const h = parseFloat(m.height);
      const a = parseInt(m.age, 10);
      if (Number.isNaN(w) || Number.isNaN(h) || Number.isNaN(a)) throw new Error('bad');
      const bf =
        m.showBodyFat && m.bodyFatPercent
          ? parseFloat(m.bodyFatPercent)
          : undefined;
      setError(null);
      setResult(
        calculateTDEE({
          gender: m.gender as Gender,
          weight: w,
          height: h,
          age: a,
          activityLevel: activityValues[m.activityIndex],
          bodyFatPercent: bf,
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
      const h = parseFloat(height);
      const a = parseInt(age);
      if (isNaN(w)) throw new Error(t('errors.weight'));
      if (isNaN(h)) throw new Error(t('errors.height'));
      if (isNaN(a)) throw new Error(t('errors.age'));

      const bf = showBodyFat && bodyFatPercent ? parseFloat(bodyFatPercent) : undefined;

      const res = calculateTDEE({
        gender,
        weight: w,
        height: h,
        age: a,
        activityLevel: activityValues[activityIndex],
        bodyFatPercent: bf,
      });
      setResult(res);
      history.addRecord(
        { gender, weight, height, age, activityIndex, showBodyFat, bodyFatPercent },
        res
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, TDEEResult>) => {
    const i = entry.inputs;
    return {
      input: `${i.weight} kg · ${i.age} y · ${t(`form.activityOptions.${i.activityIndex}`)}`,
      output: `${entry.result.tdee} kcal`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, TDEEResult>) => {
    const i = entry.inputs;
    if (i.gender === 'male' || i.gender === 'female') setGender(i.gender);
    if (typeof i.weight === 'string') setWeight(i.weight);
    if (typeof i.height === 'string') setHeight(i.height);
    if (typeof i.age === 'string') setAge(i.age);
    if (Number.isInteger(i.activityIndex)) setActivityIndex(i.activityIndex);
    setShowBodyFat(!!i.showBodyFat);
    if (typeof i.bodyFatPercent === 'string') setBodyFatPercent(i.bodyFatPercent);
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
            <label className="calc-label">{t('form.gender')}</label>
            <select
              className="calc-input"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="male">{t('form.male')}</option>
              <option value="female">{t('form.female')}</option>
            </select>
          </div>
          <div>
            <label className="calc-label">{t('form.age')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.agePlaceholder')}
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="calc-label">{t('form.weight')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.weightPlaceholder')}
              min={20}
              max={300}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="calc-label">{t('form.height')}</label>
            <input
              type="number"
              className="calc-input"
              placeholder={t('form.heightPlaceholder')}
              min={100}
              max={250}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="calc-label">{t('form.activity')}</label>
            <select
              className="calc-input"
              value={activityIndex}
              onChange={(e) => setActivityIndex(parseInt(e.target.value))}
            >
              {activityValues.map((_, i) => (
                <option key={i} value={i}>
                  {t(`form.activityOptions.${i}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              className="text-primary-600 text-sm font-semibold hover:underline"
              onClick={() => setShowBodyFat(!showBodyFat)}
            >
              {showBodyFat ? t('form.hideBodyFat') : `+ ${t('form.knowBodyFat')}`}
            </button>
            {showBodyFat && (
              <input
                type="number"
                className="calc-input mt-2"
                placeholder={t('form.bodyFatPlaceholder')}
                min={3}
                max={60}
                step={0.5}
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
              />
            )}
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateTDEE')}
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
              {t('result.tdee')}
            </div>
            <div className="text-5xl font-bold text-primary-700 mt-1">{result.tdee}</div>
            <div className="text-sm text-slate-500 mt-1">{t('result.caloriesPerDay')}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 font-semibold uppercase">
                {t('result.bmr')}
              </div>
              <div className="text-2xl font-bold text-slate-900">{result.bmr}</div>
              <div className="text-xs text-slate-500">{t('result.bmrHint')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 font-semibold uppercase">
                {t('result.activity')}
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ×{result.activityMultiplier}
              </div>
              <div className="text-xs text-slate-500">{t('result.multiplierHint')}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-primary-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">{t('result.goalTitle')}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-red-700">{t('result.lose')}</div>
                <div className="text-xl font-bold text-red-900 mt-1">{result.targets.lose}</div>
                <div className="text-xs text-red-600">{t('result.loseHint')}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-green-700">{t('result.maintain')}</div>
                <div className="text-xl font-bold text-green-900 mt-1">
                  {result.targets.maintain}
                </div>
                <div className="text-xs text-green-600">{t('result.maintainHint')}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-blue-700">{t('result.gain')}</div>
                <div className="text-xl font-bold text-blue-900 mt-1">{result.targets.gain}</div>
                <div className="text-xs text-blue-600">{t('result.gainHint')}</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            {result.bmrFormula === 'katch-mcardle'
              ? t('result.formulaKM')
              : t('result.formulaMSJ')}
          </p>
        </div>
      )}

      <TDEEPercentile
        gender={gender}
        ageStr={age}
        heightStr={height}
        bodyFatStr={bodyFatPercent}
        showBodyFat={showBodyFat}
        activityMult={result ? result.activityMultiplier : 1.55}
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
