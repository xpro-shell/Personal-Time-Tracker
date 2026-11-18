import { BarChart2, CheckCircle2, Clock, Moon, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { TimeEntry } from '../types/tracker';

interface SleepTrackerCardProps {
  sleepMinutesToday: number;
  targetSleepMinutes?: number; // default 480m (8h)
  isSleepActive: boolean;
  isSessionPaused?: boolean;
  activeSleepDurationSeconds: number;
  todaySleepEntry?: TimeEntry | null;
  onStartSleep: () => void;
  onStopSleep: () => void;
  onPauseSession?: () => void;
  onResumeSession?: () => void;
  onLogCustomSleep: (options: {
    startTimeIso: string;
    endTimeIso: string;
    durationMinutes: number;
    replaceExisting?: boolean;
  }) => void;
  onUndoSleep?: (id: string) => void;
  onOpenProgress?: () => void;
  selectedDate: string; // YYYY-MM-DD
}

function formatHHMM(d: Date): string {
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

export const SleepTrackerCard: React.FC<SleepTrackerCardProps> = ({
  sleepMinutesToday,
  targetSleepMinutes = 480, // 8h target
  isSleepActive,
  isSessionPaused = false,
  activeSleepDurationSeconds,
  todaySleepEntry,
  onStartSleep,
  onStopSleep,
  onPauseSession,
  onResumeSession,
  onLogCustomSleep,
  onUndoSleep,
  onOpenProgress,
  selectedDate,
}) => {
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepStart, setSleepStart] = useState('01:00');
  const [sleepDurationHours, setSleepDurationHours] = useState(9);
  const [sleepEnd, setSleepEnd] = useState('10:00');
  const [replaceExisting, setReplaceExisting] = useState(false);

  const totalEffectiveMinutes =
    sleepMinutesToday + (isSleepActive ? Math.floor(activeSleepDurationSeconds / 60) : 0);
  const hoursSlept = Math.round((totalEffectiveMinutes / 60) * 10) / 10;
  const targetHours = Math.round((targetSleepMinutes / 60) * 10) / 10;
  const progressPct = Math.min(100, Math.round((totalEffectiveMinutes / targetSleepMinutes) * 100));

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyPreset = (s: string, durH: number) => {
    setSleepStart(s);
    setSleepDurationHours(durH);
    setSleepEnd(addHoursToHHMM(s, durH));
  };

  const handleStartChange = (s: string) => {
    if (!s) return;
    setSleepStart(s);
    setSleepEnd(addHoursToHHMM(s, sleepDurationHours));
  };

  const handleDurationChange = (durH: number) => {
    const valid = Math.max(0.5, durH);
    setSleepDurationHours(valid);
    setSleepEnd(addHoursToHHMM(sleepStart, valid));
  };

  const handleEndChange = (e: string) => {
    if (!e) return;
    setSleepEnd(e);
    const diff = calculateDiffMinutes(sleepStart, e);
    const durH = Math.round((diff / 60) * 10) / 10;
    setSleepDurationHours(durH);
  };

  const handleConfirmSleep = () => {
    playDeskClick();

    const [sH, sM] = sleepStart.split(':').map((v) => parseInt(v, 10) || 0);
    const [y, m, d] = selectedDate.split('-').map(Number);
    // Construct strictly in local calendar date so 01:00 -> 10:00 always anchors cleanly to selectedDate
    const startDate = new Date(y, m - 1, d, sH, sM, 0, 0);

    const durMins = Math.max(15, Math.round(sleepDurationHours * 60));
    const endDate = new Date(startDate.getTime() + durMins * 60000);

    onLogCustomSleep({
      startTimeIso: startDate.toISOString(),
      endTimeIso: endDate.toISOString(),
      durationMinutes: durMins,
      replaceExisting,
    });

    playEarnedChime();
    setShowSleepModal(false);
  };

  // Determine latest sleep window string
  const existingSleepWindow = todaySleepEntry
    ? (() => {
        const s = new Date(todaySleepEntry.startTime);
        const durM = todaySleepEntry.durationMinutes || 480;
        const e = todaySleepEntry.endTime
          ? new Date(todaySleepEntry.endTime)
          : new Date(s.getTime() + durM * 60000);

        const sStr = !isNaN(s.getTime()) ? formatHHMM(s) : '--:--';
        const eStr = !isNaN(e.getTime()) ? formatHHMM(e) : '--:--';
        return `${sStr} → ${eStr}`;
      })()
    : null;

  return (
    <div
      className={`studio-card p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
        isSleepActive
          ? 'bg-gradient-to-br from-[#131936] via-[#121320] to-[#121216] border-indigo-400/75 shadow-[0_0_38px_-10px_rgba(99,102,241,0.5)]'
          : hoursSlept >= targetHours
          ? 'bg-gradient-to-br from-[#121730] via-[#12121a] to-[#121216] border-indigo-400/45 shadow-[0_12px_34px_-16px_rgba(99,102,241,0.35)]'
          : 'bg-gradient-to-br from-[#101426] via-[#121216] to-[#13111c] border-indigo-500/20 hover:border-indigo-400/50'
      }`}
    >
      {/* Subtle Indigo Night Glow */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
                Restorative Sleep
              </h3>
              <span className="label-scandi text-indigo-300/75 block mt-0.5">
                Anytime Sleep & Nap Logger
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {todaySleepEntry && onUndoSleep && (
              <button
                type="button"
                onClick={() => onUndoSleep(todaySleepEntry.id)}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Undo logged sleep"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            {onOpenProgress && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  onOpenProgress();
                }}
                className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-400/60 text-indigo-300 hover:text-white transition-all cursor-pointer"
                title="View Sleep progress graph (Hours, Weeks, Months, Years)"
                aria-label="View Sleep progress graph"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setShowSleepModal((prev) => !prev);
              }}
              className="interactive-press flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-indigo-500/15 border border-indigo-500/35 text-indigo-200 hover:border-indigo-400 hover:text-white transition-all cursor-pointer"
            >
              <Clock className="w-3 h-3 text-indigo-300" />
              <span>Log Sleep</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Display */}
        <div className="my-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
              {hoursSlept}
              <span className="text-sm font-normal text-zinc-400 ml-1">/ {targetHours}h</span>
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-0.5">
              {existingSleepWindow ? (
                <span className="text-indigo-300">Logged Window: {existingSleepWindow}</span>
              ) : (
                <span>Target: 8.0 hours restorative rest</span>
              )}
            </div>
          </div>

          {/* Active Live Sleep Timer or Status Badge */}
          {isSleepActive ? (
            <div className="text-right">
              <span
                className={`label-scandi block ${
                  isSessionPaused ? 'text-amber-300' : 'text-indigo-300 animate-pulse'
                }`}
              >
                {isSessionPaused ? 'Sleep Paused' : 'Sleeping Active'}
              </span>
              <div className="text-lg font-mono font-bold text-indigo-200 tabular-nums">
                {formatTimer(activeSleepDurationSeconds)}
              </div>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-xs font-mono text-indigo-300 font-bold tabular-nums">
                {progressPct}%
              </span>
              <span className="label-scandi text-zinc-400 block mt-0.5">Efficiency</span>
            </div>
          )}
        </div>

        {/* Luminous Shimmering Progress Bar */}
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-indigo-500/20 my-2">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-sky-400 rounded-full transition-all duration-500 progress-shimmer shadow-[0_0_12px_rgba(129,140,248,0.55)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer Info / Live Sleep Toggle + Pause/Resume */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs font-mono text-zinc-400 relative">
        <span className="text-[11px] text-zinc-400">
          {hoursSlept >= targetHours ? (
            <span className="text-indigo-300 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Target rest achieved
            </span>
          ) : (
            <span>Shortfall: -{Math.max(0, Math.round((targetHours - hoursSlept) * 10) / 10)}h</span>
          )}
        </span>

        {isSleepActive ? (
          <div className="flex items-center gap-1.5">
            {onPauseSession && onResumeSession && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  if (isSessionPaused) onResumeSession();
                  else onPauseSession();
                }}
                className={`interactive-press flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  isSessionPaused
                    ? 'bg-emerald-400 text-zinc-950 border-emerald-300'
                    : 'bg-amber-500/15 text-amber-200 border-amber-400/50 hover:bg-amber-500/25'
                }`}
              >
                {isSessionPaused ? (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onStopSleep();
              }}
              className="interactive-press px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white rounded font-medium text-xs transition-all cursor-pointer"
            >
              Wake Up
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onStartSleep();
            }}
            className="interactive-press px-2.5 py-1 text-indigo-200 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded transition-all cursor-pointer"
            title="Start live sleep timer"
          >
            Start Night Timer
          </button>
        )}
      </div>

      {/* Expandable Sleep Log Modal */}
      {showSleepModal && (
        <div className="mt-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3 animate-in fade-in duration-150 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-100">
              Log Sleep Window ({selectedDate})
            </span>
            <button
              type="button"
              onClick={() => setShowSleepModal(false)}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] font-sans text-zinc-400">
            Log any sleep or nap window (e.g. 01:00 → 10:00, 23:00 → 07:00, or daytime rest) on {selectedDate}.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Bedtime</label>
              <input
                type="time"
                value={sleepStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                value={sleepDurationHours}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Wake Up</label>
              <input
                type="time"
                value={sleepEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
            <span className="text-zinc-500">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('01:00', 9)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              01:00 → 10:00 (9h)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('23:00', 8)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              23:00 → 07:00 (8h)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('00:00', 7.5)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              00:00 → 07:30 (7.5h)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('14:00', 1.5)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              14:00 → 15:30 (Nap)
            </button>
          </div>

          {todaySleepEntry && (
            <label className="flex items-center gap-2 text-[11px] font-sans text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="accent-indigo-400 rounded cursor-pointer"
              />
              <span>Replace existing sleep log instead of adding another window</span>
            </label>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-emerald-400 text-[11px]">
              {sleepStart} → {sleepEnd} ({sleepDurationHours}h Sleep)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSleepModal(false)}
                className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSleep}
                className="px-3.5 py-1 font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors cursor-pointer"
              >
                Save Sleep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
