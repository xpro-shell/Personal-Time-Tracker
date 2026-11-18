import { formatLocalYMD } from '../components/DateNavigator';
import { CustomHabit, TimeEntry } from '../types/tracker';
import { getEntryAssignedDate, isEntryOnLocalDate } from './sessionRollover';

export type ActivityFilterId =
  | 'all'
  | 'study'
  | 'break'
  | 'sleep'
  | 'life'
  | 'desk'
  | `habit:${string}`;

export interface ActiveDeskTelemetry {
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  isDeskTimerPaused?: boolean;
  deskPausedAt?: string | null;
  deskAccumulatedPausedMs?: number;
}

export type ProgressTimeframe = 'hours' | 'week' | 'weeks' | 'months' | 'years';

export type ProgressTemplateId =
  | 'clean-bars'
  | 'growth-cards'
  | 'smooth-wave'
  | 'rings-grid'
  | 'pulse-blocks';

export interface ActivityMeta {
  id: ActivityFilterId;
  label: string;
  shortLabel: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dailyTargetMinutes: number;
}

export interface ProgressBucket {
  key: string;
  label: string;
  subLabel: string;
  minutes: number;
  hours: number;
  targetMinutes: number;
  pctOfTarget: number;
  isCurrent?: boolean;
  vsPrevDiffMins: number | null;
  vsPrevPct: number | null;
  vsPrevDirection: 'up' | 'down' | 'flat' | null;
  breakdown: {
    study: number;
    sleep: number;
    break: number;
    habit: number;
    life: number;
  };
  entries: TimeEntry[];
}

export interface YesterdayComparison {
  currentMinutes: number;
  previousMinutes: number;
  diffMinutes: number;
  pctChange: number;
  direction: 'up' | 'down' | 'flat';
  comparisonLabel: string;
}

export interface ActivityGrowthCardData {
  activity: ActivityMeta;
  currentMinutes: number;
  previousMinutes: number;
  targetMinutes: number;
  pct: number;
  diffMinutes: number;
  pctChange: number;
  direction: 'up' | 'down' | 'flat';
  daysHit: number;
  totalDays: number;
}

export interface ProgressSeriesResult {
  activity: ActivityMeta;
  buckets: ProgressBucket[];
  totalMinutes: number;
  totalHours: number;
  averageMinutesPerActive: number;
  averageHoursPerBucket: number;
  peakBucket: ProgressBucket | null;
  targetHitCount: number;
  maxBucketMinutes: number;
  yesterdayComparison: YesterdayComparison;
  activityCards: ActivityGrowthCardData[];
}

const HABIT_COLORS: Record<CustomHabit['colorTheme'], {
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  purple: {
    hex: '#c084fc',
    bgClass: 'bg-purple-400',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-400/45',
  },
  bronze: {
    hex: '#fb923c',
    bgClass: 'bg-orange-400',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-400/45',
  },
  amber: {
    hex: '#fbbf24',
    bgClass: 'bg-amber-400',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/45',
  },
  emerald: {
    hex: '#34d399',
    bgClass: 'bg-emerald-400',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/45',
  },
  blue: {
    hex: '#38bdf8',
    bgClass: 'bg-sky-400',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-400/45',
  },
  rose: {
    hex: '#fb7185',
    bgClass: 'bg-rose-400',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-400/45',
  },
  indigo: {
    hex: '#818cf8',
    bgClass: 'bg-indigo-400',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-400/45',
  },
};

