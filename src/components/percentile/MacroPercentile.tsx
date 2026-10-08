'use client';

import { useTranslations } from 'next-intl';
import {
  evaluateMacroCalories,
  macroNorm,
  thresholdsForCenter,
  weightForTDEE,
  normalPdf,
  type Gender,
} from '@/lib/norms/percentile';
import type { MacroResult } from '@/lib/calculators/macro';
import {
  activityMultiplier,
  type ActivityLevel,
} from '@/lib/calculators/tdee';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface MacroPercentileProps {
  gender: Gender;
  ageStr: string;
  heightStr: string;
  activityLevel: ActivityLevel;
  result: MacroResult | null;
  onPatch: (patch: Record<string, string>) => void;
}

function kcalCells(bounds: number[]): string[] {
  return bounds.map((b, i) => {
    if (i === 0) return `≤ ${bounds[i + 1] - 1}`;
    if (i === bounds.length - 1) return `≥ ${b}`;
    return `${b}–${bounds[i + 1] - 1}`;
  });
}

/**
 * "You vs Your Peers" for the macro calorie target.
 * Tables always render for SEO; drag adjusts body weight (calorie totals
 * follow via the Mifflin-St Jeor pipeline).
 */
export default function MacroPercentile({
  gender,
  ageStr,
  heightStr,
  activityLevel,
  result,
  onPatch,
}: MacroPercentileProps) {
  const t = useTranslations('percentile');

  const age = parseInt(ageStr, 10);
  const height = parseFloat(heightStr);
  const active = result !== null && !Number.isNaN(age);
  const mult = activityMultiplier(activityLevel);

  const ev = active
    ? evaluateMacroCalories(gender, age, (result as MacroResult).calories)
    : null;

  const categoryHeaders = macroNorm.categories.map((c) => t(`cat_${c}`));
  const genderLabel = t(gender === 'female' ? 'genderFemale' : 'genderMale');

  const handleChange = (kcal: number) => {
    if (Number.isNaN(height)) return;
    const w = weightForTDEE(kcal, mult, { gender, height, age });
    if (w >= 20 && w <= 300) onPatch({ weight: w.toFixed(1) });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('title')}</h2>

      {active && ev && (
        <>
          <PercentileBadge
            text={t('badgeTDEE', {
              pct: ev.percentile,
              gender: genderLabel,
              age,
            })}
          />
          <p className="mt-3 text-sm text-slate-600">
            {t(`cat_${macroNorm.categories[ev.categoryIndex]}`)}
          </p>

          <DistributionChart
            axisMin={ev.axisMin}
            axisMax={ev.axisMax}
            thresholds={ev.thresholds}
            colors={['#0ea5e9', '#38bdf8', '#65a30d', '#f59e0b', '#ef4444']}
            userValue={(result as MacroResult).calories}
            density={(x) => normalPdf(x, ev.center, macroNorm.sigma)}
            ariaLabel={t('ariaTDEE', {
              gender: genderLabel,
              age,
              value: (result as MacroResult).calories,
              category: t(`cat_${macroNorm.categories[ev.categoryIndex]}`),
              pct: ev.percentile,
            })}
            xAxisLabel={t('axisTDEE')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(Math.round(n))}
            interactive
            onChange={handleChange}
          />
          <DragHint text={t('dragHint')} />
        </>
      )}

      {(['female', 'male'] as Gender[]).map((tableGender) => (
        <div key={tableGender} className={active ? 'mt-8' : 'mt-2'}>
          <h3 className="text-base font-bold text-slate-900 mb-3">
            {t('tableMacroTitle')} ·{' '}
            {t(tableGender === 'female' ? 'genderFemale' : 'genderMale')}
          </h3>
          <NormTable
            caption={t('tableMacroTitle')}
            firstHeader={t('ageBandH')}
            categoryHeaders={categoryHeaders}
            rows={(macroNorm.ageBands ?? []).map((band) => ({
              firstCell: band.id,
              cells: kcalCells(
                thresholdsForCenter(macroNorm, band.centers[tableGender])
              ),
              highlight:
                active && tableGender === gender && band.id === ev?.bandId,
            }))}
          />
        </div>
      ))}

      <SourceCitation sources={macroNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/macro-target-comparison.webp"
        alt={t('imageMacroAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainMacroTitle')}
        </h3>
        {t.raw('explainMacro').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
