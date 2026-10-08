'use client';

import { useTranslations } from 'next-intl';
import {
  evaluateFasting,
  fastingNorm,
  methodForFastingHours,
  fastingDensity,
} from '@/lib/norms/percentile';
import type { IFSchedule } from '@/lib/calculators/if-timer';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface FastingPercentileProps {
  result: IFSchedule | null;
  onPatch: (patch: Record<string, string>) => void;
}

/**
 * "You vs Your Peers" for the fasting duration — a categorical metric.
 * The ball snaps to the five published methods; dragging selects a method.
 * The methods table always renders.
 */
export default function FastingPercentile({
  result,
  onPatch,
}: FastingPercentileProps) {
  const t = useTranslations('percentile');

  const active = result !== null;
  const hours = result ? result.fastingHours : fastingNorm.snapValues[1];

  const ev = active ? evaluateFasting(hours) : null;

  const categoryHeaders = fastingNorm.categories.map((c) => t(`fast_${c}`));
  const levelLabel = ev ? t(`fast_${fastingNorm.categories[ev.categoryIndex]}`) : '';

  const handleChange = (v: number) => {
    onPatch({ method: methodForFastingHours(v) });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('title')}</h2>

      {active && ev && result && (
        <>
          <PercentileBadge
            text={t('badgeFasting', { pct: ev.percentile, level: levelLabel })}
          />
          <p className="mt-3 text-sm text-slate-600">
            {result.method} · {levelLabel}
          </p>

          <DistributionChart
            axisMin={fastingNorm.axis.min}
            axisMax={fastingNorm.axis.max}
            thresholds={fastingNorm.snapValues}
            colors={['#84cc16', '#22c55e', '#65a30d', '#16a34a', '#7c3aed']}
            userValue={hours}
            density={fastingDensity}
            ariaLabel={t('ariaFasting', {
              hours,
              category: levelLabel,
              pct: ev.percentile,
            })}
            xAxisLabel={t('axisFasting')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={(n) => String(Math.round(n))}
            interactive
            onChange={handleChange}
            snapValues={fastingNorm.snapValues}
            valueStep={1}
          />
          <DragHint text={t('dragHintFasting')} />
        </>
      )}

      <div className={active ? 'mt-8' : 'mt-2'}>
        <h3 className="text-base font-bold text-slate-900 mb-3">
          {t('tableFastingTitle')}
        </h3>
        <NormTable
          caption={t('tableFastingTitle')}
          firstHeader={t('fastMethodH')}
          categoryHeaders={[
            t('fastHoursH'),
            t('eatHoursH'),
            t('levelH'),
          ]}
          rows={Object.entries(fastingNorm.methods).map(([method, info]) => ({
            firstCell: t(`methodName_${method.replace(':', '_')}`),
            cells: [
              `${info.hours} h`,
              `${24 - info.hours} h`,
              t(`fast_${fastingNorm.categories[info.categoryIndex]}`),
            ],
            highlight: result?.method === method,
          }))}
        />
      </div>

      <SourceCitation sources={fastingNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/fasting-method-comparison.webp"
        alt={t('imageFastingAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainFastingTitle')}
        </h3>
        {t.raw('explainFasting').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
