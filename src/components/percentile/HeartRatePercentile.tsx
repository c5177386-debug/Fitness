'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  evaluateRestingHR,
  heartrateNorm,
  normalPdf,
  type Gender,
} from '@/lib/norms/percentile';
import type { HeartRateResult } from '@/lib/calculators/heart-rate';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface HeartRatePercentileProps {
  restingHrStr: string;
  result: HeartRateResult | null;
  onPatch: (patch: Record<string, string>) => void;
}

function bpmCells(bounds: number[]): string[] {
  return bounds.map((b, i) => {
    if (i === 0) return `≤ ${bounds[i + 1] - 1}`;
    if (i === bounds.length - 1) return `≥ ${b}`;
    return `${b}–${bounds[i + 1] - 1}`;
  });
}

/**
 * "You vs Your Peers" for resting heart rate (inverted metric: lower RHR
 * = better cardio fitness). Sex chosen inside the module. Drag adjusts
 * the resting HR value; training zones follow. Tables always render.
 */
export default function HeartRatePercentile({
  restingHrStr,
  result,
  onPatch,
}: HeartRatePercentileProps) {
  const t = useTranslations('percentile');

  const [sex, setSex] = useState<'' | Gender>('');

  const rhr = parseInt(restingHrStr, 10);
  const active = result !== null && sex !== '' && !Number.isNaN(rhr);

  const ev = active && sex ? evaluateRestingHR(sex, rhr) : null;
  const categoryHeaders = heartrateNorm.categories.map((c) => t(`hr_${c}`));
  const sexLabel = sex ? t(sex === 'female' ? 'genderFemale' : 'genderMale') : '';

  const handleChange = (v: number) => {
    onPatch({ restingHR: String(Math.round(v)) });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('title')}</h2>

      {/* In-module sex selection */}
      <div className="mb-5">
        <span className="calc-label block mb-2">{t('moduleSex')}</span>
        <div className="flex gap-3">
          {(['male', 'female'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={sex === g}
              onClick={() => setSex(g)}
              className={`min-h-[44px] px-5 rounded-xl text-sm font-semibold border transition-colors ${
                sex === g
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'
              }`}
            >
              {t(g === 'female' ? 'genderFemale' : 'genderMale')}
            </button>
          ))}
        </div>
      </div>

      {active && ev && sex && (
        <>
          <PercentileBadge
            text={t('badgeHR', { pct: ev.percentile, gender: sexLabel })}
          />
          <p className="mt-3 text-sm text-slate-600">
            {t(`hr_${heartrateNorm.categories[ev.categoryIndex]}`)}
          </p>

          <DistributionChart
            axisMin={heartrateNorm.axis.min}
            axisMax={heartrateNorm.axis.max}
            thresholds={ev.thresholds}
            colors={['#7c3aed', '#16a34a', '#65a30d', '#f59e0b', '#ef4444']}
            userValue={rhr}
            density={(x) =>
              normalPdf(
                x,
                heartrateNorm.density[sex].center,
                heartrateNorm.density[sex].sigma
              )
            }
            ariaLabel={t('ariaHR', {
              gender: sexLabel,
              value: rhr,
              category: t(`hr_${heartrateNorm.categories[ev.categoryIndex]}`),
              pct: ev.percentile,
            })}
            xAxisLabel={t('axisHR')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(Math.round(n))}
            interactive
            onChange={handleChange}
          />
          <DragHint text={t('dragHint')} />
        </>
      )}

      <div className={active ? 'mt-8' : 'mt-2'}>
        <h3 className="text-base font-bold text-slate-900 mb-3">
          {t('tableHRTitle')}
        </h3>
        <NormTable
          caption={t('tableHRTitle')}
          firstHeader={t('waterSexH')}
          categoryHeaders={categoryHeaders}
          rows={(['female', 'male'] as Gender[]).map((g) => ({
            firstCell: t(g === 'female' ? 'genderFemale' : 'genderMale'),
            cells: bpmCells(heartrateNorm.thresholds[g]),
            highlight: sex === g,
          }))}
        />
      </div>

      <SourceCitation sources={heartrateNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/resting-hr-comparison.webp"
        alt={t('imageHRAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainHRTitle')}
        </h3>
        {t.raw('explainHR').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
