import { formatLocalYMD } from '../components/DateNavigator';
import {
  CustomHabit,
  TimeEntry,
  UserProfile,
  VaultEntry,
} from '../types/tracker';
import {
  ActiveDeskTelemetry,
  ActivityFilterId,
  buildEffectiveEntriesWithDesk,
  entryMatchesActivity,
  formatMinutesHm,
  getActivityOptions,
} from './progressAnalytics';
import { getEntryAssignedDate } from './sessionRollover';

export interface PeriodGrowthMetric {
  currentMinutes: number;
  previousMinutes: number;
  diffMinutes: number;
  pctChange: number | null; // null if prior period had 0 minutes
  direction: 'up' | 'down' | 'flat';
}

export interface ActivitySummaryMetric {
  id: ActivityFilterId;
  label: string;
  dailyTargetMinutes: number;
  todayMinutes: number;
  yesterdayMinutes: number;
  dayPctChange: number | null;
  last7DaysMinutes: number;
  prev7DaysMinutes: number;
  weekPctChange: number | null;
  last30DaysMinutes: number;
  allTimeMinutes: number;
  allTimeSessions: number;
}

export interface GrowthAnalyticsSnapshot {
  generatedAt: string;
  selectedDate: string;
  profile: {
    displayName: string;
    level: number;
    totalXp: number;
    currentStreak: number;
  };
  today: {
    date: string;
    totalActivityMinutes: number;
    activeDeskMinutes: number;
    isDeskLoggedIn: boolean;
    sessionCount: number;
  };
  yesterday: {
    date: string;
    totalActivityMinutes: number;
    activeDeskMinutes: number;
  };
  dayOverDay: PeriodGrowthMetric;
  rolling7Days: {
    currentRange: string;
    previousRange: string;
    overall: PeriodGrowthMetric;
    activeDesk: PeriodGrowthMetric;
  };
  calendarWeek: {
    currentRange: string;
    previousRange: string;
    overall: PeriodGrowthMetric;
    activeDesk: PeriodGrowthMetric;
  };
  rolling30Days: {
    currentRange: string;
    previousRange: string;
    overall: PeriodGrowthMetric;
    activeDesk: PeriodGrowthMetric;
  };
  allTime: {
    firstEntryDate: string | null;
    lastEntryDate: string | null;
    activeDaysCount: number;
    totalSessionsCount: number;
    totalActivityMinutes: number;
    totalActiveDeskMinutes: number;
    bestDay: { date: string; minutes: number } | null;
    peakHour: { hour: number; label: string; minutes: number } | null;
  };
  vault: {
    thisWeekLostHours: number;
    pastLostHours: number;
    totalLostHours: number;
    entriesCount: number;
  };
  achievementsCount: number;
  activities: ActivitySummaryMetric[];
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function addDaysYmd(ymd: string, delta: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + delta);
  return formatLocalYMD(d);
}

function getSafeEntryMinutes(e: TimeEntry): number {
  if (
    typeof e.durationMinutes === 'number' &&
    Number.isFinite(e.durationMinutes) &&
    e.durationMinutes > 0
  ) {
    return e.durationMinutes;
  }
  if (e.startTime && e.endTime) {
    const s = new Date(e.startTime).getTime();
    const en = new Date(e.endTime).getTime();
    if (Number.isFinite(s) && Number.isFinite(en) && en > s) {
      return Math.round((en - s) / 60000);
    }
  }
  if (e.type === 'music') return 180;
  if (e.type === 'sleep') return 480;
  return 0;
}