export function getActivityOptions(habits: CustomHabit[]): ActivityMeta[] {
  const core: ActivityMeta[] = [
    {
      id: 'all',
      label: 'All Activities',
      shortLabel: 'All',
      colorHex: '#22d3ee',
      bgClass: 'bg-cyan-400',
      textClass: 'text-cyan-300',
      borderClass: 'border-cyan-400/45',
      dailyTargetMinutes: 480,
    },
    {
      id: 'study',
      label: 'Study Focus',
      shortLabel: 'Study',
      colorHex: '#34d399',
      bgClass: 'bg-emerald-400',
      textClass: 'text-emerald-300',
      borderClass: 'border-emerald-400/45',
      dailyTargetMinutes: 360,
    },
    {
      id: 'sleep',
      label: 'Restorative Sleep',
      shortLabel: 'Sleep',
      colorHex: '#818cf8',
      bgClass: 'bg-indigo-400',
      textClass: 'text-indigo-300',
      borderClass: 'border-indigo-400/45',
      dailyTargetMinutes: 480,
    },
    {
      id: 'break',
      label: 'Break Bank',
      shortLabel: 'Break',
      colorHex: '#fbbf24',
      bgClass: 'bg-amber-400',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-400/45',
      dailyTargetMinutes: 120,
    },
  ];

  const habitItems: ActivityMeta[] = habits.map((habit) => {
    const c = HABIT_COLORS[habit.colorTheme] || HABIT_COLORS.purple;
    return {
      id: `habit:${habit.id}`,
      label: habit.name,
      shortLabel: habit.name.split(' ')[0],
      colorHex: c.hex,
      bgClass: c.bgClass,
      textClass: c.textClass,
      borderClass: c.borderClass,
      dailyTargetMinutes: Math.max(15, habit.dailyTargetMinutes || 60),
    };
  });

  const life: ActivityMeta = {
    id: 'life',
    label: 'Life & Leisure',
    shortLabel: 'Life',
    colorHex: '#f472b6',
    bgClass: 'bg-pink-400',
    textClass: 'text-pink-300',
    borderClass: 'border-pink-400/45',
    dailyTargetMinutes: 120,
  };

  const desk: ActivityMeta = {
    id: 'desk',
    label: 'Active Desk',
    shortLabel: 'Desk',
    colorHex: '#2dd4bf',
    bgClass: 'bg-teal-400',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-400/45',
    dailyTargetMinutes: 480,
  };

  return [...core, ...habitItems, life, desk];
}

export function buildEffectiveEntriesWithDesk(
  entries: TimeEntry[],
  activeDesk?: ActiveDeskTelemetry,
  nowMs = Date.now()
): TimeEntry[] {
  const result = [...entries];
  const explicitDeskStarts = entries
    .filter((e) => e.type === 'desk')
    .map((e) => new Date(e.startTime).getTime())
    .filter((t) => Number.isFinite(t));

  const hasMatchingDesk = (startMs: number) =>
    explicitDeskStarts.some((t) => Math.abs(t - startMs) <= 120000);

  // Pair legacy day_boundary start -> stop entries so historical Active Desk sessions appear too
  const boundaries = entries
    .filter((e) => e.type === 'day_boundary')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  let openBoundaryStart: TimeEntry | null = null;
  for (const b of boundaries) {
    if (b.action === 'start') {
      openBoundaryStart = b;
    } else if (b.action === 'stop' && openBoundaryStart) {
      const sMs = new Date(openBoundaryStart.startTime).getTime();
      const eMs = new Date(b.startTime).getTime();
      const mins = Math.round((eMs - sMs) / 60000);
      if (Number.isFinite(sMs) && Number.isFinite(eMs) && mins > 0 && mins <= 960 && !hasMatchingDesk(sMs)) {
        result.push({
          id: `__legacy_desk_${openBoundaryStart.id}`,
          userId: b.userId || 'local_desktop_user',
          type: 'desk',
          action: 'stop',
          topic: 'Active Desk Time',
          startTime: openBoundaryStart.startTime,
          endTime: b.startTime,
          durationMinutes: mins,
          source: 'manual',
          createdAt: b.createdAt,
        });
      }
      openBoundaryStart = null;
    }
  }

  // Inject currently running live Active Desk session so today's Desk hours graph live
  if (activeDesk?.isDeskLoggedIn && activeDesk.deskLoginTimestamp) {
    const loginMs = new Date(activeDesk.deskLoginTimestamp).getTime();
    if (Number.isFinite(loginMs)) {
      const effectiveEndMs =
        activeDesk.isDeskTimerPaused && activeDesk.deskPausedAt
          ? new Date(activeDesk.deskPausedAt).getTime()
          : nowMs;
      const pausedMs = activeDesk.deskAccumulatedPausedMs || 0;
      const elapsedMs = Math.max(0, effectiveEndMs - loginMs - pausedMs);
      const mins = Math.round(elapsedMs / 60000);
      if (mins > 0 && mins <= 1440) {
        result.push({
          id: '__live_desk_session__',
          userId: 'local_desktop_user',
          type: 'desk',
          action: 'start',
          topic: activeDesk.isDeskTimerPaused ? 'Active Desk (Paused)' : 'Active Desk (Live)',
          startTime: activeDesk.deskLoginTimestamp,
          endTime: new Date(effectiveEndMs).toISOString(),
          durationMinutes: mins,
          source: 'manual',
          createdAt: activeDesk.deskLoginTimestamp,
        });
      }
    }
  }

  return result;
}

