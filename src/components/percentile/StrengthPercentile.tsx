'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  evaluateStrength,
  strengthDensity,
  strengthNorm,
  workingWeightFor1RM,
  type Gender,
  type Lift,
} from '@/lib/norms/percentile';
import { kgToLb, lbToKg } from '@/lib/calculators/one-rep-max';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import DragHint from './DragHint';

const COLORS = ['#cbd5e1', '#f59e0b', '#65a30d', '#16a34a', '#7c3aed'];
const LIFTS: Lift[] = ['squat', 'bench', 'deadlift'];
const GENDERS: Gender[] = ['male', 'female'];

interface StrengthPercentileProps {
  /** Display unit chosen on the calculator page */
  unit: 'kg' | 'lb';
  /** Average estimated 1RM in kg; null before a calculation */
  oneRmKg: number | null;
  /** Reps used for the working-set inversion */
  repsStr: string;
  onPatch: (patch: Record<string, string>) => void;
}

type SelectValue<T extends string> = '' | T;

/**
 * "You vs Your Peers" module for 1RM strength.
 * Profile inputs and the complete standards reference always render (SSG
 * text in the HTML); the chart, badge and highlighted tables appear only
 * after a calculation plus an explicit sex/lift/body-weight selection.
 */
export default function StrengthPercentile({
  unit,
  oneRmKg,
  repsStr,
  onPatch,
}: StrengthPercentileProps) {
  const t = useTranslations('percentile');

  const [gender, setGender] = useState<SelectValue<Gender>>('');
  const [lift, setLift] = useState<SelectValue<Lift>>('');
  const [bwInput, setBwInput] = useState('');

  const hasResult = oneRmKg !== null && Number.isFinite(oneRmKg) && (oneRmKg as number) > 0;
  const displayValue = hasResult
    ? unit === 'lb'
      ? kgToLb(oneRmKg as number)
      : (oneRmKg as number)
    : null;
  const toLb = unit === 'lb' ? (v: number) => v : kgToLb;
  const fromLb = unit === 'lb' ? (v: number) => v : lbToKg;

  const bwNum = parseFloat(bwInput);
  const profileComplete =
    gender !== '' && lift !== '' && !Number.isNaN(bwNum) && bwNum > 0;
  const active = hasResult && profileComplete;

  let evalResult = null;
  if (active) {
    evalResult = evaluateStrength(
      gender as Gender,
      lift as Lift,
      toLb(bwNum),
      toLb(displayValue as number)
    );
  }

  const genderLabel = gender ? t(gender === 'female' ? 'genderFemale' : 'genderMale') : '';
  const liftLabel = lift ? t(`lift_${lift}`) : '';
  const categoryLabel = evalResult
    ? t(`lvl_${strengthNorm.categories[evalResult.categoryIndex]}`)
    : '';

  // Drag: target 1RM (display unit) → working weight for current reps
  const reps = parseInt(repsStr, 10);

  const handleChange = (targetDisplay: number) => {
    if (Number.isNaN(reps) || reps < 1 || reps > 50) return;
    const targetKg = unit === 'lb' ? lbToKg(targetDisplay) : targetDisplay;
    const workingKg = workingWeightFor1RM(targetKg, reps);
    const workingDisplay = unit === 'lb' ? kgToLb(workingKg) : workingKg;
    onPatch({ weight: workingDisplay.toFixed(1) });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-3">{t('title')}</h2>
      <p className="text-sm text-slate-600 mb-5">{t('profileIntro')}</p>

      <ProfileControls
        t={t}
        unit={unit}
        gender={gender}
        lift={lift}
        bwInput={bwInput}
        onGender={setGender}
        onLift={setLift}
        onBw={setBwInput}
      />

      {profileComplete && !hasResult && (
        <p className="mt-4 text-sm text-amber-700">{t('needResult')}</p>
      )}

      {active && evalResult && (
        <>
          <div className="mt-6">
            <PercentileBadge
              text={t('badgeStrength', {
                pct: evalResult.percentile,
                gender: genderLabel,
              })}
            />
            <p className="mt-3 text-sm text-slate-600">
              {liftLabel} · {categoryLabel}
            </p>
          </div>

          <DistributionChart
            axisMin={0}
            axisMax={fromLb(evalResult.axisMax)}
            thresholds={[0, ...evalResult.thresholds.map(fromLb)]}
            colors={COLORS}
            userValue={displayValue as number}
            density={(x) => {
              const xLb = unit === 'lb' ? x : kgToLb(x);
              return strengthDensity(xLb, evalResult.thresholds);
            }}
            ariaLabel={t('ariaStrength', {
              gender: genderLabel,
              lift: liftLabel,
              value: displayValue,
              unit,
              category: categoryLabel,
              pct: evalResult.percentile,
            })}
            xAxisLabel={t('chartXStrength', { unit })}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(Math.round(n))}
            interactive
            onChange={handleChange}
          />
          <DragHint text={t('dragHint')} />

          {/* Highlighted table for the selected lift; others collapsed */}
          {LIFTS.map((tableLift) => {
            const isPrimary = tableLift === lift;
            if (isPrimary) {
              return (
                <div key={tableLift} className="mt-8">
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    {t('tableStrengthTitle', { lift: t(`lift_${tableLift}`), unit })}
                  </h3>
                  <StrengthTable
                    gender={gender as Gender}
                    lift={tableLift}
                    unit={unit}
                    fromLb={fromLb}
                    highlightBwLb={toLb(bwNum)}
                  />
                </div>
              );
            }
            return (
              <details key={tableLift} className="mt-4">
                <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-primary-700">
                  {t('tableStrengthTitle', { lift: t(`lift_${tableLift}`), unit })}
                </summary>
                <div className="mt-2">
                  <StrengthTable
                    gender={gender as Gender}
                    lift={tableLift}
                    unit={unit}
                    fromLb={fromLb}
                    highlightBwLb={null}
                  />
                </div>
              </details>
            );
          })}
        </>
      )}

      {/* Complete reference: every lift × every sex — always in SSG HTML */}
      <details className="mt-8 border-t border-slate-100 pt-4">
        <summary className="min-h-[44px] cursor-pointer text-sm font-bold text-slate-900">
          {t('referenceTitle')}
        </summary>
        {GENDERS.map((g) => (
          <div key={g} className="mt-5">
            <h4 className="text-sm font-bold text-slate-800 mb-2">
              {t(g === 'female' ? 'genderFemale' : 'genderMale')}
            </h4>
            {LIFTS.map((l) => (
              <div key={l} className="mb-5">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  {t('tableStrengthTitle', { lift: t(`lift_${l}`), unit })}
                </p>
                <StrengthTable
                  gender={g}
                  lift={l}
                  unit={unit}
                  fromLb={fromLb}
                  highlightBwLb={null}
                />
              </div>
            ))}
          </div>
        ))}
      </details>

      <SourceCitation sources={strengthNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/strength-standards-comparison.webp"
        alt={t('imageStrengthAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainStrengthTitle')}
        </h3>
        {t.raw('explainStrength').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

// ── Module-local profile inputs ────────────────────────────────────

function ProfileControls({
  t,
  unit,
  gender,
  lift,
  bwInput,
  onGender,
  onLift,
  onBw,
}: {
  t: ReturnType<typeof useTranslations>;
  unit: 'kg' | 'lb';
  gender: string;
  lift: string;
  bwInput: string;
  onGender: (v: Gender) => void;
  onLift: (v: Lift) => void;
  onBw: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="calc-label">{t('profileGender')}</label>
        <select
          className="calc-input"
          value={gender}
          onChange={(e) => onGender(e.target.value as Gender)}
        >
          <option value="">{t('selectPlaceholder')}</option>
          <option value="male">{t('genderMale')}</option>
          <option value="female">{t('genderFemale')}</option>
        </select>
      </div>
      <div>
        <label className="calc-label">{t('profileLift')}</label>
        <select
          className="calc-input"
          value={lift}
          onChange={(e) => onLift(e.target.value as Lift)}
        >
          <option value="">{t('selectPlaceholder')}</option>
          {LIFTS.map((l) => (
            <option key={l} value={l}>
              {t(`lift_${l}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="calc-label">{t('profileBw', { unit })}</label>
        <input
          type="number"
          className="calc-input"
          value={bwInput}
          min={30}
          onChange={(e) => onBw(e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Norm table ─────────────────────────────────────────────────────

function StrengthTable({
  gender,
  lift,
  unit,
  fromLb,
  highlightBwLb,
}: {
  gender: Gender;
  lift: Lift;
  unit: 'kg' | 'lb';
  fromLb: (v: number) => number;
  /** When set, the class containing this body weight is highlighted */
  highlightBwLb: number | null;
}) {
  const t = useTranslations('percentile');
  const classes = strengthNorm.bwClasses[gender];

  let userRowIndex = -1;
  if (highlightBwLb !== null) {
    userRowIndex = classes.findIndex(
      (c) => c.max === null || (highlightBwLb as number) <= c.max
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table
        className="w-full text-sm"
        aria-label={t('tableStrengthTitle', {
          lift: t(`lift_${lift}`),
          unit,
        })}
      >
        <caption className="sr-only">
          {t('tableStrengthTitle', { lift: t(`lift_${lift}`), unit })}
        </caption>
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
              {t('bwClassH', { unit })}
            </th>
            {strengthNorm.categories.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap"
              >
                {t(`lvl_${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {classes.map((c, i) => {
            const v = c[lift].map(fromLb);
            const rowLabel =
              c.max === null
                ? `> ${fromLb(classes[i - 1].max as number)}`
                : `≤ ${fromLb(c.max)}`;
            return (
              <tr
                key={`${lift}-${i}`}
                className={i === userRowIndex ? 'bg-primary-50' : undefined}
              >
                <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                  {rowLabel}
                </td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{`< ${v[0]}`}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{`${v[0]} – ${v[1]}`}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{`${v[1]} – ${v[2]}`}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{`${v[2]} – ${v[3]}`}</td>
                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{`≥ ${v[3]}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
