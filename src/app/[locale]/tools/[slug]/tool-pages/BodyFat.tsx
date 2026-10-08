'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateBodyFat,
  type BodyFatResult,
} from '@/lib/calculators/body-fat';
import type { Gender } from '@/lib/calculators/tdee';
import { useHistory } from '@/hooks/useHistory';
import HistoryPanel from '@/components/HistoryPanel';
import BodyFatPercentile from '@/components/percentile/BodyFatPercentile';
import type { HistoryEntry } from '@/lib/history/history-store';

interface SavedInputs {
  gender: Gender;
  age: string;
  weight: string;
  height: string;
  neck: string;
  waist: string;
  hip: string;
}

export default function BodyFatPage() {
  const t = useTranslations('bodyFat');
  const tCommon = useTranslations('common');

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');

  const [result, setResult] = useState<BodyFatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory<SavedInputs, BodyFatResult>('body-fat-calculator');

  // Latest form strings for drag-time recomputation (avoids stale closures)
  const inputsRef = useRef({ gender: 'male', age, weight, height, neck, waist, hip });
  inputsRef.current = { gender, age, weight, height, neck, waist, hip };

  /**
   * Apply a field patch coming from the draggable chart and recompute
   * immediately. No history writes; invalid transient states are ignored.
   */
  const applyPatch = (patch: Record<string, string>) => {
    const m = { ...inputsRef.current, ...patch };
    if (patch.waist !== undefined) setWaist(m.waist);
    if (patch.weight !== undefined) setWeight(m.weight);
    if (patch.height !== undefined) setHeight(m.height);
    if (patch.age !== undefined) setAge(m.age);
    if (patch.neck !== undefined) setNeck(m.neck);
    try {
      const num = (s: string) => {
        const v = parseFloat(s);
        if (Number.isNaN(v)) throw new Error('bad');
        return v;
      };
      const res = calculateBodyFat({
        gender: m.gender as Gender,
        age: num(m.age),
        weight: num(m.weight),
        height: num(m.height),
        neck: num(m.neck),
        waist: num(m.waist),
        hip: m.gender === 'female' ? num(m.hip) : undefined,
      });
      setError(null);
      setResult(res);
    } catch {
      // Transient invalid geometry while dragging — keep last good result
    }
  };

  const handleCalc = () => {
    setError(null);
    setResult(null);
    try {
      const num = (s: string, label: string) => {
        const v = parseFloat(s);
        if (isNaN(v)) throw new Error(label);
        return v;
      };
      const res = calculateBodyFat({
        gender,
        age: num(age, t('errors.age')),
        weight: num(weight, t('errors.weight')),
        height: num(height, t('errors.height')),
        neck: num(neck, t('errors.neck')),
        waist: num(waist, t('errors.waist')),
        hip: gender === 'female' ? num(hip, t('errors.hip')) : undefined,
      });
      setResult(res);
      history.addRecord({ gender, age, weight, height, neck, waist, hip }, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    }
  };

  const summarize = (entry: HistoryEntry<SavedInputs, BodyFatResult>) => {
    const i = entry.inputs;
    const hips = i.gender === 'female' ? ` · H${i.hip}` : '';
    return {
      input: `N${i.neck} · W${i.waist}${hips}`,
      output: `${entry.result.navy}% · ${t(`result.cat_${entry.result.category}`)}`,
    };
  };

  const restoreEntry = (entry: HistoryEntry<SavedInputs, BodyFatResult>) => {
    const i = entry.inputs;
    if (i.gender === 'male' || i.gender === 'female') setGender(i.gender);
    (['age', 'weight', 'height', 'neck', 'waist', 'hip'] as const).forEach((key) => {
      if (typeof i[key] === 'string') {
        const setters = {
          age: setAge,
          weight: setWeight,
          height: setHeight,
          neck: setNeck,
          waist: setWaist,
          hip: setHip,
        };
        setters[key](i[key] as string);
      }
    });
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
            <label className="calc-label">{t('form.height')}</label>
            <input className="calc-input" type="number" placeholder={t('form.heightPlaceholder')} value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.weight')}</label>
            <input className="calc-input" type="number" placeholder={t('form.weightPlaceholder')} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.neck')}</label>
            <input className="calc-input" type="number" placeholder={t('form.neckPlaceholder')} value={neck} onChange={(e) => setNeck(e.target.value)} />
          </div>
          <div>
            <label className="calc-label">{t('form.waist')}</label>
            <input className="calc-input" type="number" placeholder={t('form.waistPlaceholder')} value={waist} onChange={(e) => setWaist(e.target.value)} />
          </div>
          {gender === 'female' && (
            <div className="sm:col-span-2">
              <label className="calc-label">{t('form.hip')}</label>
              <input className="calc-input" type="number" placeholder={t('form.hipPlaceholder')} value={hip} onChange={(e) => setHip(e.target.value)} />
            </div>
          )}
        </div>
        <button className="calc-btn mt-6" onClick={handleCalc}>
          {tCommon('actions.calculateBodyFat')}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>
        )}
      </div>

      {result && (
        <div className="result-card mb-8">
          <h2 className="text-xl font-bold text-primary-800 mb-4">{t('result.title')}</h2>

          <div className="text-center py-6 bg-white rounded-xl border border-primary-200">
            <div className="text-sm text-slate-500 uppercase tracking-wide">{t('result.navy')}</div>
            <div className="text-5xl font-bold text-primary-700 mt-1">{result.navy}%</div>
            <div className="mt-3 inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase">
              {t(`result.cat_${result.category}`)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.bmi')}</div>
              <div className="text-2xl font-bold text-slate-900">{result.bmi}</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">{t('result.deurenberg')}</div>
              <div className="text-2xl font-bold text-slate-900">{result.bmiBF}%</div>
            </div>
          </div>
        </div>
      )}

      <BodyFatPercentile
        gender={gender}
        ageStr={age}
        heightStr={height}
        neckStr={neck}
        hipStr={hip}
        percent={result ? result.navy : null}
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
