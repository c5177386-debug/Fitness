'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  evaluateWater,
  waterNorm,
  exerciseForLiters,
  normalPdf,
  type Gender,
} from '@/lib/norms/percentile';
import type {
  WaterIntakeResult,
  Climate,
} from '@/lib/calculators/water-intake';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface WaterPercentileProps {
  weightStr: string;
  climate: Climate;
  result: WaterIntakeResult | null;
  onPatch: (patch: Record<string, string>) => void;
}

function literCells(bounds: number[]): string[] {
  return bounds.map((b, i) => {
    if (i === 0) return `≤ ${round1(bounds[i + 1] - 0.1)}`;
    if (i === bounds.length - 1) return `≥ ${round1(b)}`;
    return `${round1(b)}–${round1(bounds[i + 1] - 0.1)}`;
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * "You vs Your Peers" for daily water intake.
 * Sex is chosen inside the module (form itself has no sex field); the
 * reference table always renders. Drag changes daily exercise minutes.
 */
export default function WaterPercentile({
  weightStr,
  climate,
  result,
  onPatch,
}: WaterPercentileProps) {
  const t = useTranslations('percentile');

  const [sex, setSex] = useState<'' | Gender>('');

  const weight = parseFloat(weightStr);
  const active = result !== null && sex !== '';

  const liters = result ? result.totalLiters : 0;
  const ev = active ? evaluateWater(sex as Gender, liters) : null;

  const categoryHeaders = waterNorm.categories.map((c) => t(`cat_${c}`));
  const sexLabel = sex ? t(sex === 'female' ? 'genderFemale' : 'genderMale') : '';

  const handleChange = (targetLiters: number) => {
    if (Number.isNaN(weight)) return;
    const minutes = exerciseForLiters(targetLiters, weight, climate);
    onPatch({ exerciseMinutes: String(minutes) });
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
            text={t('badgeWater', { pct: ev.percentile, gender: sexLabel })}
          />
          <p className="mt-3 text-sm text-slate-600">
            {t(`cat_${waterNorm.categories[ev.categoryIndex]}`)}
          </p>

          <DistributionChart
            axisMin={ev.axisMin}
            axisMax={ev.axisMax}
            thresholds={ev.thresholds}
            colors={['#0ea5e9', '#38bdf8', '#65a30d', '#84cc16', '#f59e0b']}
            userValue={liters}
            density={(x) => normalPdf(x, ev.center, waterNorm.sigma)}
            ariaLabel={t('ariaWater', {
              gender: sexLabel,
              value: liters,
              category: t(`cat_${waterNorm.categories[ev.categoryIndex]}`),
              pct: ev.percentile,
            })}
            xAxisLabel={t('axisWater')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(round1(n))}
            interactive
            onChange={handleChange}
          />
          <DragHint text={t('dragHintWater')} />
        </>
      )}

      <div className={active ? 'mt-8' : 'mt-2'}>
        <h3 className="text-base font-bold text-slate-900 mb-3">
          {t('tableWaterTitle')}
        </h3>
        <NormTable
          caption={t('tableWaterTitle')}
          firstHeader={t('waterSexH')}
          categoryHeaders={categoryHeaders}
          rows={waterNorm.rows!.map((row) => {
            const bounds = waterNorm.multiples.map(
              (m) => Math.round((row.center + m * waterNorm.sigma) * 10) / 10
            );
            return {
              firstCell: t(
                row.id === 'female' ? 'genderFemale' : 'genderMale'
              ),
              cells: literCells(bounds),
              highlight: sex === row.id,
            };
          })}
        />
      </div>

      <SourceCitation sources={waterNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/hydration-peer-comparison.webp"
        alt={t('imageWaterAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainWaterTitle')}
        </h3>
        {t.raw('explainWater').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
