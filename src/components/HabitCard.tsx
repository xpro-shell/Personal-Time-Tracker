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
    playDeskClick();
    onToggleHabit(habit);
  };

  const handleConfirmCustom = () => {
    playEarnedChime();
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

  // Color theme classes
  const colorStyles = {
    purple: {
      cardBg: 'bg-[#16131f]',
      border: 'border-purple-900/60 hover:border-purple-700/80',
      badge: 'text-purple-300 bg-purple-950/60 border-purple-800/60',
      accentText: 'text-purple-400',
      btnActive: 'bg-purple-900/60 border-purple-500 text-purple-100',
      btnDefault: 'bg-purple-950/40 border-purple-800/60 text-purple-200 hover:bg-purple-900/50',
      progressFill: 'bg-purple-500',
    },
    bronze: {
      cardBg: 'bg-[#181512]',
      border: 'border-amber-900/60 hover:border-amber-700/80',
      badge: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
      accentText: 'text-amber-400',
      btnActive: 'bg-amber-900/60 border-amber-500 text-amber-100',
      btnDefault: 'bg-amber-950/40 border-amber-800/60 text-amber-200 hover:bg-amber-900/50',
      progressFill: 'bg-amber-500',
    },
    amber: {
      cardBg: 'bg-[#171410]',
      border: 'border-amber-900/60 hover:border-amber-600/80',
      badge: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
      accentText: 'text-amber-400',
      btnActive: 'bg-amber-900/60 border-amber-500 text-amber-100',
      btnDefault: 'bg-amber-950/40 border-amber-800/60 text-amber-200 hover:bg-amber-900/50',
      progressFill: 'bg-amber-500',
    },
    emerald: {
      cardBg: 'bg-[#111915]',
      border: 'border-emerald-900/60 hover:border-emerald-700/80',
      badge: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60',
      accentText: 'text-emerald-400',
      btnActive: 'bg-emerald-900/60 border-emerald-500 text-emerald-100',
      btnDefault: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/50',
      progressFill: 'bg-emerald-500',
    },
    blue: {
      cardBg: 'bg-[#111622]',
      border: 'border-blue-900/60 hover:border-blue-700/80',
      badge: 'text-blue-300 bg-blue-950/60 border-blue-800/60',
      accentText: 'text-blue-400',
      btnActive: 'bg-blue-900/60 border-blue-500 text-blue-100',
      btnDefault: 'bg-blue-950/40 border-blue-800/60 text-blue-200 hover:bg-blue-900/50',
      progressFill: 'bg-blue-500',
    },
    rose: {
      cardBg: 'bg-[#1c1214]',
      border: 'border-rose-900/60 hover:border-rose-700/80',
      badge: 'text-rose-300 bg-rose-950/60 border-rose-800/60',
      accentText: 'text-rose-400',
      btnActive: 'bg-rose-900/60 border-rose-500 text-rose-100',
      btnDefault: 'bg-rose-950/40 border-rose-800/60 text-rose-200 hover:bg-rose-900/50',
      progressFill: 'bg-rose-500',
    },
    indigo: {
      cardBg: 'bg-[#111322]',
      border: 'border-indigo-900/60 hover:border-indigo-700/80',
      badge: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60',
      accentText: 'text-indigo-400',
      btnActive: 'bg-indigo-900/60 border-indigo-500 text-indigo-100',
      btnDefault: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200 hover:bg-indigo-900/50',
      progressFill: 'bg-indigo-500',
    },
  }[habit.colorTheme] || {
    cardBg: 'bg-[#16131f]',
    border: 'border-purple-900/60 hover:border-purple-700/80',
    badge: 'text-purple-300 bg-purple-950/60 border-purple-800/60',
    accentText: 'text-purple-400',
    btnActive: 'bg-purple-900/60 border-purple-500 text-purple-100',
    btnDefault: 'bg-purple-950/40 border-purple-800/60 text-purple-200 hover:bg-purple-900/50',
    progressFill: 'bg-purple-500',
  };

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
    <div className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${colorStyles.cardBg} ${colorStyles.border}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center shadow-sm">
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
            <h3 className="font-display text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <span>{habit.name}</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              Shortcode · <code className={colorStyles.accentText}>{habit.shortcode}</code>
            </span>
          </div>
        </div>

        <button
          onClick={() => onEditHabit(habit)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
          title="Edit Habit Configuration"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quota Progress Bar */}
      <div className="my-4">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-zinc-400">Daily Quota</span>
          <span className="text-zinc-200 tabular-nums font-semibold">
            {formatHm(completedMinutes)} / {formatHm(habit.dailyTargetMinutes)} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${colorStyles.progressFill}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleQuickTick}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer group ${
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:hidden" />
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
          className={`px-3 py-2 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
            showCustomTime
              ? 'bg-zinc-100 text-zinc-950 border-white'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
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
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={durationHours}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                End Time (Calculated)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400 font-semibold"
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
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustom}
                className="px-3.5 py-1 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors shadow-sm cursor-pointer"
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
