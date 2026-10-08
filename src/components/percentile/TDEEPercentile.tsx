'use client';

import { useTranslations } from 'next-intl';
import {
  evaluateTDEE,
  tdeeNorm,
  thresholdsForCenter,
  weightForTDEE,
  normalPdf,
  type Gender,
} from '@/lib/norms/percentile';
import type { TDEEResult } from '@/lib/calculators/tdee';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface TDEEPercentileProps {
  gender: Gender;
  ageStr: string;
  heightStr: string;
  bodyFatStr: string;
  showBodyFat: boolean;
  activityMult: number;
  result: TDEEResult | null;
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
 * "You vs Your Peers" for daily energy expenditure.
 * Neutral metric (higher isn't "better"): the percentile is simply the
 * share of peers who burn less. Tables always render for SEO.
 */
export default function TDEEPercentile({
  gender,
  ageStr,
  heightStr,
  bodyFatStr,
  showBodyFat,
  activityMult,
  result,
  onPatch,
}: TDEEPercentileProps) {
  const t = useTranslations('percentile');

  const age = parseInt(ageStr, 10);
  const height = parseFloat(heightStr);
  const active = result !== null && !Number.isNaN(age);

  const ev = active
    ? evaluateTDEE(gender, age, (result as TDEEResult).tdee)
    : null;

  const categoryHeaders = tdeeNorm.categories.map((c) => t(`cat_${c}`));
  const genderLabel = t(gender === 'female' ? 'genderFemale' : 'genderMale');

  const handleChange = (kcal: number) => {
    if (Number.isNaN(height)) return;
    const bodyFat =
      showBodyFat && bodyFatStr ? parseFloat(bodyFatStr) : undefined;
    const w = weightForTDEE(kcal, activityMult, {
      gender,
      height,
      age,
      bodyFatPercent: bodyFat,
    });
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
            {t(`cat_${tdeeNorm.categories[ev.categoryIndex]}`)}
          </p>

          <DistributionChart
            axisMin={ev.axisMin}
            axisMax={ev.axisMax}
            thresholds={ev.thresholds}
            colors={['#0ea5e9', '#38bdf8', '#65a30d', '#f59e0b', '#ef4444']}
            userValue={(result as TDEEResult).tdee}
            density={(x) => normalPdf(x, ev.center, tdeeNorm.sigma)}
            ariaLabel={t('ariaTDEE', {
              gender: genderLabel,
              age,
              value: (result as TDEEResult).tdee,
              category: t(`cat_${tdeeNorm.categories[ev.categoryIndex]}`),
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
            {t('tableTDEETitle')} ·{' '}
            {t(tableGender === 'female' ? 'genderFemale' : 'genderMale')}
          </h3>
          <NormTable
            caption={t('tableTDEETitle')}
            firstHeader={t('ageBandH')}
            categoryHeaders={categoryHeaders}
            rows={(tdeeNorm.ageBands ?? []).map((band) => ({
              firstCell: band.id,
              cells: kcalCells(
                thresholdsForCenter(tdeeNorm, band.centers[tableGender])
              ),
              highlight:
                active && tableGender === gender && band.id === ev?.bandId,
            }))}
          />
        </div>
      ))}

      <SourceCitation sources={tdeeNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/tdee-peer-comparison.webp"
        alt={t('imageTDEEAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainTDEETitle')}
        </h3>
        {t.raw('explainTDEE').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
