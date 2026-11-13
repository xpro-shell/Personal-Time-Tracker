import { Bed, CheckCircle2, Clock, Moon, Play, RotateCcw, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { TimeEntry } from '../types/tracker';

interface SleepTrackerCardProps {
  sleepMinutesToday: number;
  targetSleepMinutes?: number; // default 480m (8h)
  isSleepActive: boolean;
  activeSleepDurationSeconds: number;
  todaySleepEntry?: TimeEntry | null;
  onStartSleep: () => void;
  onStopSleep: () => void;
  onLogCustomSleep: (options: {
    startTimeIso: string;
    endTimeIso: string;
    durationMinutes: number;
  }) => void;
  onUndoSleep?: (id: string) => void;
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
  activeSleepDurationSeconds,
  todaySleepEntry,
  onStartSleep,
  onStopSleep,
  onLogCustomSleep,
  onUndoSleep,
  selectedDate,
}) => {
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepDurationHours, setSleepDurationHours] = useState(8);
  const [sleepEnd, setSleepEnd] = useState('07:00');

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
    setSleepStart(s);
    setSleepEnd(addHoursToHHMM(s, sleepDurationHours));
  };

  const handleDurationChange = (durH: number) => {
    const valid = Math.max(1, durH);
    setSleepDurationHours(valid);
    setSleepEnd(addHoursToHHMM(sleepStart, valid));
  };

  const handleEndChange = (e: string) => {
    setSleepEnd(e);
    const diff = calculateDiffMinutes(sleepStart, e);
    const durH = Math.round((diff / 60) * 10) / 10;
    setSleepDurationHours(durH);
  };

  const handleConfirmSleep = () => {
    playDeskClick();

    const [sH, sM] = sleepStart.split(':').map(Number);
    const startDate = new Date(`${selectedDate}T00:00:00`);
    // If sleep starts after 18:00 and crosses midnight, start could be previous evening or night
    startDate.setHours(sH, sM, 0, 0);

    const durMins = Math.round(sleepDurationHours * 60);
    const endDate = new Date(startDate.getTime() + durMins * 60000);

    onLogCustomSleep({
      startTimeIso: startDate.toISOString(),
      endTimeIso: endDate.toISOString(),
      durationMinutes: durMins,
    });

    playEarnedChime();
    setShowSleepModal(false);
  };

  // Determine sleep window string
  const existingSleepWindow = todaySleepEntry ? (() => {
    const s = new Date(todaySleepEntry.startTime);
    const durM = todaySleepEntry.durationMinutes || 480;
    const e = todaySleepEntry.endTime
      ? new Date(todaySleepEntry.endTime)
      : new Date(s.getTime() + durM * 60000);

    const sStr = !isNaN(s.getTime()) ? formatHHMM(s) : '--:--';
    const eStr = !isNaN(e.getTime()) ? formatHHMM(e) : '--:--';
    return `${sStr} → ${eStr}`;
  })() : null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#10121e] via-[#12141c] to-[#111318] border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Indigo gradient glow background */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-tight text-indigo-100">
                Restorative Sleep
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Replaces red unlogged time
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {todaySleepEntry && onUndoSleep && (
              <button
                onClick={() => onUndoSleep(todaySleepEntry.id)}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 transition-colors"
                title="Undo logged sleep"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              onClick={() => {
                playDeskClick();
                setShowSleepModal((prev) => !prev);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-indigo-950/60 border border-indigo-800 text-indigo-200 hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              <span>Log Sleep</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Display */}
        <div className="my-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-mono font-bold text-indigo-100 tabular-nums tracking-tight">
              {hoursSlept}
              <span className="text-sm font-normal text-zinc-500 ml-1">/ {targetHours}h</span>
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
              <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold animate-pulse block">
                Sleeping Active
              </span>
              <div className="text-lg font-mono font-bold text-indigo-200 tabular-nums">
                {formatTimer(activeSleepDurationSeconds)}
              </div>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-xs font-mono text-indigo-400 font-bold tabular-nums">
                {progressPct}%
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block">Rest efficiency</span>
            </div>
          )}
        </div>

        {/* Progress Bar in Indigo */}
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 my-2">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer Info / Live Sleep Toggle */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
        <span className="text-[11px] text-zinc-500">
          {hoursSlept >= targetHours ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Target rest achieved
            </span>
          ) : (
            <span>Shortfall: -{Math.max(0, Math.round((targetHours - hoursSlept) * 10) / 10)}h</span>
          )}
        </span>

        {isSleepActive ? (
          <button
            onClick={() => {
              playDeskClick();
              onStopSleep();
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-xs transition-colors cursor-pointer"
          >
            Wake Up (Stop Sleep)
          </button>
        ) : (
          <button
            onClick={() => {
              playDeskClick();
              onStartSleep();
            }}
            className="px-2.5 py-1 text-zinc-400 hover:text-indigo-200 hover:bg-indigo-950/40 rounded transition-colors"
            title="Start live sleep timer"
          >
            Start Night Timer
          </button>
        )}
      </div>

      {/* Expandable Sleep Log Modal */}
      {showSleepModal && (
        <div className="mt-3 p-3.5 bg-zinc-950 border border-indigo-800/60 rounded-lg space-y-3 animate-in fade-in duration-150 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-200">
              Log Sleep Window ({selectedDate})
            </span>
            <button
              onClick={() => setShowSleepModal(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            Log your sleep hours to replace red lost time with restorative sleep in the timeline and charts.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase mb-1">Bedtime</label>
              <input
                type="time"
                value={sleepStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="14"
                value={sleepDurationHours}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 8)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase mb-1">Wake Up</label>
              <input
                type="time"
                value={sleepEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 font-semibold"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
            <span className="text-zinc-500">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('23:00', 8)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              23:00 → 07:00 (8h)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('00:00', 7.5)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              00:00 → 07:30 (7.5h)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('22:30', 8.5)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              22:30 → 07:00 (8.5h)
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-indigo-300 text-[11px]">
              {sleepStart} → {sleepEnd} ({sleepDurationHours}h Sleep)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSleepModal(false)}
                className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSleep}
                className="px-3.5 py-1 font-semibold text-zinc-950 bg-indigo-400 hover:bg-indigo-300 rounded shadow-sm transition-colors cursor-pointer"
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
