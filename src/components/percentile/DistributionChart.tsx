'use client';

import { useEffect, useRef, useState } from 'react';

interface DistributionChartProps {
  axisMin: number;
  axisMax: number;
  /** Lower bound of every category along the axis (length = categories) */
  thresholds: number[];
  /** Fill color for each category */
  colors: string[];
  userValue: number;
  /** Density (need not be normalized) */
  density: (x: number) => number;
  ariaLabel: string;
  xAxisLabel: string;
  yAxisLabel: string;
  youAreHere: string;
  formatTick: (n: number) => string;
  /** Enable press-and-drag (and keyboard) editing */
  interactive?: boolean;
  /** Called continuously while the ball is dragged or moved by keyboard */
  onChange?: (axisValue: number) => void;
  /** Discrete positions the ball snaps to */
  snapValues?: number[];
  /** Keyboard increment; defaults to 1/40 of the axis span */
  valueStep?: number;
}

const BINS = 32;
const PAD = { top: 40, right: 14, bottom: 52, left: 38 };

/**
 * Pure-SVG bell histogram in the HumanBenchmark percentile style.
 * The marker ball can be pressed and dragged to change the form value
 * directly (also tappable track + keyboard slider). Rendered at measured
 * pixel coordinates so text never drops below 12px.
 */
