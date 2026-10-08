'use client';

import { useTranslations } from 'next-intl';
import {
  evaluateBodyFat,
  bodyFatDensity,
  bodyFatNorm,
  waistForBodyFat,
  type Gender,
} from '@/lib/norms/percentile';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import DragHint from './DragHint';

const COLORS = ['#0ea5e9', '#16a34a', '#65a30d', '#f59e0b', '#ef4444'];

interface BodyFatPercentileProps {
  gender: Gender;
  ageStr: string;
  heightStr: string;
  neckStr: string;
  hipStr: string;
  /** Available only after a calculation */
  percent: number | null;
  onPatch: (patch: Record<string, string>) => void;
}

/** Format one integer range cell, e.g. 10–13 / ≥32 */
function rangeCell(thresholds: number[], i: number): string {
  const low = thresholds[i];
  if (i === thresholds.length - 1) return `≥${low}`;
  return `${low}–${thresholds[i + 1] - 1}`;
}

/**
 * "You vs Your Peers" module for body fat.
 * The reference tables, sources and explanation always render (SSG text for
 * SEO); the chart, badge and row highlight appear only after a calculation
 * with an explicit numeric age — nothing is guessed.
 */
export default function BodyFatPercentile({
  gender,
  ageStr,
  heightStr,
  neckStr,
  hipStr,
  percent,
  onPatch,
}: BodyFatPercentileProps) {
  const t = useTranslations('percentile');

  const age = parseInt(ageStr, 10);
  const height = parseFloat(heightStr);
  const neck = parseFloat(neckStr);
  const hip = parseFloat(hipStr);
  const hasEvaluation = percent !== null && !Number.isNaN(age) && Number.isFinite(percent);
  const evalResult = hasEvaluation
    ? evaluateBodyFat(gender, age, percent as number)
    : null;

  const genderLabel = t(gender === 'female' ? 'genderFemale' : 'genderMale');
  const categoryLabel = evalResult
    ? t(`cat_${bodyFatNorm.categories[evalResult.categoryIndex]}`)
    : '';

  // Drag: target body-fat % → waist circumference inversion
  const handleChange = (targetPct: number) => {
    if (Number.isNaN(height) || Number.isNaN(neck)) return;
    if (gender === 'female' && Number.isNaN(hip)) return;
    const waist = waistForBodyFat(
      targetPct,
      gender,
      height,
      neck,
      gender === 'female' ? hip : undefined
    );
    // Keep inside the engine's valid geometry
    if (gender === 'male' && waist <= neck + 0.5) return;
    if (gender === 'female' && waist + hip <= neck + 0.5) return;
    onPatch({ waist: waist.toFixed(1) });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('title')}</h2>

      {evalResult && (
        <>
          <PercentileBadge
            text={t('badgeBF', {
              pct: evalResult.percentile,
              gender: genderLabel,
              age,
            })}
          />
          <p className="mt-3 text-sm text-slate-600">{categoryLabel}</p>

          <DistributionChart
            axisMin={bodyFatNorm.axis[gender].min}
            axisMax={bodyFatNorm.axis[gender].max}
            thresholds={evalResult.thresholds}
            colors={COLORS}
            userValue={percent as number}
            density={(x) => bodyFatDensity(gender, x)}
            ariaLabel={t('ariaBF', {
              gender: genderLabel,
              age,
              value: percent,
              category: categoryLabel,
              pct: evalResult.percentile,
            })}
            xAxisLabel={t('chartXBF')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(Math.round(n))}
            interactive
            onChange={handleChange}
          />
          <DragHint text={t('dragHint')} />
        </>
      )}

      {/* Norm tables — full text content for both sexes, always in HTML */}
      {(['female', 'male'] as Gender[]).map((tableGender) => (
        <div key={tableGender} className={evalResult ? 'mt-8' : 'mt-2'}>
          <h3 className="text-base font-bold text-slate-900 mb-3">
            {t('tableBFTitle')} · {t(tableGender === 'female' ? 'genderFemale' : 'genderMale')}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table
              className="w-full text-sm"
              aria-label={`${t('tableBFTitle')} · ${t(
                tableGender === 'female' ? 'genderFemale' : 'genderMale'
              )}`}
            >
              <caption className="sr-only">
                {`${t('tableBFTitle')} · ${t(
                  tableGender === 'female' ? 'genderFemale' : 'genderMale'
                )}`}
              </caption>
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {t('ageBandH')}
                  </th>
                  {bodyFatNorm.categories.map((c) => (
                    <th
                      key={c}
                      className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      {t(`cat_${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bodyFatNorm.ageBands.map((band) => {
                  const isUserRow =
                    evalResult !== null &&
                    tableGender === gender &&
                    band.id === evalResult.bandId;
                  return (
                    <tr
                      key={`${tableGender}-${band.id}`}
                      className={isUserRow ? 'bg-primary-50' : undefined}
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                        {band.id}
                      </td>
                      {band.thresholds[tableGender].map((_, i) => (
                        <td
                          key={i}
                          className="px-3 py-2 text-slate-700 whitespace-nowrap"
                        >
                          {rangeCell(band.thresholds[tableGender], i)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <SourceCitation sources={bodyFatNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/body-fat-peer-comparison.webp"
        alt={t('imageBFAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainBFTitle')}
        </h3>
        {t.raw('explainBF').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