export function entryMatchesActivity(
  entry: TimeEntry,
  filterId: ActivityFilterId,
  habits: CustomHabit[]
): boolean {
  if (entry.type === 'day_boundary') return false;
  // Keep 'desk' separate from 'all' so sitting at desk doesn't double-count Study/Habits/Break hours
  if (filterId === 'all') return entry.type !== 'desk';
  if (filterId === 'study') return entry.type === 'study' || entry.type === 'content';
  if (filterId === 'break') return entry.type === 'break';
  if (filterId === 'sleep') return entry.type === 'sleep';
  if (filterId === 'life') return entry.type === 'life';
  if (filterId === 'desk') return entry.type === 'desk';

  if (filterId.startsWith('habit:')) {
    const habitId = filterId.slice(6);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return false;
    return (
      entry.habitId === habit.id ||
      entry.type === habit.entryType ||
      (!!entry.topic && entry.topic.toLowerCase().includes(habit.shortcode.toLowerCase()))
    );
  }
  return false;
}

function classifyBreakdownKey(entry: TimeEntry): 'study' | 'sleep' | 'break' | 'habit' | 'life' {
  if (entry.type === 'study' || entry.type === 'content') return 'study';
  if (entry.type === 'sleep') return 'sleep';
  if (entry.type === 'break') return 'break';
  if (entry.type === 'life') return 'life';
  return 'habit';
}

function getEntryDurationMins(entry: TimeEntry): number {
  if (
    typeof entry.durationMinutes === 'number' &&
    Number.isFinite(entry.durationMinutes) &&
    entry.durationMinutes > 0
  ) {
    return entry.durationMinutes;
  }
  if (entry.startTime && entry.endTime) {
    const startMs = new Date(entry.startTime).getTime();
    const endMs = new Date(entry.endTime).getTime();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
      const derived = Math.round((endMs - startMs) / 60000);
      if (derived > 0) return derived;
    }
  }
  if (entry.type === 'music') return 180;
  if (entry.type === 'sleep') return 480;
  return 0;
}

