import {
  ArrowLeft,
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
import { UniverseBlackHoleCanvas } from './UniverseBlackHoleCanvas';

interface ActivityProgressStudioProps {
  entries: TimeEntry[];
  habits: CustomHabit[];
  selectedDate: string;
  activeActivityFilter?: ActivityFilterId;
  onChangeActivityFilter?: (filterId: ActivityFilterId) => void;
  template: ProgressTemplateId;
  onChangeTemplate: (template: ProgressTemplateId) => void;
  onDeleteEntry?: (id: string) => void;
  onReassignEntryToPrevDay?: (id: string) => void;
  activeDesk?: ActiveDeskTelemetry;
  vaultEntries?: VaultEntry[];
  achievementsCount?: number;
  profile?: UserProfile;
  isCosmicTheme?: boolean;
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
  onReassignEntryToPrevDay,
  activeDesk,
  vaultEntries = [],
  achievementsCount = 0,
  profile,
  isCosmicTheme = false,
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
  const studioRootRef = useRef<HTMLDivElement>(null);
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

  const pilotName = fallbackProfile.displayName?.trim() || 'Focus Pilot';

  const dayWish = (() => {
    const h = new Date(liveTickMs).getHours();
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 22) return 'Good Evening';
    return 'Good Night';
  })();

  const motivationalLine = (() => {
    if (todaySnapshot.study >= 360) {
      return "Daily quota complete — keep sharpening your lead.";
    }
    const lines = [
      "Keep going. You're doing great.",
      'Every focused block builds unstoppable momentum.',
      'Stay locked in — consistency beats intensity.',
      'Protect your deep work today, thank yourself tonight.',
    ];
    const dayNum = parseInt(selectedDate.slice(-2), 10) || 0;
    return lines[dayNum % lines.length];
  })();

  const isCosmosTemplate = isCosmicTheme;

  return (
    <div className="space-y-6" ref={studioRootRef}>
      {/* Main Studio Card */}
      <div
        className={`studio-card p-6 sm:p-7 rounded-2xl border space-y-6 relative overflow-hidden transition-all duration-500 ${
          isCosmosTemplate
            ? 'bg-[#04060d]/85 border-violet-400/35 shadow-[0_0_65px_-20px_rgba(139,92,246,0.38)]'
            : 'bg-gradient-to-br from-[#0e111a] via-[#10121a] to-[#0b0d14] border-zinc-700/75 shadow-[0_22px_50px_-24px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Universe Black Hole / Subtle Starlight Animated Backdrop */}
        <UniverseBlackHoleCanvas variant={isCosmosTemplate ? 'full' : 'subtle'} />

        {/* Luminous Soft Highlight Sweep (always active for depth & brightness) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full blur-3xl opacity-30 animate-studio-float"
          style={{
            background: isCosmosTemplate
              ? 'radial-gradient(circle, rgba(56,189,248,0.45), transparent 70%)'
              : 'radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-25 animate-studio-float"
          style={{
            animationDelay: '-6s',
            background: isCosmosTemplate
              ? 'radial-gradient(circle, rgba(168,85,247,0.38), transparent 70%)'
              : 'radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)',
          }}
        />

        {/* Top Header + Personalized Wish & Template Bar */}
        <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl border mt-0.5 shrink-0 transition-all duration-300 ${
                isCosmosTemplate
                  ? 'bg-cyan-400/15 border-cyan-300/50 shadow-[0_0_24px_-4px_rgba(34,211,238,0.65)]'
                  : 'bg-cyan-500/15 border-cyan-400/40 shadow-[0_0_20px_-6px_rgba(34,211,238,0.45)]'
              }`}
            >
              <BarChart3 className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.24)]">
                {dayWish}, {pilotName}!
              </h3>
              <p className="text-sm sm:text-[15px] font-sans font-medium text-zinc-100 leading-snug">
                {motivationalLine}
              </p>
              <p className="text-xs font-mono font-semibold text-cyan-200/95 tracking-wide pt-0.5 tabular-nums">
                {selectedDate}
              </p>
            </div>
          </div>

          {/* Template Bar Dropdown */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative z-40 shrink-0" ref={templateMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  setIsTemplateMenuOpen((o) => !o);
                }}
                className="interactive-press flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-600/80 hover:border-cyan-400/70 text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap backdrop-blur-md shadow-sm"
                title="Choose progress graph template"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-cyan-300" />
                <span>Template: {activeTemplateObj.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-300 transition-transform ${
                    isTemplateMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isTemplateMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 p-2.5 rounded-2xl bg-[#0b0d16]/98 backdrop-blur-xl border border-zinc-700/90 shadow-2xl shadow-black/95 z-50 space-y-1.5">
                  <div className="px-2 py-1 flex items-center justify-between">
                    <span className="label-scandi text-zinc-300">Progress View Templates</span>
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
                            ? 'bg-cyan-500/18 border-cyan-400/70 text-white'
                            : 'bg-zinc-950/75 border-zinc-800/90 text-zinc-200 hover:border-zinc-600 hover:text-white'
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
                          <div className="text-[11px] font-sans text-zinc-300 mt-0.5">
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
        </div>

        {/* Today's Bright Multi-Activity + Active Desk Snapshot Strip (All Clickable Filters) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            {
              id: 'desk' as ActivityFilterId,
              label: 'Active Desk',
              value: formatMinutesHm(todaySnapshot.deskMins),
              labelCls: 'text-teal-300',
              valueCls: 'text-teal-100',
              borderActive: 'border-teal-400/80 shadow-[0_0_24px_-8px_rgba(45,212,191,0.55)]',
              borderDefault: 'border-teal-500/35 hover:border-teal-400/75',
            },
            {
              id: 'study' as ActivityFilterId,
              label: 'Study Focus',
              value: formatMinutesHm(todaySnapshot.study),
              labelCls: 'text-emerald-300',
              valueCls: 'text-white',
              borderActive: 'border-emerald-400/80 shadow-[0_0_24px_-8px_rgba(52,211,153,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-emerald-400/65',
            },
            {
              id: 'sleep' as ActivityFilterId,
              label: 'Sleep',
              value: formatMinutesHm(todaySnapshot.sleep),
              labelCls: 'text-indigo-300',
              valueCls: 'text-white',
              borderActive: 'border-indigo-400/80 shadow-[0_0_24px_-8px_rgba(129,140,248,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-indigo-400/65',
            },
            {
              id: 'break' as ActivityFilterId,
              label: 'Break Bank',
              value: formatMinutesHm(todaySnapshot.brk),
              labelCls: 'text-amber-300',
              valueCls: 'text-white',
              borderActive: 'border-amber-400/80 shadow-[0_0_24px_-8px_rgba(251,191,36,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-amber-400/65',
            },
            {
              id: (habits[0] ? (`habit:${habits[0].id}` as ActivityFilterId) : 'all'),
              label: 'Habits',
              value: formatMinutesHm(todaySnapshot.habitsMins),
              labelCls: 'text-purple-300',
              valueCls: 'text-white',
              borderActive: 'border-purple-400/80 shadow-[0_0_24px_-8px_rgba(192,132,252,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-purple-400/65',
            },
            {
              id: 'life' as ActivityFilterId,
              label: 'Life / Leisure',
              value: formatMinutesHm(todaySnapshot.life),
              labelCls: 'text-pink-300',
              valueCls: 'text-white',
              borderActive: 'border-pink-400/80 shadow-[0_0_24px_-8px_rgba(244,114,182,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-pink-400/65',
            },
            {
              id: 'all' as ActivityFilterId,
              label: 'Total Logged',
              value: formatMinutesHm(todaySnapshot.accounted),
              labelCls: 'text-cyan-300',
              valueCls: 'text-cyan-100',
              borderActive: 'border-cyan-400/80 shadow-[0_0_24px_-8px_rgba(34,211,238,0.55)]',
              borderDefault: 'border-zinc-700/75 hover:border-cyan-400/65',
            },
          ].map((tile) => {
            const isSelectedTile = activityFilter === tile.id;
            return (
              <button
                key={tile.label}
                type="button"
                onClick={() => {
                  playDeskClick();
                  setActivityFilter(tile.id);
                  setSelectedBucketKey(null);
                }}
                className={`text-left px-3.5 py-3 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                  isCosmosTemplate
                    ? 'bg-[#060916]/65'
                    : 'bg-[#090b12]/80'
                } ${isSelectedTile ? tile.borderActive : tile.borderDefault}`}
                title={`Click to view ${tile.label} chart`}
              >
                <span className={`label-scandi block ${tile.labelCls}`}>{tile.label}</span>
                <span className={`font-mono text-base sm:text-lg font-bold tabular-nums mt-1 block ${tile.valueCls}`}>
                  {tile.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls Row: Activity Selector + Timeframe Tabs */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Individual Activity Filter Navigation Bar */}
          <div className="relative min-w-0 flex-1">
            {/* Subtle Left Edge Fade Indicator */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-7 z-10 bg-gradient-to-r transition-opacity duration-200 ${
                isCosmosTemplate
                  ? 'from-[#04060d] via-[#04060d]/75 to-transparent'
                  : 'from-[#0e111a] via-[#0e111a]/75 to-transparent'
              } ${navEdges.left ? 'opacity-100' : 'opacity-0'}`}
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
                        ? 'bg-white text-zinc-950 border-white font-semibold shadow-[0_2px_14px_rgba(255,255,255,0.22)]'
                        : 'bg-zinc-950/60 text-zinc-200 border-zinc-700/80 hover:bg-zinc-900/90 hover:text-white hover:border-zinc-500'
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
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l transition-opacity duration-200 ${
                isCosmosTemplate
                  ? 'from-[#04060d] via-[#04060d]/75 to-transparent'
                  : 'from-[#0e111a] via-[#0e111a]/75 to-transparent'
              } ${navEdges.right ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>

          {/* Timeframe Segmented Switcher */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 rounded-xl overflow-x-auto shrink-0">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_14px_-2px_rgba(34,211,238,0.65)]'
                      : 'text-zinc-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Series KPIs */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div
            className={`p-3.5 rounded-xl border backdrop-blur-md transition-colors ${
              isCosmosTemplate
                ? 'bg-[#060916]/65 border-cyan-400/25'
                : 'bg-[#090b12]/80 border-zinc-700/75'
            }`}
          >
            <span className="label-scandi text-zinc-200 block">
              {series.activity.shortLabel} Total
            </span>
            <span className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums mt-1 block">
              {formatMinutesHm(series.totalMinutes)}
            </span>
          </div>
          <div
            className={`p-3.5 rounded-xl border backdrop-blur-md transition-colors ${
              isCosmosTemplate
                ? 'bg-[#060916]/65 border-cyan-400/25'
                : 'bg-[#090b12]/80 border-zinc-700/75'
            }`}
          >
            <span className="label-scandi text-zinc-200 block">vs Yesterday</span>
            <span
              className={`font-mono text-lg sm:text-xl font-bold tabular-nums mt-1 block ${
                series.yesterdayComparison.direction === 'up'
                  ? 'text-emerald-300'
                  : series.yesterdayComparison.direction === 'down'
                  ? 'text-rose-400'
                  : 'text-zinc-100'
              }`}
            >
              {series.yesterdayComparison.direction === 'up'
                ? `↗ +${series.yesterdayComparison.pctChange}%`
                : series.yesterdayComparison.direction === 'down'
                ? `↘ ${series.yesterdayComparison.pctChange}%`
                : '0% (Same)'}
            </span>
          </div>
          <div
            className={`p-3.5 rounded-xl border backdrop-blur-md transition-colors ${
              isCosmosTemplate
                ? 'bg-[#060916]/65 border-cyan-400/25'
                : 'bg-[#090b12]/80 border-zinc-700/75'
            }`}
          >
            <span className="label-scandi text-zinc-200 block">Best Period</span>
            <span className="font-mono text-lg sm:text-xl font-bold text-emerald-300 tabular-nums mt-1 block truncate">
              {series.peakBucket && series.peakBucket.minutes > 0
                ? `${series.peakBucket.label} · ${formatMinutesHm(series.peakBucket.minutes)}`
                : 'No logs yet'}
            </span>
          </div>
          <div
            className={`p-3.5 rounded-xl border backdrop-blur-md transition-colors ${
              isCosmosTemplate
                ? 'bg-[#060916]/65 border-cyan-400/25'
                : 'bg-[#090b12]/80 border-zinc-700/75'
            }`}
          >
            <span className="label-scandi text-zinc-200 block">Goal Hit Periods</span>
            <span className="font-mono text-lg sm:text-xl font-bold text-cyan-300 tabular-nums mt-1 block">
              {series.targetHitCount} / {series.buckets.length}
            </span>
          </div>
        </div>

        {/* Interactive Graph Canvas */}
        <div className="relative z-10">
        <ActivityProgressChart
          series={series}
          timeframe={timeframe}
          template={template}
          isCosmicTheme={isCosmosTemplate}
          selectedBucketKey={activeBucket?.key || null}
          onSelectBucket={(b) => setSelectedBucketKey(b.key)}
          onSelectActivity={(actId) => {
            playDeskClick();
            setActivityFilter(actId);
            setSelectedBucketKey(null);
          }}
          onChangeTimeframe={(tf) => {
            playDeskClick();
            setTimeframe(tf);
            setSelectedBucketKey(null);
          }}
        />
        </div>

        {/* Selected Hour / Period Logged Entries with Quick Undo */}
        <div className="relative z-10 pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-100 font-medium">
              {timeframe === 'hours' ? (
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span>
                {activeBucket
                  ? `Sessions in ${activeBucket.subLabel} (${activeBucket.entries.length})`
                  : 'Logged Sessions'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-300">
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

                    <div className="flex items-center gap-1 shrink-0">
                      {onReassignEntryToPrevDay && !isVirtualDesk && entry.type !== 'day_boundary' && (
                        <button
                          type="button"
                          onClick={() => {
                            playDeskClick();
                            onReassignEntryToPrevDay(entry.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-cyan-300 hover:text-zinc-950 bg-cyan-500/10 hover:bg-cyan-300 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
                          title="Send this tracked entry back to the previous day's quota"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Prev Day</span>
                        </button>
                      )}

                      {onDeleteEntry && !isVirtualDesk && (
                        <button
                          type="button"
                          onClick={() => {
                            playDeskClick();
                            onDeleteEntry(entry.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove this entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>
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
        <div className="relative z-10 pt-3 border-t border-white/10">
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
