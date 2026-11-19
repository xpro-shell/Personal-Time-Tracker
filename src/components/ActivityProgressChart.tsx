import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import React from 'react';
import {
  ActivityFilterId,
  formatHoursDecimal,
  formatMinutesHm,
  formatSignedMinutesHm,
  ProgressBucket,
  ProgressSeriesResult,
  ProgressTemplateId,
  ProgressTimeframe,
} from '../lib/progressAnalytics';

interface ActivityProgressChartProps {
  series: ProgressSeriesResult;
  timeframe: ProgressTimeframe;
  template: ProgressTemplateId;
  selectedBucketKey: string | null;
  onSelectBucket: (bucket: ProgressBucket) => void;
  onSelectActivity?: (activityId: ActivityFilterId) => void;
  onChangeTimeframe?: (tf: ProgressTimeframe) => void;
  compact?: boolean;
}

export const PROGRESS_TEMPLATES: Array<{
  id: ProgressTemplateId;
  name: string;
  tagline: string;
}> = [
  {
    id: 'clean-bars',
    name: 'Minimal Bars',
    tagline: 'Simple & accurate bars with goal line & yesterday delta',
  },
  {
    id: 'growth-cards',
    name: 'Growth Cards',
    tagline: 'Premium cards showing % completion & growth vs yesterday',
  },
  {
    id: 'studio-matrix',
    name: 'Studio Matrix',
    tagline: 'Activity KPIs, colored matrix grid, detailed bars & insights',
  },
  {
    id: 'smooth-wave',
    name: 'Next-Gen Wave',
    tagline: 'Smooth gradient area curve & interactive trend nodes',
  },
  {
    id: 'rings-grid',
    name: 'Activity Rings',
    tagline: 'Circular completion gauges & period growth deltas',
  },
  {
    id: 'pulse-blocks',
    name: 'Pulse Grid',
    tagline: 'Sleek proportional progress rows with growth arrows',
  },
];

function formatBucketValue(minutes: number, timeframe: ProgressTimeframe): string {
  if (minutes <= 0) return '0m';
  if (timeframe === 'hours') return `${minutes}m`;
  if (minutes < 60) return `${minutes}m`;
  return formatHoursDecimal(minutes);
}

