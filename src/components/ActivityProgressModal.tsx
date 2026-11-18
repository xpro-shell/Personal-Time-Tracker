import { ArrowDownRight, BarChart3, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import {
  ActiveDeskTelemetry,
  ActivityFilterId,
  buildEffectiveEntriesWithDesk,
  buildProgressSeries,
  formatMinutesHm,
  getActivityOptions,
  ProgressTemplateId,
  ProgressTimeframe,
} from '../lib/progressAnalytics';
import { CustomHabit, TimeEntry } from '../types/tracker';
import { ActivityProgressChart, PROGRESS_TEMPLATES } from './ActivityProgressChart';

interface ActivityProgressModalProps {
  activityFilter: ActivityFilterId | null;
  onClose: () => void;
  entries: TimeEntry[];
  habits: CustomHabit[];
  selectedDate: string;
  template: ProgressTemplateId;
  onChangeTemplate: (tpl: ProgressTemplateId) => void;
  onOpenFullSection: (activityFilter: ActivityFilterId) => void;
  activeDesk?: ActiveDeskTelemetry;
}

const MODAL_TIMEFRAMES: Array<{ id: ProgressTimeframe; label: string }> = [
  { id: 'hours', label: 'Hours (24h)' },
  { id: 'week', label: 'This Week' },
  { id: 'weeks', label: '8 Weeks' },
  { id: 'months', label: '12 Months' },
  { id: 'years', label: 'Years' },
];

export const ActivityProgressModal: React.FC<ActivityProgressModalProps> = ({
  activityFilter,
  onClose,
  entries,
  habits,
  selectedDate,
  template,
  onChangeTemplate,
  onOpenFullSection,
  activeDesk,
}) => {
  const [timeframe, setTimeframe] = useState<ProgressTimeframe>('week');
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);

  const effectiveEntries = useMemo(
    () => buildEffectiveEntriesWithDesk(entries, activeDesk),
    [entries, activeDesk]
  );

  const activityMeta = useMemo(() => {
    if (!activityFilter) return null;
    const all = getActivityOptions(habits);
    return all.find((a) => a.id === activityFilter) || all[0];
  }, [activityFilter, habits]);

  const series = useMemo(() => {
    if (!activityFilter) return null;
    return buildProgressSeries({
      entries: effectiveEntries,
      activityFilter,
      timeframe,
      selectedDate,
      habits,
    });
  }, [effectiveEntries, activityFilter, timeframe, selectedDate, habits]);

  if (!activityFilter || !activityMeta || !series) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${activityMeta.label} Progress Graph`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#101116] border border-zinc-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl border border-zinc-700/80 flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activityMeta.colorHex}18` }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: activityMeta.colorHex }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                {activityMeta.label} Progress
              </h3>
              <p className="text-xs font-sans text-zinc-400">
                Inspect hourly, weekly, monthly &amp; yearly consistency
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close progress modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Controls: Timeframe + Quick Template Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto">
              {MODAL_TIMEFRAMES.map((tf) => {
                const isActive = timeframe === tf.id;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => {
                      playDeskClick();
                      setTimeframe(tf.id);
                      setSelectedBucketKey(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none">
              {PROGRESS_TEMPLATES.map((tpl) => {
                const isActive = tpl.id === template;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      playDeskClick();
                      onChangeTemplate(tpl.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tpl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
              <span className="label-scandi text-zinc-400 block">Period Total</span>
              <span className="font-mono text-base sm:text-lg font-bold text-white tabular-nums mt-0.5 block">
                {formatMinutesHm(series.totalMinutes)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
              <span className="label-scandi text-zinc-400 block">vs Yesterday</span>
              <span
                className={`font-mono text-base sm:text-lg font-bold tabular-nums mt-0.5 block ${
                  series.yesterdayComparison.direction === 'up'
                    ? 'text-emerald-300'
                    : series.yesterdayComparison.direction === 'down'
                    ? 'text-rose-400'
                    : 'text-zinc-300'
                }`}
              >
                {series.yesterdayComparison.direction === 'up'
                  ? `↗ +${series.yesterdayComparison.pctChange}%`
                  : series.yesterdayComparison.direction === 'down'
                  ? `↘ ${series.yesterdayComparison.pctChange}%`
                  : '0% (Same)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
              <span className="label-scandi text-zinc-400 block">Peak</span>
              <span
                className="font-mono text-base sm:text-lg font-bold tabular-nums mt-0.5 block truncate"
                style={{ color: activityMeta.colorHex }}
              >
                {series.peakBucket && series.peakBucket.minutes > 0
                  ? `${series.peakBucket.label} (${formatMinutesHm(series.peakBucket.minutes)})`
                  : '0m'}
              </span>
            </div>
          </div>

          {/* Chart */}
          <ActivityProgressChart
            series={series}
            timeframe={timeframe}
            template={template}
            selectedBucketKey={selectedBucketKey}
            onSelectBucket={(b) => setSelectedBucketKey(b.key)}
            compact
          />
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-zinc-400">
            Daily Target: {formatMinutesHm(activityMeta.dailyTargetMinutes)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onOpenFullSection(activityFilter);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-400/15 border border-cyan-400/45 text-cyan-200 hover:bg-cyan-400/25 transition-colors cursor-pointer"
            >
              <span>Open in Full Progress Studio</span>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
