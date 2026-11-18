import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  LayoutTemplate,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import {
  ActiveDeskTelemetry,
  ActivityFilterId,
  buildEffectiveEntriesWithDesk,
  buildProgressSeries,
  formatMinutesHm,
  getActivityOptions,
  ProgressBucket,
  ProgressTemplateId,
  ProgressTimeframe,
} from '../lib/progressAnalytics';
import { CustomHabit, TimeEntry, UserProfile, VaultEntry } from '../types/tracker';
import { isEntryOnLocalDate } from '../lib/sessionRollover';
import { ActivityProgressChart, PROGRESS_TEMPLATES } from './ActivityProgressChart';
import { RankPulseChatbot } from './RankPulseChatbot';

interface ActivityProgressStudioProps {
  entries: TimeEntry[];
  habits: CustomHabit[];
  selectedDate: string;
  activeActivityFilter?: ActivityFilterId;
  onChangeActivityFilter?: (filterId: ActivityFilterId) => void;
  template: ProgressTemplateId;
  onChangeTemplate: (template: ProgressTemplateId) => void;
  onDeleteEntry?: (id: string) => void;
  activeDesk?: ActiveDeskTelemetry;
  vaultEntries?: VaultEntry[];
  achievementsCount?: number;
  profile?: UserProfile;
}

const TIMEFRAME_TABS: Array<{ id: ProgressTimeframe; label: string }> = [
  { id: 'hours', label: 'Each Hour (24h)' },
  { id: 'week', label: 'This Week (7d)' },
  { id: 'weeks', label: 'Weeks (8w)' },
  { id: 'months', label: 'Months (12m)' },
  { id: 'years', label: 'Years' },
];