function computeAccurateGrowth(currentMinutes: number, previousMinutes: number): PeriodGrowthMetric {
  const diffMinutes = Math.round(currentMinutes - previousMinutes);
  const direction: 'up' | 'down' | 'flat' =
    diffMinutes > 0 ? 'up' : diffMinutes < 0 ? 'down' : 'flat';

  if (previousMinutes <= 0) {
    return {
      currentMinutes: Math.round(currentMinutes),
      previousMinutes: 0,
      diffMinutes,
      pctChange: null,
      direction,
    };
  }

  const pct = Math.round(((currentMinutes - previousMinutes) / previousMinutes) * 1000) / 10;
  return {
    currentMinutes: Math.round(currentMinutes),
    previousMinutes: Math.round(previousMinutes),
    diffMinutes,
    pctChange: pct,
    direction,
  };
}

function sumMatchingMinutes(
  entries: TimeEntry[],
  filterId: ActivityFilterId,
  habits: CustomHabit[],
  startYmd?: string,
  endYmd?: string
): { minutes: number; count: number } {
  let minutes = 0;
  let count = 0;
  for (const e of entries) {
    if (!entryMatchesActivity(e, filterId, habits)) continue;
    const ymd = getEntryAssignedDate(e);
    if (!ymd) continue;
    if (startYmd && ymd < startYmd) continue;
    if (endYmd && ymd > endYmd) continue;
    const m = getSafeEntryMinutes(e);
    minutes += m;
    count++;
  }
  return { minutes: Math.round(minutes), count };
}