export function formatMinutesHm(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatSignedMinutesHm(diffMinutes: number): string {
  if (diffMinutes === 0) return '0m';
  const sign = diffMinutes > 0 ? '+' : '-';
  return `${sign}${formatMinutesHm(diffMinutes)}`;
}

export function formatHoursDecimal(totalMinutes: number): string {
  const hrs = Math.round((totalMinutes / 60) * 10) / 10;
  return `${hrs}h`;
}

function parseLocalYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function createEmptyBreakdown() {
  return { study: 0, sleep: 0, break: 0, habit: 0, life: 0 };
}

function computeDelta(
  currentMins: number,
  previousMins: number,
  fallbackTargetMins: number
): {
  diffMinutes: number;
  pctChange: number;
  direction: 'up' | 'down' | 'flat';
} {
  const diffMinutes = Math.round(currentMins - previousMins);
  if (diffMinutes === 0) {
    return { diffMinutes: 0, pctChange: 0, direction: 'flat' };
  }
  let pctChange: number;
  if (previousMins > 0) {
    pctChange = Math.round((diffMinutes / previousMins) * 100);
  } else {
    // Yesterday was 0 -> express realistic growth against daily target (capped to 100%+)
    pctChange = Math.max(1, Math.round((currentMins / Math.max(30, fallbackTargetMins)) * 100));
  }
  return {
    diffMinutes,
    pctChange,
    direction: diffMinutes > 0 ? 'up' : 'down',
  };
}

function sumMinutesForRange(
  entries: TimeEntry[],
  activityFilter: ActivityFilterId,
  habits: CustomHabit[],
  startYmd: string,
  endYmd: string
): number {
  let total = 0;
  entries.forEach((e) => {
    if (!entryMatchesActivity(e, activityFilter, habits)) return;
    const ymd = getEntryAssignedDate(e);
    if (!ymd) return;
    if (ymd >= startYmd && ymd <= endYmd) {
      total += getEntryDurationMins(e);
    }
  });
  return total;
}

export function buildProgressSeries(options: {
  entries: TimeEntry[];
  activityFilter: ActivityFilterId;
  timeframe: ProgressTimeframe;
  selectedDate: string;
  habits: CustomHabit[];
}): ProgressSeriesResult {
  const { entries, activityFilter, timeframe, selectedDate, habits } = options;
  const activityOptions = getActivityOptions(habits);
  const activity = activityOptions.find((a) => a.id === activityFilter) || activityOptions[0];

  const filtered = entries.filter((e) => entryMatchesActivity(e, activityFilter, habits));
  const anchorDate = parseLocalYMD(selectedDate);
  const yesterdayDate = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() - 1
  );
  const yesterdayYmd = formatLocalYMD(yesterdayDate);
  const todayYmd = formatLocalYMD(new Date());

  let rawBuckets: Omit<ProgressBucket, 'vsPrevDiffMins' | 'vsPrevPct' | 'vsPrevDirection'>[] = [];

  if (timeframe === 'hours') {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const currentHour = selectedDate === todayYmd ? new Date().getHours() : -1;

    rawBuckets = Array.from({ length: 24 }).map((_, h) => {
      const slotStartMs = new Date(y, m - 1, d, h, 0, 0, 0).getTime();
      const slotEndMs = slotStartMs + 3600 * 1000;
      const breakdown = createEmptyBreakdown();
      const slotEntries: TimeEntry[] = [];
      let totalMins = 0;

      filtered.forEach((entry) => {
        const entryYmd = getEntryAssignedDate(entry);
        // Strictly respect explicit assignedDate so post-midnight spillover doesn't leak onto next day's bars
        if (entryYmd && entryYmd !== selectedDate && (entry.assignedDate || entry.type !== 'sleep')) {
          return;
        }
        const startMs = new Date(entry.startTime).getTime();
        if (isNaN(startMs)) return;
        const dur = getEntryDurationMins(entry);
        const endMs = entry.endTime ? new Date(entry.endTime).getTime() : startMs + dur * 60000;
        const overlapMs = Math.max(0, Math.min(endMs, slotEndMs) - Math.max(startMs, slotStartMs));
        if (overlapMs > 0) {
          const overlapMins = Math.round(overlapMs / 60000);
          if (overlapMins <= 0) return;
          totalMins += overlapMins;
          breakdown[classifyBreakdownKey(entry)] += overlapMins;
          slotEntries.push(entry);
        }
      });

      const capped = Math.min(60, totalMins);
      return {
        key: `h_${h}`,
        label: `${h.toString().padStart(2, '0')}`,
        subLabel: `${h.toString().padStart(2, '0')}:00 – ${((h + 1) % 24).toString().padStart(2, '0')}:00`,
        minutes: capped,
        hours: Math.round((capped / 60) * 10) / 10,
        targetMinutes: 60,
        pctOfTarget: Math.min(100, Math.round((capped / 60) * 100)),
        isCurrent: h === currentHour,
        breakdown,
        entries: slotEntries,
      };
    });
  } else if (timeframe === 'week') {
    const dow = anchorDate.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      anchorDate.getDate() + diffToMon
    );

    rawBuckets = Array.from({ length: 7 }).map((_, idx) => {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
      const ymd = formatLocalYMD(dayDate);
      const dayEntries = filtered.filter((e) => isEntryOnLocalDate(e, ymd));
      const breakdown = createEmptyBreakdown();
      let mins = 0;

      dayEntries.forEach((e) => {
        const d = getEntryDurationMins(e);
        mins += d;
        breakdown[classifyBreakdownKey(e)] += d;
      });

      return {
        key: ymd,
        label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        subLabel: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        targetMinutes: activity.dailyTargetMinutes,
        pctOfTarget: Math.min(100, Math.round((mins / activity.dailyTargetMinutes) * 100)),
        isCurrent: ymd === selectedDate,
        breakdown,
        entries: dayEntries,
      };
    });
  } else if (timeframe === 'weeks') {
    const dow = anchorDate.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const anchorMonday = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      anchorDate.getDate() + diffToMon
    );
    const weekTarget = activity.dailyTargetMinutes * 7;

    rawBuckets = Array.from({ length: 8 }).map((_, idx) => {
      const weeksBack = 7 - idx;
      const wStart = new Date(
        anchorMonday.getFullYear(),
        anchorMonday.getMonth(),
        anchorMonday.getDate() - weeksBack * 7
      );
      const wEnd = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + 6);
      const startYmd = formatLocalYMD(wStart);
      const endYmd = formatLocalYMD(wEnd);

      const breakdown = createEmptyBreakdown();
      const weekEntries: TimeEntry[] = [];
      let mins = 0;

      filtered.forEach((e) => {
        const eYmd = getEntryAssignedDate(e);
        if (!eYmd) return;
        if (eYmd >= startYmd && eYmd <= endYmd) {
          const d = getEntryDurationMins(e);
          mins += d;
          breakdown[classifyBreakdownKey(e)] += d;
          weekEntries.push(e);
        }
      });

      const rangeText = `${wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${wEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      return {
        key: startYmd,
        label: weeksBack === 0 ? 'This Wk' : `-${weeksBack}w`,
        subLabel: rangeText,
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        targetMinutes: weekTarget,
        pctOfTarget: Math.min(100, Math.round((mins / weekTarget) * 100)),
        isCurrent: weeksBack === 0,
        breakdown,
        entries: weekEntries,
      };
    });
  } else if (timeframe === 'months') {
    const anchorYear = anchorDate.getFullYear();
    const anchorMonth = anchorDate.getMonth();

    rawBuckets = Array.from({ length: 12 }).map((_, idx) => {
      const monthsBack = 11 - idx;
      const mDate = new Date(anchorYear, anchorMonth - monthsBack, 1);
      const yr = mDate.getFullYear();
      const mo = mDate.getMonth();
      const daysInMonth = new Date(yr, mo + 1, 0).getDate();
      const monthTarget = activity.dailyTargetMinutes * daysInMonth;

      const breakdown = createEmptyBreakdown();
      const monthEntries: TimeEntry[] = [];
      let mins = 0;

      filtered.forEach((e) => {
        const eYmd = getEntryAssignedDate(e);
        if (!eYmd) return;
        const [eYr, eMo] = eYmd.split('-').map(Number);
        if (eYr === yr && eMo - 1 === mo) {
          const d = getEntryDurationMins(e);
          mins += d;
          breakdown[classifyBreakdownKey(e)] += d;
          monthEntries.push(e);
        }
      });

      return {
        key: `${yr}-${mo + 1}`,
        label: mDate.toLocaleDateString('en-US', { month: 'short' }),
        subLabel: mDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        targetMinutes: monthTarget,
        pctOfTarget: Math.min(100, Math.round((mins / monthTarget) * 100)),
        isCurrent: monthsBack === 0,
        breakdown,
        entries: monthEntries,
      };
    });
  } else {
    const currentYear = anchorDate.getFullYear();
    let minEntryYear = currentYear;
    filtered.forEach((e) => {
      const eYmd = getEntryAssignedDate(e);
      if (eYmd) {
        const eYr = Number(eYmd.slice(0, 4));
        if (Number.isFinite(eYr) && eYr < minEntryYear) {
          minEntryYear = eYr;
        }
      }
    });
    const startYear = Math.min(currentYear - 4, Math.max(currentYear - 6, minEntryYear));
    const yearsCount = currentYear - startYear + 1;
    const yearTarget = activity.dailyTargetMinutes * 365;

    rawBuckets = Array.from({ length: yearsCount }).map((_, idx) => {
      const yr = startYear + idx;
      const breakdown = createEmptyBreakdown();
      const yearEntries: TimeEntry[] = [];
      let mins = 0;

      filtered.forEach((e) => {
        const eYmd = getEntryAssignedDate(e);
        if (!eYmd) return;
        const eYr = Number(eYmd.slice(0, 4));
        if (eYr === yr) {
          const d = getEntryDurationMins(e);
          mins += d;
          breakdown[classifyBreakdownKey(e)] += d;
          yearEntries.push(e);
        }
      });

      return {
        key: String(yr),
        label: String(yr),
        subLabel: `Full Year ${yr}`,
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        targetMinutes: yearTarget,
        pctOfTarget: Math.min(100, Math.round((mins / yearTarget) * 100)),
        isCurrent: yr === currentYear,
        breakdown,
        entries: yearEntries,
      };
    });
  }

  // Enrich each bucket with growth/degrowth delta compared to previous bucket
  const buckets: ProgressBucket[] = rawBuckets.map((b, idx) => {
    if (idx === 0) {
      return {
        ...b,
        vsPrevDiffMins: null,
        vsPrevPct: null,
        vsPrevDirection: null,
      };
    }
    const prev = rawBuckets[idx - 1];
    const delta = computeDelta(b.minutes, prev.minutes, b.targetMinutes);
    return {
      ...b,
      vsPrevDiffMins: delta.diffMinutes,
      vsPrevPct: delta.pctChange,
      vsPrevDirection: delta.direction,
    };
  });

  // Compute selectedDate vs Yesterday comparison for the active activity filter
  const selectedDayMins = sumMinutesForRange(entries, activityFilter, habits, selectedDate, selectedDate);
  const yesterdayDayMins = sumMinutesForRange(entries, activityFilter, habits, yesterdayYmd, yesterdayYmd);
  const yDelta = computeDelta(selectedDayMins, yesterdayDayMins, activity.dailyTargetMinutes);
  const yesterdayComparison: YesterdayComparison = {
    currentMinutes: selectedDayMins,
    previousMinutes: yesterdayDayMins,
    diffMinutes: yDelta.diffMinutes,
    pctChange: yDelta.pctChange,
    direction: yDelta.direction,
    comparisonLabel: 'vs Yesterday',
  };

  // Compute individual Activity Growth Cards (all activities except 'all')
  // Shows selected timeframe's consistency OR selectedDate vs Yesterday!
  const individualActivities = activityOptions.filter((a) => a.id !== 'all');
  const activityCards: ActivityGrowthCardData[] = individualActivities.map((act) => {
    const todayActMins = sumMinutesForRange(entries, act.id, habits, selectedDate, selectedDate);
    const yesterdayActMins = sumMinutesForRange(entries, act.id, habits, yesterdayYmd, yesterdayYmd);
    const actDelta = computeDelta(todayActMins, yesterdayActMins, act.dailyTargetMinutes);

    // Count active days across last 30 days (up to selectedDate) for rich "X / 30 days" feel
    const windowDays = timeframe === 'week' ? 7 : 30;
    let daysHit = 0;
    let totalRangeMins = 0;
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth(),
        anchorDate.getDate() - i
      );
      const ymd = formatLocalYMD(d);
      const dayM = sumMinutesForRange(entries, act.id, habits, ymd, ymd);
      totalRangeMins += dayM;
      if (dayM >= Math.min(30, act.dailyTargetMinutes * 0.5)) {
        daysHit++;
      }
    }

    // Percentage reflects today's target progress if logged today, else 30-day/week consistency %
    const periodTargetMins =
      timeframe === 'hours'
        ? act.dailyTargetMinutes
        : timeframe === 'week'
        ? act.dailyTargetMinutes * 7
        : timeframe === 'weeks'
        ? act.dailyTargetMinutes * 56
        : timeframe === 'months'
        ? act.dailyTargetMinutes * 30
        : act.dailyTargetMinutes * 365;

    const currentForView =
      timeframe === 'hours'
        ? todayActMins
        : timeframe === 'week'
        ? totalRangeMins
        : sumMinutesForRange(
            entries,
            act.id,
            habits,
            buckets[0]?.key && buckets[0].key.length === 10 ? buckets[0].key : yesterdayYmd,
            selectedDate
          ) || todayActMins;

    const pct =
      timeframe === 'hours'
        ? Math.min(100, Math.round((todayActMins / Math.max(1, act.dailyTargetMinutes)) * 100))
        : Math.min(100, Math.round((daysHit / windowDays) * 100));

    return {
      activity: act,
      currentMinutes: timeframe === 'hours' ? todayActMins : Math.max(todayActMins, currentForView),
      previousMinutes: yesterdayActMins,
      targetMinutes: timeframe === 'hours' ? act.dailyTargetMinutes : periodTargetMins,
      pct,
      diffMinutes: actDelta.diffMinutes,
      pctChange: actDelta.pctChange,
      direction: actDelta.direction,
      daysHit,
      totalDays: windowDays,
    };
  });

  const totalMinutes = buckets.reduce((sum, b) => sum + b.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const activeBuckets = buckets.filter((b) => b.minutes > 0);
  const averageMinutesPerActive =
    activeBuckets.length > 0 ? Math.round(totalMinutes / activeBuckets.length) : 0;
  const averageHoursPerBucket =
    buckets.length > 0 ? Math.round((totalMinutes / 60 / buckets.length) * 10) / 10 : 0;

  let peakBucket: ProgressBucket | null = null;
  let maxBucketMinutes = 0;
  let targetHitCount = 0;

  buckets.forEach((b) => {
    if (b.minutes > maxBucketMinutes) {
      maxBucketMinutes = b.minutes;
      peakBucket = b;
    }
    if (b.minutes >= b.targetMinutes * 0.85 && b.minutes > 0) {
      targetHitCount++;
    }
  });

  return {
    activity,
    buckets,
    totalMinutes,
    totalHours,
    averageMinutesPerActive,
    averageHoursPerBucket,
    peakBucket,
    targetHitCount,
    maxBucketMinutes,
    yesterdayComparison,
    activityCards,
  };
}