export default function DistributionChart({
  axisMin,
  axisMax,
  thresholds,
  colors,
  userValue,
  density,
  ariaLabel,
  xAxisLabel,
  yAxisLabel,
  youAreHere,
  formatTick,
  interactive = false,
  onChange,
  snapValues,
  valueStep,
}: DistributionChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.max(204, Math.min(300, Math.round(width * 0.54)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const span = axisMax - axisMin;
  const xScale = (v: number) => PAD.left + ((v - axisMin) / span) * plotW;

  // Bins + densities
  const binW = span / BINS;
  const densities: number[] = [];
  for (let i = 0; i < BINS; i++) {
    const xc = axisMin + (i + 0.5) * binW;
    densities.push(Math.max(0, density(xc)));
  }
  const maxD = Math.max(...densities, 1e-9);

  const categoryAt = (v: number) => {
    let idx = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (v >= thresholds[i]) idx = i;
    }
    return Math.min(idx, colors.length - 1);
  };

  // ── Drag / tap mapping ───────────────────────────────────────────
  const step = valueStep ?? span / 40;

  const snapValue = (v: number) => {
    if (!snapValues || snapValues.length === 0) return v;
    let best = snapValues[0];
    for (const s of snapValues) {
      if (Math.abs(s - v) < Math.abs(best - v)) best = s;
    }
    return best;
  };

  const valueFromClientX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return axisMin;
    const frac = (clientX - rect.left - PAD.left) / plotW;
    return Math.min(axisMax, Math.max(axisMin, axisMin + frac * span));
  };

  const emitFromClientX = (clientX: number) => {
    if (!onChange) return;
    onChange(snapValue(valueFromClientX(clientX)));
  };

  const beginDrag = (clientX: number | null, target: Element, pointerId: number) => {
    (target as Element).setPointerCapture?.(pointerId);
    draggingRef.current = true;
    setDragging(true);
    if (clientX !== null) emitFromClientX(clientX);
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive || !onChange) return;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(axisMin, userValue - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(axisMax, userValue + step);
        break;
      case 'Home':
        next = axisMin;
        break;
      case 'End':
        next = axisMax;
        break;
    }
    if (next !== null) {
      e.preventDefault();
      onChange(snapValue(next));
    }
  };

  // User marker (clamped to axis)
  const clamped = Math.min(axisMax, Math.max(axisMin, userValue));
  const markerX = xScale(clamped);
  const userD = Math.max(0, density(clamped));
  const markerY = PAD.top + plotH - (userD / maxD) * plotH;

  const pillText = dragging ? formatTick(clamped) : youAreHere;
  const pillW = pillText.length * 7.4 + 20;
  const pillX = Math.min(
    PAD.left + plotW - pillW,
    Math.max(PAD.left, markerX - pillW / 2)
  );
  const pillY = 10;

  const ticks = Array.from({ length: 5 }, (_, i) => axisMin + (span * i) / 4);

  const ballHandlers = interactive
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          e.preventDefault();
          beginDrag(null, e.currentTarget, e.pointerId);
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (draggingRef.current) emitFromClientX(e.clientX);
        },
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        onKeyDown,
      }
    : {};

  return (
    <div
      ref={wrapRef}
      className="w-full"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="block"
      >
        <title>{ariaLabel}</title>

        {/* Y gridlines */}
        {[0.5, 1].map((f) => {
          const y = PAD.top + plotH - f * plotH;
          return (
            <g key={f}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 4"
              />
              <text x={6} y={y + 4} fontSize={12} fill="#94a3b8">
                {Math.round(f * 100)}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {densities.map((d, i) => {
          const xc = axisMin + (i + 0.5) * binW;
          const h = (d / maxD) * plotH;
          const x = PAD.left + i * (plotW / BINS) + 0.75;
          const w = plotW / BINS - 1.5;
          return (
            <rect
              key={i}
              x={x}
              y={PAD.top + plotH - h}
              width={w}
              height={h}
              rx={1.5}
              fill={colors[categoryAt(xc)]}
            />
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD.left}
          x2={PAD.left + plotW}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke="#cbd5e1"
        />

        {/* X ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={xScale(t)}
              x2={xScale(t)}
              y1={PAD.top + plotH}
              y2={PAD.top + plotH + 5}
              stroke="#cbd5e1"
            />
            <text
              x={xScale(t)}
              y={PAD.top + plotH + 20}
              fontSize={12}
              fill="#64748b"
              textAnchor="middle"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* X / Y axis captions */}
        <text
          x={PAD.left + plotW / 2}
          y={height - 6}
          fontSize={12}
          fontWeight={600}
          fill="#475569"
          textAnchor="middle"
        >
          {xAxisLabel}
        </text>
        <text
          x={10}
          y={PAD.top - 16}
          fontSize={12}
          fontWeight={600}
          fill="#475569"
        >
          {yAxisLabel}
        </text>

        {/* Interactive track overlay: tap to jump and drag from anywhere */}
        {interactive && (
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            style={{ touchAction: 'none', cursor: 'pointer' }}
            onPointerDown={(e) => beginDrag(e.clientX, e.currentTarget, e.pointerId)}
            onPointerMove={(e) => {
              if (draggingRef.current) emitFromClientX(e.clientX);
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        )}

        {/* User marker */}
        <line
          x1={markerX}
          x2={markerX}
          y1={PAD.top}
          y2={PAD.top + plotH}
          stroke="#15803d"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />

        {/* Ball group: visible dot + ≥44px invisible hit target */}
        <g>
          <circle
            cx={markerX}
            cy={markerY}
            r={interactive ? 22 : 5.5}
            fill="transparent"
            {...ballHandlers}
            style={
              interactive
                ? {
                    touchAction: 'none',
                    cursor: dragging ? 'grabbing' : 'grab',
                    outline: 'none',
                  }
                : undefined
            }
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'slider' : undefined}
            aria-valuenow={Math.round(clamped)}
            aria-valuemin={Math.round(axisMin)}
            aria-valuemax={Math.round(axisMax)}
            aria-valuetext={formatTick(clamped)}
            aria-label={ariaLabel}
          />
          <circle
            cx={markerX}
            cy={markerY}
            r={dragging ? 8 : 6.5}
            fill="#15803d"
            stroke="#fff"
            strokeWidth={2.5}
            pointerEvents="none"
          />
        </g>

        {/* Pill */}
        <g pointerEvents="none">
          <rect x={pillX} y={pillY} width={pillW} height={24} rx={12} fill="#15803d" />
          <text
            x={pillX + pillW / 2}
            y={pillY + 16}
            fontSize={12}
            fontWeight={700}
            fill="#fff"
            textAnchor="middle"
          >
            {pillText}
          </text>
        </g>
      </svg>
    </div>
  );
}