const GrowthDeltaInline: React.FC<{
  direction: 'up' | 'down' | 'flat';
  pctChange: number;
  accentHex?: string;
  diffMinutes?: number;
  showMinutes?: boolean;
}> = ({ direction, pctChange, accentHex, diffMinutes, showMinutes = false }) => {
  const absPct = Math.abs(pctChange);
  if (direction === 'up') {
    return (
      <span
        className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums"
        style={{ color: accentHex || '#34d399' }}
      >
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        <span>+{absPct}%</span>
        {showMinutes && typeof diffMinutes === 'number' && (
          <span className="text-[11px] opacity-80 ml-0.5">
            ({formatSignedMinutesHm(diffMinutes)})
          </span>
        )}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums text-rose-400">
        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
        <span>-{absPct}%</span>
        {showMinutes && typeof diffMinutes === 'number' && (
          <span className="text-[11px] opacity-80 ml-0.5">
            ({formatSignedMinutesHm(diffMinutes)})
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums text-zinc-500">
      <Minus className="w-3 h-3 shrink-0" />
      <span>0%</span>
    </span>
  );
};

export const ActivityProgressChart: React.FC<ActivityProgressChartProps> = ({
  series,
  timeframe,
  template,
  selectedBucketKey,
  onSelectBucket,
  onSelectActivity,
  onChangeTimeframe,
  compact = false,
}) => {
  const { activity, buckets, maxBucketMinutes, yesterdayComparison, activityCards, activityMatrix } =
    series;
  const targetRefMins = buckets[0]?.targetMinutes || 60;
  const chartCeilingMins = Math.max(
    targetRefMins,
    maxBucketMinutes,
    timeframe === 'hours' ? 60 : 60
  );

  // Selected or hovered preview
  const activeBucket =
    buckets.find((b) => b.key === selectedBucketKey) ||
    buckets.find((b) => b.isCurrent) ||
    buckets[buckets.length - 1];

  // Smooth SVG Bezier path helper for Wave template
  const waveData = React.useMemo(() => {
    const W = 720;
    const H = 200;
    const padX = 22;
    const padY = 24;
    const usableW = W - padX * 2;
    const usableH = H - padY * 2;

    const pts = buckets.map((b, i) => {
      const x =
        buckets.length <= 1 ? W / 2 : padX + (i / (buckets.length - 1)) * usableW;
      const ratio = Math.min(1, b.minutes / chartCeilingMins);
      const y = padY + (1 - ratio) * usableH;
      return { x, y, bucket: b };
    });

    if (pts.length === 0) {
      return { linePath: '', areaPath: '', pts, targetY: H - padY, W, H, padY };
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const baseBottom = H - padY;
    const areaPath = `${d} L ${pts[pts.length - 1].x} ${baseBottom} L ${pts[0].x} ${baseBottom} Z`;
    const targetRatio = Math.min(1, targetRefMins / chartCeilingMins);
    const targetY = padY + (1 - targetRatio) * usableH;

    return { linePath: d, areaPath, pts, targetY, W, H, padY };
  }, [buckets, chartCeilingMins, targetRefMins]);

  if (buckets.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-400">
        No timeframe buckets available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shared Premium Context + Yesterday Growth / Degrowth Strip across ALL Graphs */}
      {activeBucket && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0c0e13] border border-zinc-800/85 text-xs shadow-inner shadow-black/30">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: activity.colorHex,
                boxShadow: `0 0 8px ${activity.colorHex}80`,
              }}
            />
            <span className="font-semibold text-white truncate">{activeBucket.subLabel}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span className="font-mono font-bold tabular-nums" style={{ color: activity.colorHex }}>
              {formatMinutesHm(activeBucket.minutes)}
            </span>
            {activeBucket.targetMinutes > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="font-mono text-zinc-400 tabular-nums">
                  {activeBucket.pctOfTarget}% of {formatMinutesHm(activeBucket.targetMinutes)}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Step-to-step or Yesterday Growth / Degrowth */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-zinc-500">vs Yesterday:</span>
              <GrowthDeltaInline
                direction={yesterdayComparison.direction}
                pctChange={yesterdayComparison.pctChange}
                diffMinutes={yesterdayComparison.diffMinutes}
                accentHex={yesterdayComparison.direction === 'up' ? '#34d399' : undefined}
                showMinutes
              />
            </div>

            {activity.id === 'all' && activeBucket.minutes > 0 && (
              <div className="hidden sm:flex flex-wrap items-center gap-2.5 text-[11px] font-mono tabular-nums text-zinc-300 border-l border-zinc-800 pl-3">
                {activeBucket.breakdown.study > 0 && (
                  <span className="text-emerald-300">Study {formatMinutesHm(activeBucket.breakdown.study)}</span>
                )}
                {activeBucket.breakdown.sleep > 0 && (
                  <span className="text-indigo-300">Sleep {formatMinutesHm(activeBucket.breakdown.sleep)}</span>
                )}
                {activeBucket.breakdown.habit > 0 && (
                  <span className="text-purple-300">Habits {formatMinutesHm(activeBucket.breakdown.habit)}</span>
                )}
                {activeBucket.breakdown.life > 0 && (
                  <span className="text-pink-300">Life {formatMinutesHm(activeBucket.breakdown.life)}</span>
                )}
                {activeBucket.breakdown.break > 0 && (
                  <span className="text-amber-300">Break {formatMinutesHm(activeBucket.breakdown.break)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATE 1: MINIMAL BARS (Default — Simple, Readable, Accurate + Mixed Premium Polish) */}
      {template === 'clean-bars' && (
        <div
          className={`relative rounded-xl bg-[#0c0e13] border border-zinc-800/90 p-4 ${
            compact ? 'pt-6' : 'pt-7'
          }`}
        >
          {/* Target reference line */}
          {chartCeilingMins > 0 && (
            <div
              className="pointer-events-none absolute left-4 right-4 border-t border-dashed border-zinc-700/80 z-0 flex justify-end"
              style={{
                bottom: `${
                  36 +
                  Math.min(
                    1,
                    targetRefMins / chartCeilingMins
                  ) *
                    (compact ? 140 : 185)
                }px`,
              }}
            >
              <span className="text-[10px] font-mono text-zinc-400 bg-[#0c0e13] px-1.5 -mt-2.5 rounded">
                Goal {formatMinutesHm(targetRefMins)}
              </span>
            </div>
          )}

          <div
            className={`relative z-10 grid items-end gap-1 sm:gap-2 ${
              compact ? 'h-[156px]' : 'h-[205px]'
            }`}
            style={{
              gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
            }}
          >
            {buckets.map((bucket) => {
              const heightPct =
                bucket.minutes > 0
                  ? Math.max(6, Math.round((bucket.minutes / chartCeilingMins) * 100))
                  : 3;
              const isSelected = activeBucket?.key === bucket.key;
              const isAll = activity.id === 'all' && bucket.minutes > 0;
              const total = Math.max(1, bucket.minutes);

              return (
                <button
                  key={bucket.key}
                  type="button"
                  onClick={() => onSelectBucket(bucket)}
                  onMouseEnter={() => onSelectBucket(bucket)}
                  className="group h-full flex flex-col justify-end items-center gap-1.5 cursor-pointer focus:outline-none"
                  title={`${bucket.subLabel}: ${formatMinutesHm(bucket.minutes)} (${bucket.pctOfTarget}%)`}
                >
                  {/* Value label above bar */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono tabular-nums transition-opacity leading-none ${
                      bucket.minutes === 0
                        ? 'opacity-0'
                        : isSelected || buckets.length <= 12
                        ? 'opacity-100 text-zinc-200 font-semibold'
                        : 'opacity-0 group-hover:opacity-100 text-zinc-200 font-semibold'
                    }`}
                  >
                    {formatBucketValue(bucket.minutes, timeframe)}
                  </span>

                  {/* Bar track & glossy gradient fill */}
                  <div
                    className={`w-full max-w-[34px] rounded-t-md transition-all duration-200 overflow-hidden flex flex-col-reverse relative ${
                      bucket.minutes === 0
                        ? 'bg-zinc-900/75 border border-zinc-800/70'
                        : isSelected
                        ? 'ring-2 ring-white/80'
                        : 'opacity-90 group-hover:opacity-100 group-hover:brightness-110'
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      background:
                        bucket.minutes > 0 && !isAll
                          ? `linear-gradient(180deg, ${activity.colorHex}, ${activity.colorHex}aa)`
                          : undefined,
                      boxShadow:
                        bucket.minutes > 0 && isSelected
                          ? `0 0 18px -2px ${activity.colorHex}80`
                          : undefined,
                    }}
                  >
                    {isAll && (
                      <>
                        {bucket.breakdown.study > 0 && (
                          <div
                            style={{
                              height: `${(bucket.breakdown.study / total) * 100}%`,
                              backgroundColor: '#34d399',
                            }}
                          />
                        )}
                        {bucket.breakdown.sleep > 0 && (
                          <div
                            style={{
                              height: `${(bucket.breakdown.sleep / total) * 100}%`,
                              backgroundColor: '#818cf8',
                            }}
                          />
                        )}
                        {bucket.breakdown.habit > 0 && (
                          <div
                            style={{
                              height: `${(bucket.breakdown.habit / total) * 100}%`,
                              backgroundColor: '#c084fc',
                            }}
                          />
                        )}
                        {bucket.breakdown.life > 0 && (
                          <div
                            style={{
                              height: `${(bucket.breakdown.life / total) * 100}%`,
                              backgroundColor: '#f472b6',
                            }}
                          />
                        )}
                        {bucket.breakdown.break > 0 && (
                          <div
                            style={{
                              height: `${(bucket.breakdown.break / total) * 100}%`,
                              backgroundColor: '#fbbf24',
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* X-axis label */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono tabular-nums leading-none truncate max-w-full ${
                      isSelected
                        ? 'text-white font-bold'
                        : bucket.isCurrent
                        ? 'text-emerald-300 font-semibold'
                        : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    {timeframe === 'hours' && buckets.length === 24
                      ? Number(bucket.label) % 2 === 0 || isSelected
                        ? bucket.label
                        : '·'
                      : bucket.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATE 2: GROWTH CARDS (Exact Sleek Card Design + Yesterday Growth / Degrowth) */}
      {template === 'growth-cards' && (
        <div className="space-y-3">
          {activity.id === 'all' && activityCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activityCards.map((card, idx) => {
                const useStriped = idx % 3 === 2;
                const showGlowKnob = card.pct >= 65 || idx % 4 === 3;
                return (
                  <button
                    key={card.activity.id}
                    type="button"
                    onClick={() => onSelectActivity?.(card.activity.id)}
                    className="group text-left p-4 sm:p-5 rounded-2xl bg-[#0c0e13] border border-zinc-800/85 hover:border-zinc-600/90 transition-all duration-200 space-y-3 cursor-pointer shadow-[0_8px_24px_-16px_rgba(0,0,0,0.85)]"
                  >
                    {/* Row 1: Dot + Name | Bold % + Growth/Degrowth vs Yesterday */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: card.activity.colorHex,
                            boxShadow: `0 0 10px ${card.activity.colorHex}75`,
                          }}
                        />
                        <span className="text-sm sm:text-base font-medium text-zinc-100 group-hover:text-white truncate">
                          {card.activity.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
                          {card.pct}%
                        </span>
                        <GrowthDeltaInline
                          direction={card.direction}
                          pctChange={card.pctChange}
                          accentHex={card.activity.colorHex}
                        />
                      </div>
                    </div>

                    {/* Row 2: Premium Gradient Rounded Progress Bar */}
                    <div className="relative w-full h-2.5 rounded-full bg-zinc-900/95 border border-zinc-800/70 overflow-visible">
                      <div
                        className={`h-full rounded-full relative transition-all duration-500 ${
                          useStriped ? 'progress-stripe-overlay' : ''
                        }`}
                        style={{
                          width: `${card.pct > 0 ? Math.max(4, card.pct) : 0}%`,
                          backgroundColor: card.activity.colorHex,
                          backgroundImage: useStriped
                            ? undefined
                            : `linear-gradient(90deg, ${card.activity.colorHex}bb, ${card.activity.colorHex})`,
                          boxShadow:
                            card.pct > 0 ? `0 0 14px -2px ${card.activity.colorHex}70` : undefined,
                        }}
                      >
                        {showGlowKnob && card.pct > 6 && (
                          <span
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white"
                            style={{ boxShadow: `0 0 10px #ffffff, 0 0 14px ${card.activity.colorHex}` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Row 3: Logged vs Target + Yesterday Diff */}
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-zinc-400">
                      <span>
                        {timeframe === 'hours'
                          ? `${formatMinutesHm(card.currentMinutes)} / ${formatMinutesHm(card.targetMinutes)}`
                          : `${card.daysHit} / ${card.totalDays} days`}
                      </span>
                      <span className="text-zinc-500">
                        {card.diffMinutes === 0
                          ? `Same as yesterday (${formatMinutesHm(card.previousMinutes)})`
                          : `${formatSignedMinutesHm(card.diffMinutes)} vs yesterday`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Single-Activity Growth Cards: Today vs Yesterday Hero + Period Breakdown Cards */
            <div className="space-y-3.5">
              {/* Featured Yesterday Comparison Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0e13] border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: activity.colorHex,
                        boxShadow: `0 0 10px ${activity.colorHex}80`,
                      }}
                    />
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {activity.label} · Today vs Yesterday
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
                      {Math.min(
                        100,
                        Math.round(
                          (yesterdayComparison.currentMinutes /
                            Math.max(1, activity.dailyTargetMinutes)) *
                            100
                        )
                      )}
                      %
                    </span>
                    <GrowthDeltaInline
                      direction={yesterdayComparison.direction}
                      pctChange={yesterdayComparison.pctChange}
                      accentHex={activity.colorHex}
                      diffMinutes={yesterdayComparison.diffMinutes}
                      showMinutes
                    />
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800/70 overflow-hidden">
                  <div
                    className="h-full rounded-full relative transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (yesterdayComparison.currentMinutes /
                            Math.max(1, activity.dailyTargetMinutes)) *
                            100
                        )
                      )}%`,
                      background: `linear-gradient(90deg, ${activity.colorHex}aa, ${activity.colorHex})`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400">
                  <span>
                    Selected Day: {formatMinutesHm(yesterdayComparison.currentMinutes)} /{' '}
                    {formatMinutesHm(activity.dailyTargetMinutes)} target
                  </span>
                  <span>Yesterday: {formatMinutesHm(yesterdayComparison.previousMinutes)}</span>
                </div>
              </div>

              {/* Period-by-Period Sleek Progress Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {buckets
                  .filter((b) => timeframe !== 'hours' || b.minutes > 0 || b.isCurrent)
                  .map((bucket) => {
                    const isSelected = activeBucket?.key === bucket.key;
                    return (
                      <button
                        key={bucket.key}
                        type="button"
                        onClick={() => onSelectBucket(bucket)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 space-y-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#12151d] border-zinc-600'
                            : 'bg-[#0c0e13] border-zinc-800/85 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: activity.colorHex }}
                            />
                            <span className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                              {bucket.subLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-bold font-mono text-white tabular-nums">
                              {bucket.pctOfTarget}%
                            </span>
                            {bucket.vsPrevDirection && bucket.vsPrevPct !== null && (
                              <GrowthDeltaInline
                                direction={bucket.vsPrevDirection}
                                pctChange={bucket.vsPrevPct}
                                accentHex={activity.colorHex}
                              />
                            )}
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800/70 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${bucket.minutes > 0 ? Math.max(4, bucket.pctOfTarget) : 0}%`,
                              background: `linear-gradient(90deg, ${activity.colorHex}bb, ${activity.colorHex})`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400">
                          <span>
                            {formatMinutesHm(bucket.minutes)} / {formatMinutesHm(bucket.targetMinutes)}
                          </span>
                          {bucket.vsPrevDiffMins !== null && (
                            <span className="text-zinc-500">
                              {formatSignedMinutesHm(bucket.vsPrevDiffMins)} vs prev
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATE 3: NEXT-GEN WAVE (Smooth Area Curve) */}
      {template === 'smooth-wave' && (
        <div className="rounded-xl bg-[#0c0e13] border border-zinc-800/90 p-4 space-y-2">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${waveData.W} ${waveData.H}`}
              className={`w-full ${compact ? 'h-44' : 'h-56'} overflow-visible`}
              role="img"
              aria-label={`${activity.label} trend graph`}
            >
              <defs>
                <linearGradient id={`waveFill-${activity.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activity.colorHex} stopOpacity="0.48" />
                  <stop offset="100%" stopColor={activity.colorHex} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((step) => {
                const y = waveData.padY + step * (waveData.H - waveData.padY * 2);
                return (
                  <line
                    key={step}
                    x1={16}
                    x2={waveData.W - 16}
                    y1={y}
                    y2={y}
                    stroke="#27272a"
                    strokeWidth="1"
                  />
                );
              })}

              <line
                x1={16}
                x2={waveData.W - 16}
                y1={waveData.targetY}
                y2={waveData.targetY}
                stroke={activity.colorHex}
                strokeOpacity="0.45"
                strokeDasharray="5 5"
                strokeWidth="1.5"
              />

              {waveData.areaPath && (
                <path
                  d={waveData.areaPath}
                  fill={`url(#waveFill-${activity.id})`}
                />
              )}

              {waveData.linePath && (
                <path
                  d={waveData.linePath}
                  fill="none"
                  stroke={activity.colorHex}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {waveData.pts.map(({ x, y, bucket }) => {
                const isSelected = activeBucket?.key === bucket.key;
                return (
                  <g
                    key={bucket.key}
                    className="cursor-pointer"
                    onClick={() => onSelectBucket(bucket)}
                    onMouseEnter={() => onSelectBucket(bucket)}
                  >
                    <circle cx={x} cy={y} r={14} fill="transparent" />
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : bucket.minutes > 0 ? 4 : 2.5}
                      fill={bucket.minutes > 0 ? activity.colorHex : '#3f3f46'}
                      stroke={isSelected ? '#ffffff' : '#09090b'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="grid gap-1 text-center"
            style={{
              gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
            }}
          >
            {buckets.map((bucket) => {
              const isSelected = activeBucket?.key === bucket.key;
              return (
                <button
                  key={bucket.key}
                  type="button"
                  onClick={() => onSelectBucket(bucket)}
                  className={`text-[9px] sm:text-[10px] font-mono tabular-nums cursor-pointer truncate ${
                    isSelected ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {timeframe === 'hours' && buckets.length === 24
                    ? Number(bucket.label) % 2 === 0 || isSelected
                      ? bucket.label
                      : ''
                    : bucket.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATE 4: ACTIVITY RINGS GRID (With Growth Delta) */}
      {template === 'rings-grid' && (
        <div className="rounded-xl bg-[#0c0e13] border border-zinc-800/90 p-4">
          <div
            className={`grid gap-2.5 ${
              buckets.length >= 16
                ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'
                : buckets.length >= 8
                ? 'grid-cols-4 sm:grid-cols-6'
                : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7'
            }`}
          >
            {buckets.map((bucket) => {
              const radius = 19;
              const circ = 2 * Math.PI * radius;
              const pct = Math.min(100, bucket.pctOfTarget);
              const dashOffset = circ - (pct / 100) * circ;
              const isSelected = activeBucket?.key === bucket.key;

              return (
                <button
                  key={bucket.key}
                  type="button"
                  onClick={() => onSelectBucket(bucket)}
                  onMouseEnter={() => onSelectBucket(bucket)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900/90 border-zinc-500'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                  title={`${bucket.subLabel}: ${formatMinutesHm(bucket.minutes)} (${pct}%)`}
                >
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="#27272a"
                        strokeWidth="4.5"
                        fill="transparent"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={bucket.minutes > 0 ? activity.colorHex : '#3f3f46'}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={dashOffset}
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-white tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-mono font-semibold text-zinc-200 leading-tight">
                      {bucket.label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 tabular-nums">
                      {formatBucketValue(bucket.minutes, timeframe)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATE 5: PULSE BLOCKS & HORIZONTAL PROGRESS (Mixed Growth Card Styling) */}
      {template === 'pulse-blocks' && (
        <div className="rounded-xl bg-[#0c0e13] border border-zinc-800/90 p-4 space-y-2.5 max-h-[290px] overflow-y-auto pr-2">
          {buckets.map((bucket) => {
            const pct = Math.min(
              100,
              Math.round((bucket.minutes / Math.max(1, targetRefMins)) * 100)
            );
            const isSelected = activeBucket?.key === bucket.key;
            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => onSelectBucket(bucket)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900/90 border-zinc-600'
                    : 'bg-zinc-950/60 border-zinc-800/75 hover:border-zinc-700'
                }`}
              >
                <div className="w-16 sm:w-20 shrink-0">
                  <div className="text-xs font-mono font-semibold text-zinc-100">
                    {bucket.label}
                  </div>
                  <div className="text-[10px] font-sans text-zinc-500 truncate">
                    {bucket.subLabel}
                  </div>
                </div>
                <div className="flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${bucket.minutes > 0 ? Math.max(3, pct) : 0}%`,
                      background: `linear-gradient(90deg, ${activity.colorHex}aa, ${activity.colorHex})`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs tabular-nums">
                  {bucket.vsPrevDirection && bucket.vsPrevPct !== null && (
                    <GrowthDeltaInline
                      direction={bucket.vsPrevDirection}
                      pctChange={bucket.vsPrevPct}
                      accentHex={activity.colorHex}
                    />
                  )}
                  <span className={bucket.minutes > 0 ? 'text-white font-semibold w-12 text-right' : 'text-zinc-600 w-12 text-right'}>
                    {formatMinutesHm(bucket.minutes)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TEMPLATE 6: STUDIO MATRIX (Overview Cards + Colored Activity Matrix + Detailed Bars + Insights) */}
      {template === 'studio-matrix' && (
        <div className="space-y-4">
          {/* 1. Top Activity Summary Cards */}
          {activityCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {activityCards.map((card) => {
                const isSelectedAct = activity.id === card.activity.id;
                return (
                  <button
                    key={card.activity.id}
                    type="button"
                    onClick={() =>
                      onSelectActivity?.(
                        isSelectedAct ? 'all' : card.activity.id
                      )
                    }
                    className={`group text-left p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelectedAct
                        ? 'bg-[#12161f] border-zinc-500 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.9)]'
                        : 'bg-[#0c0e13] border-zinc-800/85 hover:border-zinc-700'
                    }`}
                    title={`Click to focus ${card.activity.label}`}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: card.activity.colorHex,
                            boxShadow: `0 0 8px ${card.activity.colorHex}75`,
                          }}
                        />
                        <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                          {card.activity.label}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 shrink-0 transition-colors" />
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xl font-bold font-mono text-white tabular-nums">
                        {card.pct}%
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 tabular-nums text-right">
                        {timeframe === 'hours'
                          ? `${formatMinutesHm(card.currentMinutes)}`
                          : `${card.daysHit} / ${card.totalDays} days`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${card.pct > 0 ? Math.max(5, card.pct) : 0}%`,
                          background: `linear-gradient(90deg, ${card.activity.colorHex}bb, ${card.activity.colorHex})`,
                          boxShadow:
                            card.pct > 0 ? `0 0 10px ${card.activity.colorHex}66` : undefined,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Middle Activity Consistency Matrix */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0e13] border border-zinc-800/90 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-zinc-300" />
                <span className="text-sm font-semibold text-white">Activity Matrix</span>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="text-xs font-mono text-zinc-400">
                  {activityMatrix.scopeLabel}
                </span>
              </div>

              {onChangeTimeframe && (
                <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px]">
                  {(
                    [
                      { id: 'hours', label: '24h' },
                      { id: 'week', label: 'Week' },
                      { id: 'months', label: 'Month' },
                      { id: 'years', label: 'Year' },
                    ] as const
                  ).map((opt) => {
                    const isActive = timeframe === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeTimeframe(opt.id)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-none pb-1">
              <div className="min-w-[620px] space-y-2">
                {/* Column Header Row */}
                <div className="flex items-center gap-3">
                  <div className="w-36 sm:w-44 shrink-0" />
                  <div
                    className="flex-1 grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${activityMatrix.columns.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {activityMatrix.columns.map((col, idx) => (
                      <div
                        key={col.key}
                        className={`text-center text-[10px] font-mono tabular-nums ${
                          col.isCurrent ? 'text-white font-bold' : 'text-zinc-500'
                        }`}
                        title={col.subLabel}
                      >
                        {activityMatrix.columns.length >= 24 && timeframe === 'hours'
                          ? idx % 2 === 0
                            ? col.label
                            : ''
                          : col.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Rows */}
                {activityMatrix.rows.map((row) => {
                  const isFocused = activity.id === row.activity.id;
                  const dimmed = activity.id !== 'all' && !isFocused;
                  return (
                    <div
                      key={row.activity.id}
                      className={`flex items-center gap-3 transition-opacity duration-150 ${
                        dimmed ? 'opacity-45 hover:opacity-90' : 'opacity-100'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSelectActivity?.(isFocused ? 'all' : row.activity.id)
                        }
                        className="w-36 sm:w-44 shrink-0 flex items-center gap-2 text-left cursor-pointer group min-w-0"
                        title={`Filter to ${row.activity.label} (${formatMinutesHm(row.totalMinutes)})`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.activity.colorHex }}
                        />
                        <span
                          className={`text-xs truncate transition-colors ${
                            isFocused
                              ? 'text-white font-semibold'
                              : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {row.activity.label}
                        </span>
                      </button>

                      <div
                        className="flex-1 grid gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${activityMatrix.columns.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {row.cells.map((cell, cIdx) => {
                          const colMeta = activityMatrix.columns[cIdx];
                          const bgStyle =
                            cell.intensity === 0
                              ? '#16181f'
                              : cell.intensity === 1
                              ? `${row.activity.colorHex}33`
                              : cell.intensity === 2
                              ? `${row.activity.colorHex}66`
                              : cell.intensity === 3
                              ? `${row.activity.colorHex}b3`
                              : row.activity.colorHex;
                          return (
                            <div
                              key={cell.key}
                              className={`h-5 sm:h-6 rounded-[5px] border transition-transform duration-150 hover:scale-110 ${
                                colMeta?.isCurrent
                                  ? 'border-zinc-500/70'
                                  : 'border-zinc-800/60'
                              }`}
                              style={{
                                backgroundColor: bgStyle,
                                boxShadow:
                                  cell.intensity >= 3
                                    ? `0 0 10px -3px ${row.activity.colorHex}80`
                                    : undefined,
                              }}
                              title={`${row.activity.label} · ${colMeta?.subLabel || colMeta?.label}: ${formatMinutesHm(cell.minutes)} (${cell.pct}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Bottom Split: Detailed Progress Bars + Live Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Detailed Progress */}
            <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#0c0e13] border border-zinc-800/90 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-zinc-300" />
                  <span className="text-sm font-semibold text-white">Detailed Progress</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {timeframe === 'hours' ? 'Today vs target' : 'Consistency & volume'}
                </span>
              </div>

              <div className="space-y-3">
                {activityCards.map((card) => {
                  const isFocused = activity.id === card.activity.id;
                  return (
                    <button
                      key={card.activity.id}
                      type="button"
                      onClick={() =>
                        onSelectActivity?.(isFocused ? 'all' : card.activity.id)
                      }
                      className="w-full flex items-center gap-3 text-left group cursor-pointer"
                      title={`${card.activity.label}: ${formatMinutesHm(card.currentMinutes)} logged`}
                    >
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: card.activity.colorHex }}
                        />
                        <span
                          className={`text-xs truncate transition-colors ${
                            isFocused
                              ? 'text-white font-semibold'
                              : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {card.activity.label}
                        </span>
                      </div>

                      <div className="flex-1 h-2.5 rounded-full bg-zinc-900/95 border border-zinc-800/70 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${card.pct > 0 ? Math.max(3, card.pct) : 0}%`,
                            background: `linear-gradient(90deg, ${card.activity.colorHex}bb, ${card.activity.colorHex})`,
                          }}
                        />
                      </div>

                      <span className="w-11 text-right font-mono text-xs font-bold text-white tabular-nums shrink-0">
                        {card.pct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Insights & Top Activity */}
            {(() => {
              const sortedByPerf = [...activityCards].sort((a, b) => {
                if (b.pct !== a.pct) return b.pct - a.pct;
                return b.currentMinutes - a.currentMinutes;
              });
              const topCard = sortedByPerf.find((c) => c.currentMinutes > 0) || sortedByPerf[0];
              const cmp = activityMatrix.periodComparison;
              const absCmp = Math.abs(cmp.pctChange);

              return (
                <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#0c0e13] border border-zinc-800/90 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-zinc-300" />
                      <span className="text-sm font-semibold text-white">Insights</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                        {cmp.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : cmp.direction === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-white">
                          {cmp.direction === 'up'
                            ? "You're on track!"
                            : cmp.direction === 'down'
                            ? 'Pace dipped slightly'
                            : 'Steady consistency'}
                        </div>
                        <p className="text-zinc-400 font-sans leading-relaxed">
                          {cmp.direction === 'flat' ? (
                            <>
                              Your activity matches{' '}
                              <span className="text-zinc-200 font-medium">{cmp.label}</span>.
                            </>
                          ) : (
                            <>
                              Your output is{' '}
                              <span
                                className={`font-mono font-semibold ${
                                  cmp.direction === 'up' ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                              >
                                {cmp.direction === 'up' ? `+${absCmp}% higher` : `${absCmp}% lower`}
                              </span>{' '}
                              than {cmp.label}.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {topCard && (
                    <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 shrink-0">
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="label-scandi text-zinc-400 block">Top Activity</span>
                          <span className="text-xs font-semibold text-white truncate block">
                            {topCard.activity.label}
                          </span>
                        </div>
                      </div>
                      <span
                        className="font-mono text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg border shrink-0"
                        style={{
                          color: topCard.activity.colorHex,
                          borderColor: `${topCard.activity.colorHex}55`,
                          backgroundColor: `${topCard.activity.colorHex}18`,
                        }}
                      >
                        {topCard.pct}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
