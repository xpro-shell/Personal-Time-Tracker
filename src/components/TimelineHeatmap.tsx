import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  Layers,
  Moon,
  PieChart as PieIcon,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { GapItem, TimeEntry } from '../types/tracker';

interface TimelineHeatmapProps {
  entries: TimeEntry[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate?: (date: string) => void;
  gaps: GapItem[];
  onDeleteEntry?: (id: string) => void;
}

type VisualizationMode = 'timeline' | 'pie' | 'candles' | 'stacked';

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({
  entries,
  selectedDate,
  gaps,
  onDeleteEntry,
}) => {
  const [activeView, setActiveView] = useState<VisualizationMode>('timeline');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Filter today's entries
  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.startTime && e.startTime.startsWith(selectedDate));
  }, [entries, selectedDate]);

  // Explicitly iterate through all 24 hours of the selected day
  // Checks overlap for study, break, music, sleep, and lost time
  const day24HourSlots = useMemo(() => {
    return Array.from({ length: 24 }).map((_, h) => {
      let studyMins = 0;
      let breakMins = 0;
      let musicMins = 0;
      let sleepMins = 0;
      const hourEntries: TimeEntry[] = [];

      todayEntries.forEach((entry) => {
        const d = new Date(entry.startTime);
        if (isNaN(d.getTime())) return;
        const startMin = d.getHours() * 60 + d.getMinutes();
        const dur =
          entry.durationMinutes ||
          (entry.type === 'music' ? 180 : entry.type === 'sleep' ? 480 : 0);
        const endMin = startMin + dur;

        const slotStartMin = h * 60;
        const slotEndMin = (h + 1) * 60;

        const overlapStart = Math.max(startMin, slotStartMin);
        const overlapEnd = Math.min(endMin, slotEndMin);

        if (overlapEnd > overlapStart) {
          const overlap = overlapEnd - overlapStart;
          hourEntries.push(entry);
          if (entry.type === 'study' || entry.type === 'content') {
            studyMins += overlap;
          } else if (entry.type === 'break') {
            breakMins += overlap;
          } else if (entry.type === 'music') {
            musicMins += overlap;
          } else if (entry.type === 'sleep') {
            sleepMins += overlap;
          }
        }
      });

      const totalTracked = Math.min(60, studyMins + breakMins + musicMins + sleepMins);
      const isUntracked = totalTracked === 0;

      // Determine primary activity type in this hour
      let primaryType: 'study' | 'break' | 'music' | 'sleep' | 'untracked' = 'untracked';
      if (sleepMins >= 30 || (sleepMins > 0 && sleepMins >= studyMins)) primaryType = 'sleep';
      else if (studyMins >= 15) primaryType = 'study';
      else if (musicMins >= 15) primaryType = 'music';
      else if (breakMins >= 15) primaryType = 'break';
      else if (!isUntracked) {
        if (studyMins > 0) primaryType = 'study';
        else if (musicMins > 0) primaryType = 'music';
        else if (breakMins > 0) primaryType = 'break';
        else if (sleepMins > 0) primaryType = 'sleep';
      }

      return {
        hour: h,
        hourLabel: `${h.toString().padStart(2, '0')}:00`,
        studyMins: Math.min(60, studyMins),
        breakMins: Math.min(60, breakMins),
        musicMins: Math.min(60, musicMins),
        sleepMins: Math.min(60, sleepMins),
        trackedMinutes: totalTracked,
        lostMinutes: Math.max(0, 60 - totalTracked),
        isUntracked,
        primaryType,
        entries: hourEntries,
      };
    });
  }, [todayEntries]);

  // Aggregate daily totals across all 24 hours (1440 minutes total)
  const dailyBreakdown = useMemo(() => {
    let study = 0;
    let brk = 0;
    let music = 0;
    let sleep = 0;

    todayEntries.forEach((e) => {
      const dur = e.durationMinutes || 0;
      if (e.type === 'study' || e.type === 'content') study += dur;
      else if (e.type === 'break') brk += dur;
      else if (e.type === 'music') music += dur;
      else if (e.type === 'sleep') sleep += dur;
    });

    const totalTracked = study + brk + music + sleep;
    const lost = Math.max(0, 1440 - totalTracked);

    return {
      studyMinutes: study,
      studyHours: Math.round((study / 60) * 10) / 10,
      studyPct: Math.round((study / 1440) * 1000) / 10,

      breakMinutes: brk,
      breakHours: Math.round((brk / 60) * 10) / 10,
      breakPct: Math.round((brk / 1440) * 1000) / 10,

      musicMinutes: music,
      musicHours: Math.round((music / 60) * 10) / 10,
      musicPct: Math.round((music / 1440) * 1000) / 10,

      sleepMinutes: sleep,
      sleepHours: Math.round((sleep / 60) * 10) / 10,
      sleepPct: Math.round((sleep / 1440) * 1000) / 10,

      lostMinutes: lost,
      lostHours: Math.round((lost / 60) * 10) / 10,
      lostPct: Math.round((lost / 1440) * 1000) / 10,

      totalTrackedHours: Math.round((totalTracked / 60) * 10) / 10,
    };
  }, [todayEntries]);

  const untrackedLostHours = useMemo(() => {
    return day24HourSlots.filter((s) => s.isUntracked).length;
  }, [day24HourSlots]);

  // Topic distribution
  const topicStats = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.type === 'study' || e.type === 'content') {
        const t = e.topic || 'General Study';
        map[t] = (map[t] || 0) + (e.durationMinutes || 0);
      } else if (e.type === 'music') {
        map['Riyaz (Music)'] = (map['Riyaz (Music)'] || 0) + (e.durationMinutes || 180);
      } else if (e.type === 'sleep') {
        map['Restorative Sleep'] = (map['Restorative Sleep'] || 0) + (e.durationMinutes || 480);
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Calculate 24h x 7 weekday heatmap matrix
  // weekdays: 0=Mon, 1=Tue, ..., 6=Sun
  const heatmapMatrix = useMemo(() => {
    const matrix: { focus: number; sleep: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ focus: 0, sleep: 0 }))
    );

    entries.forEach((e) => {
      if (e.type !== 'study' && e.type !== 'music' && e.type !== 'content' && e.type !== 'sleep')
        return;
      const d = new Date(e.startTime);
      if (isNaN(d.getTime())) return;

      const rawDay = d.getDay();
      const weekdayIdx = rawDay === 0 ? 6 : rawDay - 1;
      const startH = d.getHours();
      const durMins =
        e.durationMinutes || (e.type === 'music' ? 180 : e.type === 'sleep' ? 480 : 30);
      const totalH = durMins / 60;
      const hoursToFill = Math.max(1, Math.ceil(totalH));

      for (let offset = 0; offset < hoursToFill; offset++) {
        const targetH = (startH + offset) % 24;
        const portion = Math.min(1.0, Math.max(0, totalH - offset));
        if (portion > 0) {
          if (e.type === 'sleep') {
            matrix[weekdayIdx][targetH].sleep += Math.round(portion * 10) / 10;
          } else {
            matrix[weekdayIdx][targetH].focus += Math.round(portion * 10) / 10;
          }
        }
      }
    });

    return matrix;
  }, [entries]);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const selectedWeekdayIdx = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const rawDay = dateObj.getDay();
    return rawDay === 0 ? 6 : rawDay - 1;
  }, [selectedDate]);

  const getHeatmapColor = (
    cell: { focus: number; sleep: number },
    isSelectedDay?: boolean
  ) => {
    // If sleep is logged, color indigo (not red!)
    if (cell.sleep > 0) {
      return 'bg-indigo-950/80 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900/80';
    }
    // If untracked, color red to highlight lost time
    if (cell.focus === 0) {
      return isSelectedDay
        ? 'bg-red-950/80 border-red-800 text-red-300 hover:bg-red-900/80 shadow-xs'
        : 'bg-red-950/60 border-red-900/60 text-red-400/40 hover:bg-red-900/70';
    }
    if (cell.focus < 0.5) return 'bg-zinc-800 text-zinc-300 border-zinc-700/60';
    if (cell.focus < 1.0) return 'bg-zinc-700 text-zinc-100 border-zinc-600';
    if (cell.focus < 1.8) return 'bg-zinc-400 text-zinc-950 font-bold border-zinc-300';
    return 'bg-white text-zinc-950 font-bold border-white';
  };

  // SVG Donut Chart Calculation
  // Radius = 70, Circumference = 2 * PI * 70 ≈ 439.82
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutSlices = useMemo(() => {
    const rawSlices = [
      { id: 'study', label: 'Study Focus', hours: dailyBreakdown.studyHours, pct: dailyBreakdown.studyPct, color: '#f4f4f5', strokeColor: '#ffffff' },
      { id: 'sleep', label: 'Restorative Sleep', hours: dailyBreakdown.sleepHours, pct: dailyBreakdown.sleepPct, color: '#6366f1', strokeColor: '#818cf8' },
      { id: 'music', label: 'Riyaz (Music)', hours: dailyBreakdown.musicHours, pct: dailyBreakdown.musicPct, color: '#a855f7', strokeColor: '#c084fc' },
      { id: 'break', label: 'Break Bank', hours: dailyBreakdown.breakHours, pct: dailyBreakdown.breakPct, color: '#f59e0b', strokeColor: '#fbbf24' },
      { id: 'lost', label: 'Lost / Untracked', hours: dailyBreakdown.lostHours, pct: dailyBreakdown.lostPct, color: '#ef4444', strokeColor: '#f87171' },
    ].filter((s) => s.pct > 0);

    let currentOffset = 0;
    return rawSlices.map((slice) => {
      const sliceLength = (slice.pct / 100) * donutCircumference;
      const strokeDasharray = `${sliceLength} ${donutCircumference - sliceLength}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += sliceLength;
      return {
        ...slice,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [dailyBreakdown, donutCircumference]);

  return (
    <div className="space-y-6">
      {/* View Switcher Header Bar */}
      <div className="studio-card p-3.5 bg-gradient-to-r from-[#0d191d] via-[#121216] to-[#121216] border border-cyan-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="label-scandi text-cyan-50">
            Desk Analytics & Visualization
          </span>
          <span className="text-[11px] font-mono text-zinc-400">· {selectedDate}</span>
        </div>

        {/* 4 Presentation Modes: Timeline, Donut/Pie, Candlestick, Stacked */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/90 border border-zinc-800 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveView('timeline')}
            className={`interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'timeline'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 font-semibold shadow-[0_0_14px_-3px_rgba(34,211,238,0.6)]'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline & Heatmap</span>
          </button>

          <button
            onClick={() => setActiveView('pie')}
            className={`interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'pie'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 font-semibold shadow-[0_0_14px_-3px_rgba(34,211,238,0.6)]'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-zinc-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>24h Donut / Pie</span>
          </button>

          <button
            onClick={() => setActiveView('candles')}
            className={`interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'candles'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 font-semibold shadow-[0_0_14px_-3px_rgba(34,211,238,0.6)]'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Session Candlesticks</span>
          </button>

          <button
            onClick={() => setActiveView('stacked')}
            className={`interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'stacked'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-zinc-950 font-semibold shadow-[0_0_14px_-3px_rgba(34,211,238,0.6)]'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hourly Stacked</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 24h Timeline & Heatmap */}
      {activeView === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Daily Chronological Timeline with Gaps & Undo Actions */}
          <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-base font-semibold tracking-tight text-white">
                  Daily Timeline · {selectedDate}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <Moon className="w-3 h-3" /> {dailyBreakdown.sleepHours}h Sleep
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-red-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {untrackedLostHours}h Lost Time (Red)
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{todayEntries.length} blocks logged</span>
              </div>
            </div>

            {/* 24-hour visual progress bar strip: Untracked hours colored RED, Sleep colored Indigo */}
            <div className="relative w-full h-9 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-2">
              {/* Base 24-Hour Grid: Untracked hours in Crimson Red, Sleep in Indigo */}
              <div
                className="absolute inset-0 grid h-full w-full pointer-events-none"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {day24HourSlots.map((slot) => {
                  let bgClass = 'bg-zinc-900/30 border-r-zinc-800/40';
                  if (slot.isUntracked) {
                    bgClass = 'bg-red-950/80 border-r-red-800/60 text-red-400/50';
                  } else if (slot.primaryType === 'sleep') {
                    bgClass = 'bg-indigo-950/80 border-r-indigo-800/60 text-indigo-400/50';
                  }

                  return (
                    <div
                      key={slot.hour}
                      className={`h-full border-r transition-colors flex items-center justify-center ${bgClass}`}
                      title={`${slot.hourLabel} — ${
                        slot.isUntracked
                          ? 'Lost Time: No tracked activities (Red)'
                          : slot.primaryType === 'sleep'
                          ? `Sleep: ${slot.sleepMins}m rest (Indigo)`
                          : `${slot.trackedMinutes}m logged`
                      }`}
                    >
                      {slot.isUntracked && (
                        <span className="text-[8px] font-mono select-none text-red-500/50">·</span>
                      )}
                      {slot.primaryType === 'sleep' && (
                        <Moon className="w-2.5 h-2.5 text-indigo-400/60" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overlaid Logged Sessions with exact minute precision */}
              {todayEntries.map((entry, idx) => {
                const startD = new Date(entry.startTime);
                const startMinutes = startD.getHours() * 60 + startD.getMinutes();
                const leftPct = (startMinutes / 1440) * 100;
                const dur =
                  entry.durationMinutes ||
                  (entry.type === 'music' ? 180 : entry.type === 'sleep' ? 480 : 20);
                const widthPct = Math.max(1, (dur / 1440) * 100);

                let bgClass = 'bg-zinc-400';
                if (entry.type === 'study') bgClass = 'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold';
                if (entry.type === 'break') bgClass = 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold';
                if (entry.type === 'music') bgClass = 'bg-purple-500 hover:bg-purple-400 text-white font-semibold';
                if (entry.type === 'sleep') bgClass = 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold';

                return (
                  <div
                    key={entry.id || idx}
                    className={`absolute top-0.5 bottom-0.5 rounded-xs ${bgClass} cursor-pointer transition-all shadow-sm z-10 flex items-center justify-center overflow-hidden`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${entry.topic || entry.type} (${entry.durationMinutes || dur}m) — Tap below to remove`}
                  >
                    {widthPct > 5 && (
                      <span className="text-[9px] font-mono truncate px-1 font-semibold flex items-center gap-1">
                        {entry.type === 'sleep' && <Moon className="w-2.5 h-2.5 shrink-0" />}
                        {entry.topic || entry.type}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend for Timeline Strip */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 mb-3 px-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-950 border border-red-700/60" />
                  <span className="text-red-400 font-medium">Lost Time / Untracked (Red)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 border border-indigo-400" />
                  <span className="text-indigo-300 font-medium">Sleep (Indigo)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-zinc-100 border border-white" />
                  <span className="text-zinc-300">Study</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  <span className="text-zinc-300">Break</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
                  <span className="text-zinc-300">Riyaz</span>
                </div>
              </div>
              <span className="text-zinc-500">{dailyBreakdown.totalTrackedHours}h tracked today</span>
            </div>

            {/* Hour Axis Markers */}
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-4 px-1">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>24:00</span>
            </div>

            {/* 24-Hour Day Slot Board: Iterating through all 24 hours of selected day */}
            <div className="mb-4 p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    24-Hour Day Inspector ({selectedDate})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    All 24 hours analyzed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-indigo-300 font-bold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50">
                    {dailyBreakdown.sleepHours}h Sleep
                  </span>
                  <span className="text-red-400 font-bold bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                    {untrackedLostHours}h Lost Time (Red)
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300 font-semibold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {24 - untrackedLostHours}h Accounted
                  </span>
                </div>
              </div>

              {/* 24-Hour Slot Matrix iterating 00:00 to 23:00 */}
              <div className="grid grid-cols-6 sm:grid-cols-12 lg:grid-cols-24 gap-1">
                {day24HourSlots.map((slot) => {
                  let slotStyle = 'bg-red-950/75 border-red-800/80 text-red-300 hover:bg-red-900/80';
                  let label = 'LOST';

                  if (!slot.isUntracked) {
                    if (slot.primaryType === 'sleep') {
                      slotStyle =
                        'bg-indigo-950/80 text-indigo-200 border-indigo-600/80 hover:bg-indigo-900';
                      label = 'SLEEP';
                    } else if (slot.primaryType === 'study') {
                      slotStyle =
                        'bg-zinc-100 text-zinc-950 border-white font-bold hover:bg-white';
                      label = `${slot.studyMins}m`;
                    } else if (slot.primaryType === 'music') {
                      slotStyle =
                        'bg-purple-900/70 text-purple-200 border-purple-500 hover:bg-purple-800';
                      label = `${slot.musicMins}m`;
                    } else if (slot.primaryType === 'break') {
                      slotStyle =
                        'bg-amber-600/40 text-amber-200 border-amber-500 hover:bg-amber-600/60';
                      label = `${slot.breakMins}m`;
                    }
                  }

                  return (
                    <div
                      key={slot.hour}
                      className={`p-1.5 rounded border text-center transition-all cursor-default ${slotStyle}`}
                      title={
                        slot.isUntracked
                          ? `Lost Time: ${slot.hourLabel} — No logged or tracked activities (0m)`
                          : `${slot.hourLabel} — ${slot.trackedMinutes}m tracked (${slot.entries.map((e) => e.topic || e.type).join(', ')})`
                      }
                    >
                      <div className="text-[10px] font-mono leading-none mb-1 font-semibold opacity-90">
                        {slot.hour.toString().padStart(2, '0')}
                      </div>
                      <div className="text-[8px] font-mono leading-tight truncate font-bold">
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flagged Timeline Gaps */}
            {gaps.length > 0 && (
              <div className="p-3 mb-4 bg-zinc-950/80 border border-zinc-700/80 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Flagged Gaps in Today's Log ({gaps.length})</span>
                </div>
                <div className="space-y-1">
                  {gaps.map((gap) => (
                    <div
                      key={gap.id}
                      className="text-xs font-mono text-zinc-300 flex items-center justify-between"
                    >
                      <span>{gap.description}</span>
                      <span className="text-emerald-400">-{gap.durationMinutes}m gap</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Logged Sessions List with Undo/Delete buttons */}
            <div>
              <span className="label-scandi text-zinc-400 block mb-2">
                Today's Logged Blocks (Tap to Undo / Remove from Graph)
              </span>

              {todayEntries.length > 0 ? (
                <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  {todayEntries.map((entry) => {
                    const startD = new Date(entry.startTime);
                    const sTime = !isNaN(startD.getTime())
                      ? startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    const endD = entry.endTime
                      ? new Date(entry.endTime)
                      : new Date(startD.getTime() + (entry.durationMinutes || 0) * 60000);
                    const eTime = !isNaN(endD.getTime())
                      ? endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    const durationH = Math.round(((entry.durationMinutes || 0) / 60) * 10) / 10;

                    let dotClass = 'bg-zinc-500';
                    if (entry.type === 'study') dotClass = 'bg-zinc-200';
                    else if (entry.type === 'break') dotClass = 'bg-amber-400';
                    else if (entry.type === 'music') dotClass = 'bg-purple-400';
                    else if (entry.type === 'sleep') dotClass = 'bg-indigo-400';

                    return (
                      <div
                        key={entry.id}
                        className="p-2.5 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                          <span className="text-zinc-200 font-medium">
                            {entry.topic || entry.type}
                          </span>
                          <span className="text-zinc-400">
                            {sTime} → {eTime}
                          </span>
                          <span className="text-zinc-400 tabular-nums">
                            ({entry.durationMinutes || 0}m / {durationH}h)
                          </span>
                        </div>

                        {onDeleteEntry && (
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-800/60 rounded transition-colors cursor-pointer"
                            title="Undo/Remove this entry from the graph"
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
                <p className="text-xs font-mono text-zinc-500">
                  No entries logged for today yet. Use the Desk Command Center or tap Log Sleep.
                </p>
              )}
            </div>
          </div>

          {/* Hourly Focus & Sleep Heatmap (Hour 0-23 by Weekday Mon-Sun) */}
          <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-base font-semibold tracking-tight text-white">
                  Hourly Focus & Sleep Heatmap (Hour × Weekday)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-950 border border-indigo-700" />
                  <span className="text-indigo-300">Sleep (Indigo)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-950 border border-red-700/60" />
                  <span className="text-red-400 font-medium">Lost Time / 0h (Red)</span>
                </div>
                <span className="text-zinc-600">|</span>
                <div className="flex items-center gap-1 text-zinc-500">
                  <span>Focus:</span>
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-zinc-800 border border-zinc-700" title="Low (<0.5h)" />
                    <div className="w-2.5 h-2.5 bg-zinc-700 border border-zinc-600" title="Mid (<1.0h)" />
                    <div className="w-2.5 h-2.5 bg-zinc-400 border border-zinc-300" title="High (<1.8h)" />
                    <div className="w-2.5 h-2.5 bg-white border border-white" title="Peak (1.8h+)" />
                  </div>
                  <span>Peak</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[640px]">
                {/* Header hour markers */}
                <div className="grid grid-cols-[56px_repeat(24,_1fr)] gap-1 mb-1 text-[10px] font-mono text-zinc-500 text-center">
                  <div />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h}>{h.toString().padStart(2, '0')}</div>
                  ))}
                </div>

                {/* Weekday rows */}
                {weekdays.map((dayName, dayIdx) => {
                  const isSelectedDay = dayIdx === selectedWeekdayIdx;
                  return (
                    <div
                      key={dayName}
                      className={`grid grid-cols-[56px_repeat(24,_1fr)] gap-1 mb-1 items-center p-0.5 rounded transition-colors ${
                        isSelectedDay ? 'bg-zinc-900/50 ring-1 ring-zinc-700/60' : ''
                      }`}
                    >
                      <span
                        className={`text-xs font-mono text-right pr-2 flex items-center justify-end gap-1 ${
                          isSelectedDay ? 'text-zinc-100 font-bold' : 'text-zinc-400'
                        }`}
                      >
                        {isSelectedDay && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                            title="Selected Day"
                          />
                        )}
                        {dayName}
                      </span>
                      {Array.from({ length: 24 }).map((_, h) => {
                        const cell = heatmapMatrix[dayIdx][h];
                        return (
                          <div
                            key={h}
                            className={`h-6 rounded-sm border flex items-center justify-center text-[9px] font-mono transition-transform hover:scale-110 ${getHeatmapColor(
                              cell,
                              isSelectedDay
                            )}`}
                            title={`${dayName} at ${h}:00 — ${
                              cell.sleep > 0
                                ? `Sleep: ${Math.round(cell.sleep * 10) / 10}h (Indigo)`
                                : cell.focus > 0
                                ? `${Math.round(cell.focus * 10) / 10} focus hours logged`
                                : 'Lost Time: Untracked / Not Logged (0h — Red)'
                            }`}
                          >
                            {cell.sleep > 0 ? (
                              <Moon className="w-2.5 h-2.5 text-indigo-300" />
                            ) : cell.focus >= 0.5 ? (
                              Math.round(cell.focus * 10) / 10
                            ) : (
                              ''
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 24-Hour Donut / Pie Distribution Chart */}
      {activeView === 'pie' && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-base font-semibold tracking-tight text-white">
                24-Hour Day Distribution Donut (100% of 24h)
              </h3>
            </div>
            <span className="label-scandi text-zinc-500">
              Total Day = 1440 mins (24h)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SVG Interactive Donut Chart */}
            <div className="flex justify-center items-center relative py-4">
              <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r={donutRadius}
                  stroke="#27272a"
                  strokeWidth="28"
                  fill="transparent"
                />

                {/* Slices */}
                {donutSlices.map((slice) => {
                  const isHovered = hoveredSlice === slice.id;
                  return (
                    <circle
                      key={slice.id}
                      cx="100"
                      cy="100"
                      r={donutRadius}
                      stroke={slice.color}
                      strokeWidth={isHovered ? 34 : 28}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      fill="transparent"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                  24h Day
                </span>
                <span className="text-2xl font-mono font-bold text-zinc-100 tabular-nums">
                  {dailyBreakdown.totalTrackedHours}h
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Tracked / Used
                </span>
              </div>
            </div>

            {/* Interactive Breakdown Table & Legend */}
            <div className="space-y-2.5 font-mono text-xs">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-2 font-semibold">
                Category Allocations
              </span>

              {donutSlices.map((slice) => {
                const isHovered = hoveredSlice === slice.id;
                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredSlice(slice.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isHovered
                        ? 'bg-zinc-900 border-zinc-600 scale-[1.02]'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-zinc-200 font-medium">{slice.label}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 font-semibold tabular-nums">
                        {slice.hours}h
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold tabular-nums"
                        style={{
                          backgroundColor: `${slice.color}20`,
                          color: slice.color,
                        }}
                      >
                        {slice.pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Session Candlestick Interval Chart */}
      {activeView === 'candles' && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-base font-semibold tracking-tight text-white">
                Session Candlestick Interval Chart (00:00 to 24:00)
              </h3>
            </div>
            <span className="label-scandi text-zinc-500">
              High/Low span with Open/Close minutes
            </span>
          </div>

          <p className="text-xs font-mono text-zinc-400">
            Each hourly candle visualizes the active session span within that hour. Red candles highlight untracked lost time intervals, while white, purple, amber, and indigo represent your logged sessions.
          </p>

          {/* 24-Hour Candlestick Graph */}
          <div className="relative h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
            {/* Y-Axis Grid Lines: 60m, 45m, 30m, 15m, 0m */}
            <div className="absolute inset-3 pointer-events-none flex flex-col justify-between opacity-15">
              <div className="border-b border-zinc-400 w-full" />
              <div className="border-b border-zinc-400 w-full" />
              <div className="border-b border-zinc-400 w-full" />
              <div className="border-b border-zinc-400 w-full" />
              <div className="border-b border-zinc-400 w-full" />
            </div>

            {/* Candlesticks Grid */}
            <div className="relative z-10 grid grid-cols-24 gap-1 h-48 items-end">
              {day24HourSlots.map((slot) => {
                const totalMins = slot.trackedMinutes;
                const isLost = slot.isUntracked;

                // Height of candle body (scale 0..60 mins to 100%)
                const bodyHeightPct = isLost
                  ? 80
                  : Math.max(15, Math.round((totalMins / 60) * 100));

                let candleColor = 'bg-red-950/80 border-red-600 text-red-300';
                let wickColor = 'bg-red-800';

                if (!isLost) {
                  if (slot.primaryType === 'sleep') {
                    candleColor = 'bg-indigo-600 border-indigo-400 text-white';
                    wickColor = 'bg-indigo-400';
                  } else if (slot.primaryType === 'study') {
                    candleColor = 'bg-zinc-100 border-white text-zinc-950 font-bold';
                    wickColor = 'bg-zinc-300';
                  } else if (slot.primaryType === 'music') {
                    candleColor = 'bg-purple-600 border-purple-400 text-white';
                    wickColor = 'bg-purple-400';
                  } else if (slot.primaryType === 'break') {
                    candleColor = 'bg-amber-500 border-amber-300 text-zinc-950';
                    wickColor = 'bg-amber-400';
                  }
                }

                return (
                  <div
                    key={slot.hour}
                    className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    title={`${slot.hourLabel} — ${
                      isLost
                        ? 'Lost Time Candle: 0m logged'
                        : `${slot.primaryType.toUpperCase()} Candle: ${totalMins}m tracked`
                    }`}
                  >
                    {/* Upper Wick */}
                    <div className={`w-0.5 h-3 ${wickColor} rounded-full`} />

                    {/* Candle Body */}
                    <div
                      className={`w-full rounded-xs border shadow-sm flex items-center justify-center transition-all group-hover:scale-105 ${candleColor}`}
                      style={{ height: `${bodyHeightPct}%` }}
                    >
                      <span className="text-[7px] font-mono leading-none font-bold select-none">
                        {isLost ? '✕' : `${totalMins}`}
                      </span>
                    </div>

                    {/* Lower Wick */}
                    <div className={`w-0.5 h-2 ${wickColor} rounded-full`} />

                    {/* Hour Number */}
                    <span className="text-[8px] font-mono text-zinc-500 mt-1">
                      {slot.hour}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Candlestick Legend */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-red-600" />
                  <span className="text-red-400">Lost Time Candle</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                  <span className="text-indigo-300">Sleep Candle</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-zinc-100" />
                  <span className="text-zinc-200">Study Candle</span>
                </div>
              </div>
              <span className="text-zinc-500">24 Hourly Candlesticks</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Hourly Stacked 24-Hour Bar Chart */}
      {activeView === 'stacked' && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-base font-semibold tracking-tight text-white">
                24-Hour Stacked Hourly Distribution (0 to 60 Minutes per Hour)
              </h3>
            </div>
            <span className="label-scandi text-zinc-500">
              Stack breakdown per hour
            </span>
          </div>

          <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
            {/* 24 Stacked Vertical Bars */}
            <div className="grid grid-cols-24 gap-1 h-48 items-end">
              {day24HourSlots.map((slot) => {
                const sPct = (slot.studyMins / 60) * 100;
                const brkPct = (slot.breakMins / 60) * 100;
                const mPct = (slot.musicMins / 60) * 100;
                const slPct = (slot.sleepMins / 60) * 100;
                const lostPct = (slot.lostMinutes / 60) * 100;

                return (
                  <div
                    key={slot.hour}
                    className="flex flex-col h-full justify-end group relative cursor-pointer"
                    title={`${slot.hourLabel}: Study ${slot.studyMins}m, Sleep ${slot.sleepMins}m, Riyaz ${slot.musicMins}m, Break ${slot.breakMins}m, Lost ${slot.lostMinutes}m`}
                  >
                    <div className="w-full h-full rounded-sm overflow-hidden flex flex-col-reverse bg-zinc-900/40 border border-zinc-800/60 group-hover:border-zinc-500 transition-colors">
                      {/* Study Segment */}
                      {sPct > 0 && (
                        <div
                          className="w-full bg-zinc-100 transition-all"
                          style={{ height: `${sPct}%` }}
                        />
                      )}
                      {/* Sleep Segment */}
                      {slPct > 0 && (
                        <div
                          className="w-full bg-indigo-500 transition-all"
                          style={{ height: `${slPct}%` }}
                        />
                      )}
                      {/* Riyaz Segment */}
                      {mPct > 0 && (
                        <div
                          className="w-full bg-purple-500 transition-all"
                          style={{ height: `${mPct}%` }}
                        />
                      )}
                      {/* Break Segment */}
                      {brkPct > 0 && (
                        <div
                          className="w-full bg-amber-500 transition-all"
                          style={{ height: `${brkPct}%` }}
                        />
                      )}
                      {/* Lost Time Segment */}
                      {lostPct > 0 && (
                        <div
                          className="w-full bg-red-950/90 border-t border-red-800/50 transition-all"
                          style={{ height: `${lostPct}%` }}
                        />
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 text-center mt-1">
                      {slot.hour}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stacked Legend */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-zinc-100" />
                  <span>Study</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                  <span>Sleep</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
                  <span>Riyaz</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  <span>Break</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-950 border border-red-800" />
                  <span className="text-red-400">Lost Time</span>
                </div>
              </div>
              <span className="text-zinc-500">Hourly Stack (0-60m)</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hours per Topic Breakdown */}
      <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-base font-semibold tracking-tight text-white">
              Hours per Topic & Activity
            </h3>
          </div>
          <span className="label-scandi text-zinc-500">
            {topicStats.length} topics tracked
          </span>
        </div>

        {topicStats.length > 0 ? (
          <div className="space-y-3">
            {topicStats.map(([topicName, mins]) => {
              const hours = Math.round((mins / 60) * 10) / 10;
              const maxMinutes = topicStats[0][1] || 1;
              const barWidth = Math.max(5, Math.round((mins / maxMinutes) * 100));

              let barColor = 'bg-zinc-300';
              if (topicName.includes('Sleep')) barColor = 'bg-indigo-400';
              else if (topicName.includes('Music') || topicName.includes('Riyaz')) barColor = 'bg-purple-400';
              else if (topicName.includes('Break')) barColor = 'bg-amber-400';

              return (
                <div key={topicName}>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-200 font-medium">{topicName}</span>
                    <span className="text-zinc-400 tabular-nums">{hours} hours</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs font-mono text-zinc-500">
            No topic data recorded yet. Log sessions with "S on [topic]", "sleep", or import WhatsApp logs.
          </p>
        )}
      </div>
    </div>
  );
};