export function buildGrowthAnalyticsSnapshot(params: {
  entries: TimeEntry[];
  habits: CustomHabit[];
  vaultEntries: VaultEntry[];
  achievementsCount: number;
  profile: UserProfile;
  selectedDate: string;
  activeDesk?: ActiveDeskTelemetry;
}): GrowthAnalyticsSnapshot {
  const {
    entries,
    habits,
    vaultEntries,
    achievementsCount,
    profile,
    selectedDate,
    activeDesk,
  } = params;

  const effectiveEntries = buildEffectiveEntriesWithDesk(entries, activeDesk);
  const activityOptions = getActivityOptions(habits).filter((a) => a.id !== 'all');

  const yesterdayYmd = addDaysYmd(selectedDate, -1);
  const weekStart7 = addDaysYmd(selectedDate, -6);
  const prevWeekStart7 = addDaysYmd(selectedDate, -13);
  const prevWeekEnd7 = addDaysYmd(selectedDate, -7);

  // Calendar weeks (Mon -> Sun)
  const anchor = parseYmd(selectedDate);
  const dow = anchor.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const calWeekStart = formatLocalYMD(
    new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + diffToMon)
  );
  const calWeekEnd = addDaysYmd(calWeekStart, 6);
  const prevCalWeekStart = addDaysYmd(calWeekStart, -7);
  const prevCalWeekEnd = addDaysYmd(calWeekStart, -1);

  // 30-day rolling
  const monthStart30 = addDaysYmd(selectedDate, -29);
  const prevMonthStart30 = addDaysYmd(selectedDate, -59);
  const prevMonthEnd30 = addDaysYmd(selectedDate, -30);

  const todayAll = sumMatchingMinutes(effectiveEntries, 'all', habits, selectedDate, selectedDate);
  const todayDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, selectedDate, selectedDate);
  const yestAll = sumMatchingMinutes(effectiveEntries, 'all', habits, yesterdayYmd, yesterdayYmd);
  const yestDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, yesterdayYmd, yesterdayYmd);

  const wCurrAll = sumMatchingMinutes(effectiveEntries, 'all', habits, weekStart7, selectedDate);
  const wPrevAll = sumMatchingMinutes(effectiveEntries, 'all', habits, prevWeekStart7, prevWeekEnd7);
  const wCurrDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, weekStart7, selectedDate);
  const wPrevDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, prevWeekStart7, prevWeekEnd7);

  const cwCurrAll = sumMatchingMinutes(effectiveEntries, 'all', habits, calWeekStart, calWeekEnd);
  const cwPrevAll = sumMatchingMinutes(effectiveEntries, 'all', habits, prevCalWeekStart, prevCalWeekEnd);
  const cwCurrDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, calWeekStart, calWeekEnd);
  const cwPrevDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, prevCalWeekStart, prevCalWeekEnd);

  const mCurrAll = sumMatchingMinutes(effectiveEntries, 'all', habits, monthStart30, selectedDate);
  const mPrevAll = sumMatchingMinutes(effectiveEntries, 'all', habits, prevMonthStart30, prevMonthEnd30);
  const mCurrDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, monthStart30, selectedDate);
  const mPrevDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits, prevMonthStart30, prevMonthEnd30);

  // All-time aggregations
  const allAll = sumMatchingMinutes(effectiveEntries, 'all', habits);
  const allDesk = sumMatchingMinutes(effectiveEntries, 'desk', habits);

  const dayTotalsMap = new Map<string, number>();
  const hourTotals = new Array<number>(24).fill(0);
  const distinctDays = new Set<string>();
  let firstEntryDate: string | null = null;
  let lastEntryDate: string | null = null;

  for (const e of effectiveEntries) {
    if (e.type === 'day_boundary') continue;
    const d = new Date(e.startTime);
    const ymd = getEntryAssignedDate(e);
    if (!ymd || isNaN(d.getTime())) continue;
    const mins = getSafeEntryMinutes(e);
    distinctDays.add(ymd);
    if (!firstEntryDate || ymd < firstEntryDate) firstEntryDate = ymd;
    if (!lastEntryDate || ymd > lastEntryDate) lastEntryDate = ymd;

    if (e.type !== 'desk') {
      dayTotalsMap.set(ymd, (dayTotalsMap.get(ymd) || 0) + mins);
      const hr = d.getHours();
      hourTotals[hr] += mins;
    }
  }

  let bestDay: { date: string; minutes: number } | null = null;
  for (const [date, minutes] of dayTotalsMap.entries()) {
    if (!bestDay || minutes > bestDay.minutes) {
      bestDay = { date, minutes };
    }
  }

  let peakHour: { hour: number; label: string; minutes: number } | null = null;
  for (let h = 0; h < 24; h++) {
    if (hourTotals[h] > 0 && (!peakHour || hourTotals[h] > peakHour.minutes)) {
      peakHour = {
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00 – ${((h + 1) % 24).toString().padStart(2, '0')}:00`,
        minutes: Math.round(hourTotals[h]),
      };
    }
  }

  // Vault breakdown
  let thisWeekLostHours = 0;
  let pastLostHours = 0;
  for (const v of vaultEntries) {
    const hrs = v.hoursLost || 0;
    let ymd = v.date || '';
    if (ymd.length > 10) {
      const parsed = new Date(ymd);
      if (!isNaN(parsed.getTime())) ymd = formatLocalYMD(parsed);
    }
    if (ymd >= calWeekStart && ymd <= calWeekEnd) {
      thisWeekLostHours += hrs;
    } else {
      pastLostHours += hrs;
    }
  }

  // Per-activity summary
  const activities: ActivitySummaryMetric[] = activityOptions.map((act) => {
    const t = sumMatchingMinutes(effectiveEntries, act.id, habits, selectedDate, selectedDate).minutes;
    const y = sumMatchingMinutes(effectiveEntries, act.id, habits, yesterdayYmd, yesterdayYmd).minutes;
    const w7 = sumMatchingMinutes(effectiveEntries, act.id, habits, weekStart7, selectedDate).minutes;
    const pw7 = sumMatchingMinutes(effectiveEntries, act.id, habits, prevWeekStart7, prevWeekEnd7).minutes;
    const m30 = sumMatchingMinutes(effectiveEntries, act.id, habits, monthStart30, selectedDate).minutes;
    const all = sumMatchingMinutes(effectiveEntries, act.id, habits);

    return {
      id: act.id,
      label: act.label,
      dailyTargetMinutes: act.dailyTargetMinutes,
      todayMinutes: t,
      yesterdayMinutes: y,
      dayPctChange: computeAccurateGrowth(t, y).pctChange,
      last7DaysMinutes: w7,
      prev7DaysMinutes: pw7,
      weekPctChange: computeAccurateGrowth(w7, pw7).pctChange,
      last30DaysMinutes: m30,
      allTimeMinutes: all.minutes,
      allTimeSessions: all.count,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    selectedDate,
    profile: {
      displayName: profile.displayName || 'Focus Pilot',
      level: profile.level || 1,
      totalXp: profile.totalXp || 0,
      currentStreak: profile.currentStreak || 1,
    },
    today: {
      date: selectedDate,
      totalActivityMinutes: todayAll.minutes,
      activeDeskMinutes: todayDesk.minutes,
      isDeskLoggedIn: !!activeDesk?.isDeskLoggedIn,
      sessionCount: todayAll.count,
    },
    yesterday: {
      date: yesterdayYmd,
      totalActivityMinutes: yestAll.minutes,
      activeDeskMinutes: yestDesk.minutes,
    },
    dayOverDay: computeAccurateGrowth(todayAll.minutes, yestAll.minutes),
    rolling7Days: {
      currentRange: `${weekStart7} to ${selectedDate}`,
      previousRange: `${prevWeekStart7} to ${prevWeekEnd7}`,
      overall: computeAccurateGrowth(wCurrAll.minutes, wPrevAll.minutes),
      activeDesk: computeAccurateGrowth(wCurrDesk.minutes, wPrevDesk.minutes),
    },
    calendarWeek: {
      currentRange: `${calWeekStart} to ${calWeekEnd}`,
      previousRange: `${prevCalWeekStart} to ${prevCalWeekEnd}`,
      overall: computeAccurateGrowth(cwCurrAll.minutes, cwPrevAll.minutes),
      activeDesk: computeAccurateGrowth(cwCurrDesk.minutes, cwPrevDesk.minutes),
    },
    rolling30Days: {
      currentRange: `${monthStart30} to ${selectedDate}`,
      previousRange: `${prevMonthStart30} to ${prevMonthEnd30}`,
      overall: computeAccurateGrowth(mCurrAll.minutes, mPrevAll.minutes),
      activeDesk: computeAccurateGrowth(mCurrDesk.minutes, mPrevDesk.minutes),
    },
    allTime: {
      firstEntryDate,
      lastEntryDate,
      activeDaysCount: distinctDays.size,
      totalSessionsCount: allAll.count,
      totalActivityMinutes: allAll.minutes,
      totalActiveDeskMinutes: allDesk.minutes,
      bestDay,
      peakHour,
    },
    vault: {
      thisWeekLostHours: Math.round(thisWeekLostHours * 10) / 10,
      pastLostHours: Math.round(pastLostHours * 10) / 10,
      totalLostHours: Math.round((thisWeekLostHours + pastLostHours) * 10) / 10,
      entriesCount: vaultEntries.length,
    },
    achievementsCount,
    activities,
  };
}

function fmtPct(pct: number | null, curr: number, prev: number): string {
  if (pct === null) {
    if (curr === 0 && prev === 0) return '0% (no data in either period)';
    return `+100% baseline (new activity — prior period had 0m)`;
  }
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

/**
 * Deterministic 100% accurate local analyzer fallback & instant calculator
 */
export function answerGrowthQuestionLocally(
  rawQuestion: string,
  snap: GrowthAnalyticsSnapshot
): string {
  const q = rawQuestion.toLowerCase().trim();

  // Check if user asked about a specific activity
  const matchedAct = snap.activities.find((a) => {
    const label = a.label.toLowerCase();
    const firstWord = label.split(' ')[0];
    return (
      q.includes(label) ||
      (firstWord.length >= 3 && q.includes(firstWord)) ||
      (a.id === 'desk' && (q.includes('desk') || q.includes('attendance') || q.includes('logged in'))) ||
      (a.id === 'life' && (q.includes('tv') || q.includes('leisure') || q.includes('movie') || q.includes('outside')))
    );
  });

  if (matchedAct) {
    const weekDelta = fmtPct(
      matchedAct.weekPctChange,
      matchedAct.last7DaysMinutes,
      matchedAct.prev7DaysMinutes
    );
    const dayDelta = fmtPct(
      matchedAct.dayPctChange,
      matchedAct.todayMinutes,
      matchedAct.yesterdayMinutes
    );

    return [
      `**${matchedAct.label} · Exact Telemetry**`,
      `• Last 7 Days Growth: **${weekDelta}** (${formatMinutesHm(matchedAct.last7DaysMinutes)} vs ${formatMinutesHm(matchedAct.prev7DaysMinutes)} prior 7d)`,
      `• Selected Day (${snap.today.date}): **${formatMinutesHm(matchedAct.todayMinutes)}** (${dayDelta} vs yesterday's ${formatMinutesHm(matchedAct.yesterdayMinutes)})`,
      `• Last 30 Days: **${formatMinutesHm(matchedAct.last30DaysMinutes)}**`,
      `• All-Time Total: **${formatMinutesHm(matchedAct.allTimeMinutes)}** across **${matchedAct.allTimeSessions}** logged sessions`,
    ].join('\n');
  }

  // 1-week / 7-day percentage growth question
  if (
    q.includes('week') ||
    q.includes('7 day') ||
    q.includes('7d') ||
    q.includes('%') ||
    q.includes('percent') ||
    q.includes('growth') ||
    q.includes('progress')
  ) {
    const w = snap.rolling7Days.overall;
    const d = snap.rolling7Days.activeDesk;
    const topMover = [...snap.activities]
      .filter((a) => a.id !== 'desk' && (a.last7DaysMinutes > 0 || a.prev7DaysMinutes > 0))
      .sort((a, b) => (b.last7DaysMinutes - b.prev7DaysMinutes) - (a.last7DaysMinutes - a.prev7DaysMinutes))[0];

    const lines = [
      `**1-Week (7-Day) Growth Report** (${snap.rolling7Days.currentRange})`,
      `• Tracked Activities Growth: **${fmtPct(w.pctChange, w.currentMinutes, w.previousMinutes)}**`,
      `  Current 7d: **${formatMinutesHm(w.currentMinutes)}** vs Prior 7d: **${formatMinutesHm(w.previousMinutes)}** (${w.diffMinutes >= 0 ? '+' : '-'}${formatMinutesHm(Math.abs(w.diffMinutes))})`,
      `• Active Desk Attendance Growth: **${fmtPct(d.pctChange, d.currentMinutes, d.previousMinutes)}** (${formatMinutesHm(d.currentMinutes)} vs ${formatMinutesHm(d.previousMinutes)})`,
    ];

    if (topMover) {
      lines.push(
        `• Strongest Activity: **${topMover.label}** at **${formatMinutesHm(topMover.last7DaysMinutes)}** (${fmtPct(topMover.weekPctChange, topMover.last7DaysMinutes, topMover.prev7DaysMinutes)})`
      );
    }

    const activeBreakdown = snap.activities
      .filter((a) => a.last7DaysMinutes > 0)
      .map((a) => `${a.label}: ${formatMinutesHm(a.last7DaysMinutes)} (${fmtPct(a.weekPctChange, a.last7DaysMinutes, a.prev7DaysMinutes)})`);

    if (activeBreakdown.length > 0) {
      lines.push(`\n**7-Day Breakdown:**\n• ${activeBreakdown.join('\n• ')}`);
    }

    return lines.join('\n');
  }

  // Yesterday / Today comparison
  if (q.includes('yesterday') || q.includes('today')) {
    const dod = snap.dayOverDay;
    return [
      `**Today vs Yesterday (${snap.today.date} vs ${snap.yesterday.date})**`,
      `• Activity Growth: **${fmtPct(dod.pctChange, dod.currentMinutes, dod.previousMinutes)}** (${formatMinutesHm(dod.currentMinutes)} vs ${formatMinutesHm(dod.previousMinutes)})`,
      `• Active Desk Time: **${formatMinutesHm(snap.today.activeDeskMinutes)}** today vs **${formatMinutesHm(snap.yesterday.activeDeskMinutes)}** yesterday`,
      `• Sessions Logged Today: **${snap.today.sessionCount}**`,
    ].join('\n');
  }

  // Month / 30-day
  if (q.includes('month') || q.includes('30')) {
    const m = snap.rolling30Days.overall;
    return [
      `**30-Day Growth Report** (${snap.rolling30Days.currentRange})`,
      `• Growth vs Prior 30 Days: **${fmtPct(m.pctChange, m.currentMinutes, m.previousMinutes)}**`,
      `• Last 30 Days Logged: **${formatMinutesHm(m.currentMinutes)}** vs **${formatMinutesHm(m.previousMinutes)}**`,
      `• 30-Day Active Desk Time: **${formatMinutesHm(snap.rolling30Days.activeDesk.currentMinutes)}**`,
    ].join('\n');
  }

  // Vault / Lost Time
  if (q.includes('vault') || q.includes('lost') || q.includes('deficit')) {
    return [
      `**Vault Status**`,
      `• This Week Lost Time: **${snap.vault.thisWeekLostHours}h**`,
      `• Past Vault Lost Time: **${snap.vault.pastLostHours}h**`,
      `• All-Time Vault Total: **${snap.vault.totalLostHours}h** (${snap.vault.entriesCount} records)`,
    ].join('\n');
  }

  // All-time / General Overview / Profile Stats
  const topAllTime = [...snap.activities]
    .filter((a) => a.allTimeMinutes > 0)
    .sort((a, b) => b.allTimeMinutes - a.allTimeMinutes)
    .slice(0, 5)
    .map((a) => `${a.label}: **${formatMinutesHm(a.allTimeMinutes)}** (${a.allTimeSessions} sessions)`);

  return [
    `**All-Time Tracker Overview · ${snap.profile.displayName} (Lv ${snap.profile.level})**`,
    `• Total Tracked Activity Time: **${formatMinutesHm(snap.allTime.totalActivityMinutes)}** across **${snap.allTime.totalSessionsCount}** sessions (${snap.allTime.activeDaysCount} active days)`,
    `• Total Active Desk Time: **${formatMinutesHm(snap.allTime.totalActiveDeskMinutes)}**`,
    `• 1-Week Overall Growth: **${fmtPct(snap.rolling7Days.overall.pctChange, snap.rolling7Days.overall.currentMinutes, snap.rolling7Days.overall.previousMinutes)}** (${formatMinutesHm(snap.rolling7Days.overall.currentMinutes)} in last 7d)`,
    `• Player Rank Stats: **Lv ${snap.profile.level}** · **${snap.profile.totalXp} XP** · **${snap.profile.currentStreak}-day streak** · **${snap.achievementsCount} achievements**`,
    snap.allTime.bestDay
      ? `• Best Single Day: **${snap.allTime.bestDay.date}** (**${formatMinutesHm(snap.allTime.bestDay.minutes)}**)`
      : `• Best Single Day: Log your first session to unlock`,
    snap.allTime.peakHour
      ? `• Peak Productivity Hour: **${snap.allTime.peakHour.label}** (**${formatMinutesHm(snap.allTime.peakHour.minutes)}**)`
      : null,
    `• Vault Lost Time: **${snap.vault.thisWeekLostHours}h** this week / **${snap.vault.totalLostHours}h** all-time`,
    topAllTime.length > 0 ? `\n**Top All-Time Activities:**\n• ${topAllTime.join('\n• ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
