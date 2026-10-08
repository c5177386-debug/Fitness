'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateMacros,
  type MacroResult,
  type MacroGoal,
  type DietStyle,
} from '@/lib/calculators/macro';
import type { ActivityLevel, Gender } from '@/lib/calculators/tdee';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import MacroPercentile from '@/components/percentile/MacroPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  gender: Gender;
  age: string;
  weight: string;
  height: string;
  activityLevel: ActivityLevel;
  goal: MacroGoal;
  dietStyle: DietStyle;
}

const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  'sedentary',
  'lightly-active',
  'moderately-active',
  'very-active',
  'extra-active',
];
const GOALS: readonly MacroGoal[] = ['lose', 'maintain', 'gain'];
const DIET_STYLES: readonly DietStyle[] = ['balanced', 'low-carb', 'keto'];

const isActivity = (v: unknown): v is ActivityLevel =>
  typeof v === 'string' && ACTIVITY_LEVELS.includes(v as ActivityLevel);
const isGoal = (v: unknown): v is MacroGoal =>
  typeof v === 'string' && GOALS.includes(v as MacroGoal);
const isStyle = (v: unknown): v is DietStyle =>
  typeof v === 'string' && DIET_STYLES.includes(v as DietStyle);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const styleLabel = (s: DietStyle) =>
  s === 'low-carb' ? 'LowCarb' : cap(s);


export default function MacroPage() {
  const t = useTranslations('macro');
  const tCommon = useTranslations('common');

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately-active');
  const [goal, setGoal] = useState<MacroGoal>('maintain');
  const [dietStyle, setDietStyle] = useState<DietStyle>('balanced');

  const [result, setResult] = useState<MacroResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, MacroResult>('macro-calculator');

  // Latest form strings for drag-time recomputation
  const inputsRef = useRef({ gender, age, weight, height, activityLevel });
  inputsRef.current = { gender, age, weight, height, activityLevel };

  /** Apply a chart patch and recompute (no history write). */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.weight !== undefined) setWeight(m.weight);
    try {
      const a = parseInt(m.age, 10);
      const w = parseFloat(m.weight);
      const h = parseFloat(m.height);
      if (Number.isNaN(a) || Number.isNaN(w) || Number.isNaN(h)) {
        throw new Error('bad');
      }
      setError(null);
      setResult(
        calculateMacros({
          gender: m.gender as Gender,
          age: a,
          weight: w,
          height: h,
          activityLevel: m.activityLevel as ActivityLevel,
          goal,
          dietStyle,
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
      const a = parseInt(age);
      const w = parseFloat(weight);
      const h = parseFloat(height);
      if (isNaN(a)) throw new Error(t('errors.age'));
      if (isNaN(w)) throw new Error(t('errors.weight'));
      if (isNaN(h)) throw new Error(t('errors.height'));
      const res = calculateMacros({
        gender,
        age: a,
        weight: w,
        height: h,
        activityLevel,
        goal,
        dietStyle,
      });
      setResult(res);
      history.addRecord(
        { gender, age, weight, height, activityLevel, goal, dietStyle },
        res
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, MacroResult>) => {
    const i = entry.inputs;
    const r = entry.result;
    return {
      input: `${i.weight} kg · ${t(`form.goal${cap(i.goal)}`)} · ${t(
        `form.style${styleLabel(i.dietStyle)}`
      )}`,
      output: `P${r.protein} C${r.carbs} F${r.fat}`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, MacroResult>) => {
    const i = entry.inputs;
    if (i.gender === 'male' || i.gender === 'female') setGender(i.gender);
    if (typeof i.age === 'string') setAge(i.age);
    if (typeof i.weight === 'string') setWeight(i.weight);
    if (typeof i.height === 'string') setHeight(i.height);
    if (isActivity(i.activityLevel)) setActivityLevel(i.activityLevel);
    if (isGoal(i.goal)) setGoal(i.goal);
    if (isStyle(i.dietStyle)) setDietStyle(i.dietStyle);
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
            <label className="calc-label">{t('form.gender')}</label>
            <select className="calc-input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="male">{t('form.male')}</option>
              <option value="female">{t('form.female')}</option>
            </select>
          </div>
          <div>
            <label className="calc-label">{t('form.age')}</label>
            <input className="calc-input" type="number" placeholder={t('form.agePlaceholder')} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.weight')}</label>
            <input className="calc-input" type="number" placeholder={t('form.weightPlaceholder')} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.height')}</label>
            <input className="calc-input" type="number" placeholder={t('form.heightPlaceholder')} value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.activity')}</label>
            <select className="calc-input" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}>
              {(['sedentary','lightly-active','moderately-active','very-active','extra-active'] as const).map((v, i) => (
                <option key={v} value={v}>{t(`form.activityOptions.${i}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="calc-label">{t('form.goal')}</label>
            <select className="calc-input" value={goal} onChange={(e) => setGoal(e.target.value as MacroGoal)}>
              <option value="lose">{t('form.goalLose')}</option>
              <option value="maintain">{t('form.goalMaintain')}</option>
              <option value="gain">{t('form.goalGain')}</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="calc-label">{t('form.dietStyle')}</label>
            <select className="calc-input" value={dietStyle} onChange={(e) => setDietStyle(e.target.value as DietStyle)}>
              <option value="balanced">{t('form.styleBalanced')}</option>
              <option value="low-carb">{t('form.styleLowCarb')}</option>
              <option value="keto">{t('form.styleKeto')}</option>
            </select>
          </div>
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateMacros')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>
        )}
      </div>

      {result && (
        <div className="result-card mb-8">
          <h2 className="text-xl font-bold text-primary-800 mb-4">{t('result.title')}</h2>

          <div className="text-center py-5 bg-white rounded-xl border border-primary-200">
            <div className="text-sm text-slate-500 uppercase tracking-wide">{t('result.calories')}</div>
            <div className="text-5xl font-bold text-primary-700 mt-1">{result.calories}</div>
          </div>

          {/* Stacked ratio bar */}
          <div className="flex w-full h-4 rounded-full overflow-hidden mt-5">
            <div className="bg-red-400" style={{ width: `${result.proteinPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${result.carbsPct}%` }} />
            <div className="bg-primary-500" style={{ width: `${result.fatPct}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-red-500 uppercase">{t('result.protein')}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{result.protein}</div>
              <div className="text-xs text-slate-500">{result.proteinPct}% · {t('result.grams')}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-amber-500 uppercase">{t('result.carbs')}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{result.carbs}</div>
              <div className="text-xs text-slate-500">{result.carbsPct}% · {t('result.grams')}</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-primary-600 uppercase">{t('result.fat')}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{result.fat}</div>
              <div className="text-xs text-slate-500">{result.fatPct}% · {t('result.grams')}</div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            {t('result.proteinPerKg', { grams: result.proteinPerKg })}
          </p>
        </div>
      )}

      <MacroPercentile
        gender={gender}
        ageStr={age}
        heightStr={height}
        activityLevel={activityLevel}
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