export const ActivityProgressStudio: React.FC<ActivityProgressStudioProps> = ({
  entries,
  habits,
  selectedDate,
  activeActivityFilter,
  onChangeActivityFilter,
  template,
  onChangeTemplate,
  onDeleteEntry,
  activeDesk,
  vaultEntries = [],
  achievementsCount = 0,
  profile,
}) => {
  const [internalActivity, setInternalActivity] = useState<ActivityFilterId>('all');
  const activityFilter = activeActivityFilter ?? internalActivity;
  const setActivityFilter = (id: ActivityFilterId) => {
    setInternalActivity(id);
    onChangeActivityFilter?.(id);
  };

  const [timeframe, setTimeframe] = useState<ProgressTimeframe>('hours');
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [liveTickMs, setLiveTickMs] = useState(() => Date.now());
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const activitiesNavRef = useRef<HTMLDivElement>(null);
  const [navEdges, setNavEdges] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  // Refresh live Active Desk minutes smoothly once per 30s while logged in
  useEffect(() => {
    if (!activeDesk?.isDeskLoggedIn || activeDesk.isDeskTimerPaused) return;
    const t = window.setInterval(() => setLiveTickMs(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, [activeDesk?.isDeskLoggedIn, activeDesk?.isDeskTimerPaused]);

  const effectiveEntries = useMemo(
    () => buildEffectiveEntriesWithDesk(entries, activeDesk, liveTickMs),
    [entries, activeDesk, liveTickMs]
  );

  const updateNavEdges = React.useCallback(() => {
    const el = activitiesNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setNavEdges({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateNavEdges();
    const el = activitiesNavRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateNavEdges());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateNavEdges, habits]);

  useEffect(() => {
    if (!isTemplateMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isTemplateMenuOpen]);

  const activityOptions = useMemo(() => getActivityOptions(habits), [habits]);

  const series = useMemo(
    () =>
      buildProgressSeries({
        entries: effectiveEntries,
        activityFilter,
        timeframe,
        selectedDate,
        habits,
      }),
    [effectiveEntries, activityFilter, timeframe, selectedDate, habits]
  );

  // Quick Daily Snapshot across every main activity + Active Desk for selectedDate
  const todaySnapshot = useMemo(() => {
    const todayItems = effectiveEntries.filter(
      (e) => e.type !== 'day_boundary' && isEntryOnLocalDate(e, selectedDate)
    );
    let study = 0;
    let sleep = 0;
    let brk = 0;
    let life = 0;
    let habitsMins = 0;
    let deskMins = 0;

    todayItems.forEach((e) => {
      const d = e.durationMinutes || 0;
      if (e.type === 'desk') deskMins += d;
      else if (e.type === 'study' || e.type === 'content') study += d;
      else if (e.type === 'sleep') sleep += d;
      else if (e.type === 'break') brk += d;
      else if (e.type === 'life') life += d;
      else habitsMins += d;
    });

    const accounted = study + sleep + brk + life + habitsMins;
    return { study, sleep, brk, habitsMins, life, deskMins, accounted, totalCount: todayItems.length };
  }, [effectiveEntries, selectedDate]);

  const activeBucket: ProgressBucket | undefined = useMemo(() => {
    return (
      series.buckets.find((b) => b.key === selectedBucketKey) ||
      series.buckets.find((b) => b.isCurrent) ||
      series.buckets[series.buckets.length - 1]
    );
  }, [series.buckets, selectedBucketKey]);

  const activeTemplateObj =
    PROGRESS_TEMPLATES.find((t) => t.id === template) || PROGRESS_TEMPLATES[0];

  const fallbackProfile: UserProfile = profile || {
    email: 'local@desktop.app',
    displayName: 'Focus Pilot',
    totalXp: 0,
    level: 1,
    currentStreak: 1,
    lastActiveDate: selectedDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-5">
      {/* Main Studio Card */}
      <div className="studio-card p-5 sm:p-6 rounded-2xl bg-[#111216]/95 border border-zinc-800/85 space-y-5 relative">
        {/* Top Header + Template Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Activity Progress Studio
              </h3>
              <p className="text-xs font-sans text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Simple, accurate tracking across hours, weeks, months &amp; years</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono text-zinc-300">{selectedDate}</span>
              </p>
            </div>
          </div>

          {/* Template Bar Dropdown */}
          <div className="relative shrink-0" ref={templateMenuRef}>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setIsTemplateMenuOpen((o) => !o);
              }}
              className="interactive-press flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-700/80 hover:border-cyan-400/50 text-xs font-medium text-zinc-100 transition-all cursor-pointer whitespace-nowrap"
              title="Choose progress graph template"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
              <span>Template: {activeTemplateObj.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                  isTemplateMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 p-2.5 rounded-2xl bg-[#101116]/98 backdrop-blur-xl border border-zinc-700/80 shadow-2xl z-40 space-y-1.5">
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="label-scandi text-zinc-400">Progress View Templates</span>
                  <span className="text-[10px] font-mono text-cyan-300">Instant switch</span>
                </div>
                {PROGRESS_TEMPLATES.map((tpl) => {
                  const isActive = tpl.id === template;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        playDeskClick();
                        onChangeTemplate(tpl.id);
                        setIsTemplateMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/15 border-cyan-400/60 text-white'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{tpl.name}</span>
                          {tpl.id === 'clean-bars' && (
                            <span className="text-[10px] font-mono text-cyan-300 font-normal">
                              · Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-sans text-zinc-400 mt-0.5">
                          {tpl.tagline}
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Today's Clean Multi-Activity + Active Desk Snapshot Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              setActivityFilter('desk');
              setSelectedBucketKey(null);
            }}
            className="text-left px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-teal-500/30 hover:border-teal-400/70 transition-colors cursor-pointer"
            title="Click to inspect Active Desk Time chart"
          >
            <span className="label-scandi text-teal-400 block">Active Desk</span>
            <span className="font-mono text-base font-bold text-teal-200 tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.deskMins)}
            </span>
          </button>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-emerald-400 block">Study Focus</span>
            <span className="font-mono text-base font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.study)}
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-indigo-400 block">Sleep</span>
            <span className="font-mono text-base font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.sleep)}
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-amber-400 block">Break Bank</span>
            <span className="font-mono text-base font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.brk)}
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-purple-400 block">Habits</span>
            <span className="font-mono text-base font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.habitsMins)}
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-pink-400 block">Life / Leisure</span>
            <span className="font-mono text-base font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.life)}
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="label-scandi text-cyan-400 block">Total Logged</span>
            <span className="font-mono text-base font-bold text-cyan-200 tabular-nums mt-0.5 block">
              {formatMinutesHm(todaySnapshot.accounted)}
            </span>
          </div>
        </div>

        {/* Controls Row: Activity Selector + Timeframe Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Individual Activity Filter Navigation Bar */}
          <div className="relative min-w-0 flex-1">
            {/* Subtle Left Edge Fade Indicator */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-7 z-10 bg-gradient-to-r from-[#111216] via-[#111216]/75 to-transparent transition-opacity duration-200 ${
                navEdges.left ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div
              ref={activitiesNavRef}
              onScroll={updateNavEdges}
              role="tablist"
              aria-label="Filter progress by activity"
              className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth py-0.5 px-0.5"
            >
              {activityOptions.map((act) => {
                const isSelected = activityFilter === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      playDeskClick();
                      setActivityFilter(act.id);
                      setSelectedBucketKey(null);
                      e.currentTarget.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'nearest',
                        block: 'nearest',
                      });
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ease-out active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100/95 text-zinc-950 border-zinc-200/90 font-semibold shadow-[0_1px_10px_rgba(255,255,255,0.1)]'
                        : 'bg-zinc-950/40 text-zinc-300 border-zinc-800/80 hover:bg-zinc-900/75 hover:text-white hover:border-zinc-700/90'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: act.colorHex }}
                    />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Right Edge Fade Indicator */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-[#111216] via-[#111216]/75 to-transparent transition-opacity duration-200 ${
                navEdges.right ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Timeframe Segmented Switcher */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto shrink-0">
            {TIMEFRAME_TABS.map((tf) => {
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Series KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
            <span className="label-scandi text-zinc-400 block">
              {series.activity.shortLabel} Total
            </span>
            <span className="font-mono text-lg font-bold text-white tabular-nums mt-0.5 block">
              {formatMinutesHm(series.totalMinutes)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
            <span className="label-scandi text-zinc-400 block">vs Yesterday</span>
            <span
              className={`font-mono text-lg font-bold tabular-nums mt-0.5 block ${
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
            <span className="label-scandi text-zinc-400 block">Best Period</span>
            <span className="font-mono text-lg font-bold text-emerald-300 tabular-nums mt-0.5 block truncate">
              {series.peakBucket && series.peakBucket.minutes > 0
                ? `${series.peakBucket.label} · ${formatMinutesHm(series.peakBucket.minutes)}`
                : 'No logs yet'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0c0e13] border border-zinc-800/85">
            <span className="label-scandi text-zinc-400 block">Goal Hit Periods</span>
            <span className="font-mono text-lg font-bold text-cyan-300 tabular-nums mt-0.5 block">
              {series.targetHitCount} / {series.buckets.length}
            </span>
          </div>
        </div>

        {/* Interactive Graph Canvas */}
        <ActivityProgressChart
          series={series}
          timeframe={timeframe}
          template={template}
          selectedBucketKey={activeBucket?.key || null}
          onSelectBucket={(b) => setSelectedBucketKey(b.key)}
          onSelectActivity={(actId) => {
            playDeskClick();
            setActivityFilter(actId);
            setSelectedBucketKey(null);
          }}
        />

        {/* Selected Hour / Period Logged Entries with Quick Undo */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              {timeframe === 'hours' ? (
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>
                {activeBucket
                  ? `Sessions in ${activeBucket.subLabel} (${activeBucket.entries.length})`
                  : 'Logged Sessions'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Click any bar or point above to inspect its sessions
            </span>
          </div>

          {activeBucket && activeBucket.entries.length > 0 ? (
            <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {activeBucket.entries.map((entry) => {
                const startD = new Date(entry.startTime);
                const endD = entry.endTime
                  ? new Date(entry.endTime)
                  : new Date(startD.getTime() + (entry.durationMinutes || 0) * 60000);
                const sStr = !isNaN(startD.getTime())
                  ? startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';
                const eStr = !isNaN(endD.getTime())
                  ? endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';
                const dateTag = !isNaN(startD.getTime())
                  ? startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '';
                const isVirtualDesk =
                  entry.id === '__live_desk_session__' || entry.id.startsWith('__legacy_desk_');

                const sessionNotesList =
                  Array.isArray(entry.notes) && entry.notes.length > 0
                    ? entry.notes.map((n) => n.text)
                    : entry.note
                    ? [entry.note]
                    : [];

                return (
                  <div
                    key={entry.id}
                    className="px-3.5 py-2.5 bg-zinc-950/60 hover:bg-zinc-900/50 transition-colors flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="text-zinc-100 font-semibold truncate">
                          {entry.topic || entry.type}
                        </span>
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span className="text-zinc-400">
                          {timeframe !== 'hours' ? `${dateTag} ` : ''}
                          {sStr} → {eStr}
                        </span>
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span className="text-cyan-300 tabular-nums font-semibold">
                          {formatMinutesHm(entry.durationMinutes || 0)}
                        </span>
                        {entry.assignedDate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {entry.assignedDate}
                          </span>
                        )}
                      </div>
                      {sessionNotesList.length > 0 && (
                        <div className="text-[11px] font-sans text-zinc-300/90 pl-2 border-l border-cyan-500/40 space-y-0.5">
                          {sessionNotesList.map((txt, idx) => (
                            <p key={idx} className="truncate" title={txt}>
                              {txt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {onDeleteEntry && !isVirtualDesk && (
                      <button
                        type="button"
                        onClick={() => {
                          playDeskClick();
                          onDeleteEntry(entry.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remove this entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3.5 py-3 rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800 text-xs font-sans text-zinc-400">
              No logged blocks inside{' '}
              <strong className="text-zinc-200">{activeBucket?.subLabel || 'this period'}</strong> yet.
              Select another period or log a session above.
            </div>
          )}
        </div>

        {/* Circular Gaming-Growth AI Chatbot Launcher (In Beta · In Testing) inside Progress & Graphs */}
        <div className="pt-2 border-t border-zinc-800/60">
          <RankPulseChatbot
            entries={entries}
            habits={habits}
            vaultEntries={vaultEntries}
            achievementsCount={achievementsCount}
            profile={fallbackProfile}
            selectedDate={selectedDate}
            activeDesk={activeDesk}
          />
        </div>
      </div>
    </div>
  );
};
