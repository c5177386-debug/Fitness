'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  evaluateRunning,
  runningNorm,
  finishTimeForPace,
  normalPdf,
  type Gender,
} from '@/lib/norms/percentile';
import type { PaceResult } from '@/lib/calculators/running-pace';
import DistributionChart from './DistributionChart';
import PercentileBadge from './PercentileBadge';
import SourceCitation from './SourceCitation';
import Image from 'next/image';
import NormTable from './NormTable';
import DragHint from './DragHint';

interface RunningPercentileProps {
  distanceKm: number | null;
  result: PaceResult | null;
  onPatch: (patch: Record<string, string>) => void;
}

function fmtPaceSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function paceCells(bounds: number[]): string[] {
  return bounds.map((b, i) => {
    if (i === 0) return `≤ ${fmtPaceSec(bounds[i + 1] - 1)}`;
    if (i === bounds.length - 1) return `≥ ${fmtPaceSec(b)}`;
    return `${fmtPaceSec(b)}–${fmtPaceSec(bounds[i + 1] - 1)}`;
  });
}

/**
 * "You vs Your Peers" for running pace (inverted metric: lower pace =
 * better). Sex chosen inside the module. Drag adjusts the finish time,
 * pace follows. Tables always render.
 */
export default function RunningPercentile({
  distanceKm,
  result,
  onPatch,
}: RunningPercentileProps) {
  const t = useTranslations('percentile');

  const [sex, setSex] = useState<'' | Gender>('');

  const paceSec = result ? result.paceSecPerKm : 0;
  const active = result !== null && sex !== '' && distanceKm !== null;

  const ev = active && sex ? evaluateRunning(sex, paceSec) : null;
  const categoryHeaders = runningNorm.categories.map((c) => t(`run_${c}`));
  const sexLabel = sex ? t(sex === 'female' ? 'genderFemale' : 'genderMale') : '';

  const handleChange = (targetPace: number) => {
    if (distanceKm === null) return;
    const time = finishTimeForPace(distanceKm, targetPace);
    onPatch({
      hours: String(time.hours),
      minutes: String(time.minutes),
      seconds: String(time.seconds),
    });
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
            text={t('badgeRunning', { pct: ev.percentile, gender: sexLabel })}
          />
          <p className="mt-3 text-sm text-slate-600">
            {t(`run_${runningNorm.categories[ev.categoryIndex]}`)}
          </p>

          <DistributionChart
            axisMin={runningNorm.axis.min}
            axisMax={runningNorm.axis.max}
            thresholds={ev.thresholds}
            colors={['#7c3aed', '#16a34a', '#65a30d', '#f59e0b', '#94a3b8']}
            userValue={paceSec}
            density={(x) =>
              normalPdf(
                x,
                runningNorm.density[sex].center,
                runningNorm.density[sex].sigma
              )
            }
            ariaLabel={t('ariaRunning', {
              gender: sexLabel,
              value: fmtPaceSec(paceSec),
              category: t(`run_${runningNorm.categories[ev.categoryIndex]}`),
              pct: ev.percentile,
            })}
            xAxisLabel={t('axisRunning')}
            yAxisLabel={t('chartY')}
            youAreHere={t('youAreHere')}
            formatTick={fmtPaceSec}
            interactive
            onChange={handleChange}
            snapValues={undefined}
          />
          <DragHint text={t('dragHintRunning')} />
        </>
      )}

      <div className={active ? 'mt-8' : 'mt-2'}>
        <h3 className="text-base font-bold text-slate-900 mb-3">
          {t('tableRunningTitle')}
        </h3>
        <NormTable
          caption={t('tableRunningTitle')}
          firstHeader={t('waterSexH')}
          categoryHeaders={categoryHeaders}
          rows={(['female', 'male'] as Gender[]).map((g) => ({
            firstCell: t(g === 'female' ? 'genderFemale' : 'genderMale'),
            cells: paceCells(runningNorm.thresholds[g]),
            highlight: sex === g,
          }))}
        />
      </div>

      <SourceCitation sources={runningNorm.sources} label={t('sourceLabel')} />

      <Image
        src="/images/content/running-pace-comparison.webp"
        alt={t('imageRunningAlt')}
        width={1200}
        height={675}
        loading="lazy"
        className="mt-8 w-full rounded-2xl shadow-md"
      />

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {t('explainRunningTitle')}
        </h3>
        {t.raw('explainRunning').map((p: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
