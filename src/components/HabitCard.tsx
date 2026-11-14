import confetti from 'canvas-confetti';
import {
  Book,
  CheckCircle2,
  Clock,
  Code,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Music,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { CustomHabit, TimeEntry } from '../types/tracker';

interface HabitCardProps {
  habit: CustomHabit;
  todayEntries: TimeEntry[];
  onToggleHabit: (habit: CustomHabit, options?: {
    startTimeIso?: string;
    endTimeIso?: string;
    durationMinutes?: number;
  }) => void;
  onEditHabit: (habit: CustomHabit) => void;
  selectedDate: string;
}

// Helpers for time arithmetic
function formatTimeHHMM(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function addHoursToHHMM(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const totalMins = (h * 60 + m + Math.round(hours * 60)) % 1440;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function calculateDiffMinutes(startTimeStr: string, endTimeStr: string): number {
  const [h1, m1] = startTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const [h2, m2] = endTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff <= 0) diff += 1440;
  return diff;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayEntries,
  onToggleHabit,
  onEditHabit,
  selectedDate,
}) => {
  // Find logged entry for today matching this habit
  const loggedEntry = todayEntries.find(
    (e) => (e.habitId === habit.id || e.type === habit.entryType || e.topic?.toLowerCase().includes(habit.shortcode.toLowerCase())) &&
           e.startTime && e.startTime.startsWith(selectedDate)
  );

  const isTicked = !!loggedEntry;
  const completedMinutes = todayEntries
    .filter((e) => (e.habitId === habit.id || e.type === habit.entryType || e.topic?.toLowerCase().includes(habit.shortcode.toLowerCase())) &&
                   e.startTime && e.startTime.startsWith(selectedDate))
    .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  // Custom Time Window state
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [startTime, setStartTime] = useState<string>(() => formatTimeHHMM(new Date()));
  const [durationHours, setDurationHours] = useState<number>(habit.defaultDurationHours);
  const [endTime, setEndTime] = useState<string>(() =>
    addHoursToHHMM(formatTimeHHMM(new Date()), habit.defaultDurationHours)
  );

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setEndTime(addHoursToHHMM(newStart, durationHours));
  };

  const handleDurationChange = (newHours: number) => {
    const val = Math.max(0.25, newHours);
    setDurationHours(val);
    setEndTime(addHoursToHHMM(startTime, val));
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const diff = calculateDiffMinutes(startTime, newEnd);
    setDurationHours(Math.round((diff / 60) * 10) / 10);
  };

  const handleQuickTick = () => {
    if (!isTicked) {
      playEarnedChime();
      confetti({
        particleCount: 38,
        spread: 55,
        origin: { y: 0.72 },
        colors: ['#a855f7', '#34d399', '#fbbf24', '#60a5fa', '#ffffff'],
      });
    } else {
      playDeskClick();
    }
    onToggleHabit(habit);
  };

  const handleConfirmCustom = () => {
    playEarnedChime();
    confetti({
      particleCount: 42,
      spread: 60,
      origin: { y: 0.72 },
      colors: ['#a855f7', '#34d399', '#fbbf24', '#60a5fa', '#ffffff'],
    });
    const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
    const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10) || 0);

    const startObj = new Date(`${selectedDate}T00:00:00`);
    startObj.setHours(startH, startM, 0, 0);

    const endObj = new Date(`${selectedDate}T00:00:00`);
    endObj.setHours(endH, endM, 0, 0);
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1); // overnight
    }

    const totalDurationMins = Math.round(durationHours * 60);

    onToggleHabit(habit, {
      startTimeIso: startObj.toISOString(),
      endTimeIso: endObj.toISOString(),
      durationMinutes: totalDurationMins,
    });
    setShowCustomTime(false);
  };

  // Curated addictive studio shades per habit colorTheme
  const THEME_MAP: Record<CustomHabit['colorTheme'], {
    cardBg: string;
    border: string;
    iconBox: string;
    accentText: string;
    glowHex: string;
    btnActive: string;
    btnDefault: string;
    progressFill: string;
  }> = {
    purple: {
      cardBg: 'bg-gradient-to-br from-[#1b1128] via-[#121216] to-[#15101e]',
      border: isTicked ? 'border-purple-400/70 shadow-[0_0_30px_-8px_rgba(168,85,247,0.45)]' : 'border-purple-500/25 hover:border-purple-400/55',
      iconBox: 'bg-purple-500/15 border-purple-500/35',
      accentText: 'text-purple-400',
      glowHex: '#a855f7',
      btnActive: 'bg-purple-500/20 border-purple-400/75 text-purple-100',
      btnDefault: 'bg-purple-500/10 border-purple-500/30 text-purple-100 hover:border-purple-400 hover:bg-purple-500/20',
      progressFill: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-300',
    },
    bronze: {
      cardBg: 'bg-gradient-to-br from-[#21150f] via-[#121215] to-[#17120e]',
      border: isTicked ? 'border-orange-400/70 shadow-[0_0_30px_-8px_rgba(251,146,60,0.45)]' : 'border-orange-500/25 hover:border-orange-400/55',
      iconBox: 'bg-orange-500/15 border-orange-500/35',
      accentText: 'text-orange-400',
      glowHex: '#fb923c',
      btnActive: 'bg-orange-500/20 border-orange-400/75 text-orange-100',
      btnDefault: 'bg-orange-500/10 border-orange-500/30 text-orange-100 hover:border-orange-400 hover:bg-orange-500/20',
      progressFill: 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-300',
    },
    amber: {
      cardBg: 'bg-gradient-to-br from-[#1f170c] via-[#121215] to-[#17130d]',
      border: isTicked ? 'border-amber-400/70 shadow-[0_0_30px_-8px_rgba(245,158,11,0.45)]' : 'border-amber-500/25 hover:border-amber-400/55',
      iconBox: 'bg-amber-500/15 border-amber-500/35',
      accentText: 'text-amber-400',
      glowHex: '#f59e0b',
      btnActive: 'bg-amber-500/20 border-amber-400/75 text-amber-100',
      btnDefault: 'bg-amber-500/10 border-amber-500/30 text-amber-100 hover:border-amber-400 hover:bg-amber-500/20',
      progressFill: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300',
    },
    emerald: {
      cardBg: 'bg-gradient-to-br from-[#0e211a] via-[#121215] to-[#0f1714]',
      border: isTicked ? 'border-emerald-400/75 shadow-[0_0_30px_-8px_rgba(16,185,129,0.45)]' : 'border-emerald-500/25 hover:border-emerald-400/55',
      iconBox: 'bg-emerald-500/15 border-emerald-500/35',
      accentText: 'text-emerald-400',
      glowHex: '#10b981',
      btnActive: 'bg-emerald-500/20 border-emerald-400/75 text-emerald-100',
      btnDefault: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/20',
      progressFill: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300',
    },
    blue: {
      cardBg: 'bg-gradient-to-br from-[#0f192b] via-[#121216] to-[#101520]',
      border: isTicked ? 'border-sky-400/70 shadow-[0_0_30px_-8px_rgba(56,189,248,0.45)]' : 'border-sky-500/25 hover:border-sky-400/55',
      iconBox: 'bg-sky-500/15 border-sky-500/35',
      accentText: 'text-sky-400',
      glowHex: '#38bdf8',
      btnActive: 'bg-sky-500/20 border-sky-400/75 text-sky-100',
      btnDefault: 'bg-sky-500/10 border-sky-500/30 text-sky-100 hover:border-sky-400 hover:bg-sky-500/20',
      progressFill: 'bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300',
    },
    rose: {
      cardBg: 'bg-gradient-to-br from-[#231018] via-[#121215] to-[#1a1015]',
      border: isTicked ? 'border-rose-400/70 shadow-[0_0_30px_-8px_rgba(244,63,94,0.45)]' : 'border-rose-500/25 hover:border-rose-400/55',
      iconBox: 'bg-rose-500/15 border-rose-500/35',
      accentText: 'text-rose-400',
      glowHex: '#f43f5e',
      btnActive: 'bg-rose-500/20 border-rose-400/75 text-rose-100',
      btnDefault: 'bg-rose-500/10 border-rose-500/30 text-rose-100 hover:border-rose-400 hover:bg-rose-500/20',
      progressFill: 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-300',
    },
    indigo: {
      cardBg: 'bg-gradient-to-br from-[#12152c] via-[#121216] to-[#141222]',
      border: isTicked ? 'border-indigo-400/70 shadow-[0_0_30px_-8px_rgba(99,102,241,0.45)]' : 'border-indigo-500/25 hover:border-indigo-400/55',
      iconBox: 'bg-indigo-500/15 border-indigo-500/35',
      accentText: 'text-indigo-400',
      glowHex: '#6366f1',
      btnActive: 'bg-indigo-500/20 border-indigo-400/75 text-indigo-100',
      btnDefault: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/20',
      progressFill: 'bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-300',
    },
  };

  const colorStyles = THEME_MAP[habit.colorTheme] || THEME_MAP.purple;

  const progressPercent = Math.min(100, Math.round((completedMinutes / habit.dailyTargetMinutes) * 100));
  const formatHm = (m: number) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h}h ${mins.toString().padStart(2, '0')}m`;
  };

  const existingTimeWindow = loggedEntry?.startTime
    ? `${new Date(loggedEntry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${
        loggedEntry.endTime
          ? new Date(loggedEntry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'ongoing'
      }`
    : '';

  return (
    <div className={`studio-card p-5 rounded-2xl border overflow-hidden ${colorStyles.cardBg} ${colorStyles.border}`}>
      {/* Corner Glow */}
      <div
        className="pointer-events-none absolute -top-14 -right-14 w-32 h-32 rounded-full blur-3xl opacity-30"
        style={{ background: `radial-gradient(circle, ${colorStyles.glowHex}, transparent 70%)` }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/70 relative">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm ${colorStyles.iconBox}`}>
            {habit.iconType === 'music' && <Music className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'dumbbell' && <Dumbbell className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'book' && <Book className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'flame' && <Flame className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'sparkles' && <Sparkles className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'code' && <Code className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'heart' && <Heart className={`w-4 h-4 ${colorStyles.accentText}`} />}
            {habit.iconType === 'moon' && <Moon className={`w-4 h-4 ${colorStyles.accentText}`} />}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              <span>{habit.name}</span>
            </h3>
            <span className="label-scandi text-zinc-400 block mt-0.5">
              Shortcode · <code className={`font-mono normal-case tracking-normal font-semibold ${colorStyles.accentText}`}>{habit.shortcode}</code>
            </span>
          </div>
        </div>

        <button
          onClick={() => onEditHabit(habit)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Edit Habit Configuration"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quota Progress Bar */}
      <div className="my-4 relative">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="label-scandi text-zinc-400">Daily Quota</span>
          <span className="text-zinc-100 tabular-nums font-semibold">
            {formatHm(completedMinutes)} / {formatHm(habit.dailyTargetMinutes)} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800/90 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 progress-shimmer ${colorStyles.progressFill}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center gap-2 relative">
        <button
          type="button"
          onClick={handleQuickTick}
          className={`interactive-press flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer group ${
            isTicked
              ? `${colorStyles.btnActive} hover:bg-red-950/70 hover:border-red-500 hover:text-red-200`
              : `${colorStyles.btnDefault}`
          }`}
          title={
            isTicked
              ? `Logged today (${existingTimeWindow}). Tap to Undo.`
              : `Tap to track: automatically tracks +${habit.defaultDurationHours}h from current time`
          }
        >
          {isTicked ? (
            <>
              <CheckCircle2 className={`w-4 h-4 ${colorStyles.accentText} group-hover:hidden`} />
              <RotateCcw className="w-4 h-4 text-red-400 hidden group-hover:inline" />
              <span className="group-hover:hidden">Logged ({existingTimeWindow || `${habit.defaultDurationHours}h`})</span>
              <span className="hidden group-hover:inline">Undo / Remove Entry</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Track (Auto +{habit.defaultDurationHours}h)</span>
            </>
          )}
        </button>

        {/* Custom manual / past time selector toggle */}
        <button
          type="button"
          onClick={() => {
            playDeskClick();
            setShowCustomTime((prev) => !prev);
          }}
          className={`interactive-press px-3 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
            showCustomTime
              ? 'bg-emerald-400 text-zinc-950 border-emerald-300'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-600'
          }`}
          title="Forgot to tap on time? Enter custom start/end times with auto-calculated duration"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable Manual Time Selector */}
      {showCustomTime && (
        <div className="mt-4 p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">
              Manual Time Measurement
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Auto-extending duration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block label-scandi text-zinc-500 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={durationHours}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block label-scandi text-zinc-500 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="text-xs font-mono text-zinc-300">
              Window: <span className="text-white font-bold">{startTime} → {endTime}</span> ({durationHours}h)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomTime(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustom}
                className="px-3.5 py-1 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-sm cursor-pointer"
              >
                Log Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
