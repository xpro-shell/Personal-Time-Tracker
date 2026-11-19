import confetti from 'canvas-confetti';
import { AlertTriangle, BarChart2, Clock, Coffee, Pause, Play, Plus, Sparkles, Square, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playBreakExhaustedAlert, playDeskClick, playEarnedChime } from '../lib/audioAlert';

interface BreakBankCardProps {
  usedBreakMinutesToday: number;
  isBreakActive: boolean;
  isSessionPaused?: boolean;
  activeBreakDurationSeconds: number;
  bankedCarryForwardMinutes: number;
  selectedDate?: string;
  onStartBreak: () => void;
  onPauseSession?: () => void;
  onResumeSession?: () => void;
  onStopBreak: () => void;
  onLogPastBreak?: (options: {
    topic: string;
    startTimeIso: string;
    endTimeIso: string;
    durationMinutes: number;
    assignedDate?: string;
  }) => void;
  onOpenProgress?: () => void;
}

const BREAK_DURATION_CHIPS = [10, 15, 20, 30, 45, 60];

function formatHHMM(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function addMinsToHHMM(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const totalMins = (h * 60 + m + mins) % 1440;
  return `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
}

function subtractMinsFromHHMM(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const totalMins = (((h * 60 + m - mins) % 1440) + 1440) % 1440;
  return `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
}

function diffMinsBetweenHHMM(startStr: string, endStr: string): number {
  const [h1, m1] = startStr.split(':').map((v) => parseInt(v, 10) || 0);
  const [h2, m2] = endStr.split(':').map((v) => parseInt(v, 10) || 0);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff <= 0) diff += 1440;
  return diff;
}

export const BreakBankCard: React.FC<BreakBankCardProps> = ({
  usedBreakMinutesToday,
  isBreakActive,
  isSessionPaused = false,
  activeBreakDurationSeconds,
  bankedCarryForwardMinutes,
  selectedDate,
  onStartBreak,
  onPauseSession,
  onResumeSession,
  onStopBreak,
  onLogPastBreak,
  onOpenProgress,
}) => {
  const BASE_QUOTA_SECONDS = 2 * 60 * 60; // 7,200 seconds (2h)
  const totalUsedSeconds = Math.round(usedBreakMinutesToday * 60) + (isBreakActive ? activeBreakDurationSeconds : 0);
  const remainingSeconds = BASE_QUOTA_SECONDS - totalUsedSeconds;
  const isExhausted = remainingSeconds <= 0;

  const [hasAlerted, setHasAlerted] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Manual past break state
  const [showManualBreak, setShowManualBreak] = useState(false);
  const [breakLabel, setBreakLabel] = useState('Break');
  const [breakDate, setBreakDate] = useState<string>(() => selectedDate || new Date().toISOString().slice(0, 10));
  const [breakDurationMins, setBreakDurationMins] = useState<number>(20);
  const [breakEnd, setBreakEnd] = useState<string>(() => formatHHMM(new Date()));
  const [breakStart, setBreakStart] = useState<string>(() => subtractMinsFromHHMM(formatHHMM(new Date()), 20));

  // Trigger red alert chime once when quota reaches 0
  useEffect(() => {
    if (isExhausted && !hasAlerted && isBreakActive) {
      playBreakExhaustedAlert();
      setHasAlerted(true);
    } else if (!isExhausted) {
      setHasAlerted(false);
    }
  }, [isExhausted, hasAlerted, isBreakActive]);

  const formatTime = (secs: number) => {
    const abs = Math.abs(secs);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCelebrate = () => {
    playEarnedChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
    });
    setShowCelebrationModal(true);
    setTimeout(() => setShowCelebrationModal(false), 4000);
  };

  const handleToggleManualBreak = () => {
    playDeskClick();
    if (!showManualBreak) {
      const nowStr = formatHHMM(new Date());
      setBreakDate(selectedDate || new Date().toISOString().slice(0, 10));
      setBreakLabel('Break');
      setBreakDurationMins(20);
      setBreakEnd(nowStr);
      setBreakStart(subtractMinsFromHHMM(nowStr, 20));
    }
    setShowManualBreak((prev) => !prev);
  };

  const handleConfirmManualBreak = () => {
    if (!onLogPastBreak) return;
    const targetDate = breakDate || selectedDate || new Date().toISOString().slice(0, 10);
    const [y, m, d] = targetDate.split('-').map(Number);
    const [sH, sM] = breakStart.split(':').map((v) => parseInt(v, 10) || 0);
    const startDate = new Date(y, m - 1, d, sH, sM, 0, 0);
    const safeMins = Math.max(1, breakDurationMins);
    const endDate = new Date(startDate.getTime() + safeMins * 60000);

    playEarnedChime();
    onLogPastBreak({
      topic: breakLabel.trim() || 'Break',
      startTimeIso: startDate.toISOString(),
      endTimeIso: endDate.toISOString(),
      durationMinutes: safeMins,
      assignedDate: targetDate,
    });
    setShowManualBreak(false);
  };

  const percentageUsed = Math.min(100, Math.max(0, (totalUsedSeconds / BASE_QUOTA_SECONDS) * 100));

  return (
    <div
      className={`studio-card relative p-5 rounded-2xl border flex flex-col justify-between gap-4 overflow-hidden ${
        isExhausted
          ? 'bg-gradient-to-br from-red-950/60 via-[#1a1012] to-[#140d0f] border-red-500/75 shadow-[0_0_36px_-10px_rgba(239,68,68,0.5)]'
          : isBreakActive
          ? 'bg-gradient-to-br from-[#241a0b] via-[#151310] to-[#121215] border-amber-400/70 shadow-[0_0_34px_-10px_rgba(245,158,11,0.45)]'
          : 'bg-gradient-to-br from-[#1b150c] via-[#121215] to-[#141210] border-amber-500/20 hover:border-amber-400/50'
      }`}
    >
      {/* Subtle Ambient Corner Radiance */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{ background: isExhausted ? 'radial-gradient(circle, #ef4444, transparent 70%)' : 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
      />

      <div className="relative">
        {/* Red Alert Header when exhausted (preserved semantic emergency alert) */}
        {isExhausted && (
          <div className="mb-4 p-3 bg-red-900/60 border border-red-500/80 rounded-lg flex items-start gap-3 text-red-100 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs font-sans">
              <span className="font-bold tracking-wide uppercase">Break is Over</span>
              <p className="mt-0.5 text-red-200">
                Your 2-hour daily break quota is completely exhausted. Now only focus hours left!
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-lg border shrink-0 ${isExhausted ? 'bg-red-950/70 border-red-500/40' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <Coffee className={`w-4 h-4 ${isExhausted ? 'text-red-400' : 'text-amber-400'}`} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white truncate">
              2-Hour Break Bank
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-zinc-400 shrink-0">
            <span className="hidden sm:inline">{Math.round(totalUsedSeconds / 60)}m / 120m</span>
            {onOpenProgress && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  onOpenProgress();
                }}
                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-400/60 text-amber-300 hover:text-white transition-all cursor-pointer"
                title="View Break progress graph (Hours, Weeks, Months, Years)"
                aria-label="View Break progress graph"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onLogPastBreak && (
              <button
                type="button"
                onClick={handleToggleManualBreak}
                className={`group interactive-press flex items-center justify-center rounded-lg border transition-all duration-200 ease-out cursor-pointer shrink-0 overflow-hidden ${
                  showManualBreak
                    ? 'h-7 px-2.5 bg-amber-400 text-zinc-950 border-amber-300 font-bold'
                    : 'h-7 px-2 hover:px-2.5 bg-amber-500/15 border-amber-500/35 text-amber-200 hover:border-amber-400 hover:text-white'
                }`}
                title="Forgot to start Break timer? Log a past break anytime"
                aria-label="Log past break session"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span
                  className={`text-[11px] font-mono font-semibold whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    showManualBreak
                      ? 'max-w-[36px] opacity-100 ml-1'
                      : 'max-w-0 opacity-0 group-hover:max-w-[36px] group-hover:opacity-100 group-hover:ml-1'
                  }`}
                >
                  Log
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Main Countdown Meter */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className={`label-scandi block mb-1 ${isExhausted ? 'text-red-300' : 'text-amber-300/80'}`}>
              {isExhausted ? 'Break Overtime' : 'Remaining Break Quota'}
            </span>
            <span
              className={`text-3xl font-mono font-bold tracking-tight tabular-nums ${
                isExhausted ? 'text-red-400' : isBreakActive ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'text-white'
              }`}
            >
              {isExhausted ? `+${formatTime(remainingSeconds)}` : formatTime(remainingSeconds)}
            </span>
          </div>

          {!isExhausted && remainingSeconds > 600 && !isBreakActive && (
            <button
              type="button"
              onClick={handleCelebrate}
              className="interactive-press flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 rounded-md transition-all cursor-pointer"
              title="Celebrate unused break discipline"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Earned Reserve</span>
            </button>
          )}
        </div>

        {/* Luminous Progress Bar */}
        <div className="mt-4 w-full h-2 bg-zinc-950 border border-amber-500/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExhausted
                ? 'bg-gradient-to-r from-red-600 to-rose-400'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 progress-shimmer shadow-[0_0_12px_rgba(245,158,11,0.5)]'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Expandable Manual Break Logger */}
      {showManualBreak && onLogPastBreak && (
        <div className="p-3.5 bg-zinc-950/95 border border-amber-500/35 rounded-xl space-y-3 text-xs font-mono animate-in fade-in duration-150 relative">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-200">
              Log Missed Break
            </span>
            <button
              type="button"
              onClick={() => setShowManualBreak(false)}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={breakLabel}
              onChange={(e) => setBreakLabel(e.target.value)}
              placeholder="Break reason (e.g. Tea, Rest)"
              className="px-2.5 py-1.5 text-xs font-sans bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <input
              type="date"
              value={breakDate}
              onChange={(e) => e.target.value && setBreakDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Start</label>
              <input
                type="time"
                value={breakStart}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  setBreakStart(v);
                  setBreakEnd(addMinsToHHMM(v, breakDurationMins));
                }}
                className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Minutes</label>
              <input
                type="number"
                min={1}
                max={480}
                value={breakDurationMins}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(480, parseInt(e.target.value, 10) || 10));
                  setBreakDurationMins(val);
                  setBreakEnd(addMinsToHHMM(breakStart, val));
                }}
                className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">End</label>
              <input
                type="time"
                value={breakEnd}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  setBreakEnd(v);
                  setBreakDurationMins(diffMinsBetweenHHMM(breakStart, v));
                }}
                className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {BREAK_DURATION_CHIPS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  playDeskClick();
                  setBreakDurationMins(mins);
                  setBreakEnd(addMinsToHHMM(breakStart, mins));
                }}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${
                  breakDurationMins === mins
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {mins === 60 ? '1h' : `${mins}m`}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-[11px] text-amber-300">
              {breakStart} → {breakEnd} ({breakDurationMins}m)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowManualBreak(false)}
                className="px-2 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmManualBreak}
                className="flex items-center gap-1 px-3 py-1 font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Save Break</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls: Carry-Forward Reserve + Dedicated Break (bon) Button */}
      <div className="pt-3.5 border-t border-zinc-800/80 space-y-3 relative">
        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Carry-Forward Reserve:</span>
          </div>
          <span className="text-amber-300 font-semibold">
            +{Math.round((bankedCarryForwardMinutes / 60) * 10) / 10}h
          </span>
        </div>

        {isBreakActive ? (
          <div className="flex items-center gap-2">
            {onPauseSession && onResumeSession && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  if (isSessionPaused) onResumeSession();
                  else onPauseSession();
                }}
                className={`interactive-press flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isSessionPaused
                    ? 'bg-emerald-400 text-zinc-950 border-emerald-300'
                    : 'bg-amber-500/20 text-amber-100 border-amber-400/55 hover:bg-amber-500/30'
                }`}
              >
                {isSessionPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onStopBreak();
              }}
              className="interactive-press flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 rounded-lg transition-all shadow-[0_0_18px_-4px_rgba(220,38,38,0.6)] cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Break (boff)</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onStartBreak();
            }}
            className="interactive-press w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-amber-100 bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/35 hover:border-amber-400 hover:bg-amber-500/25 rounded-lg transition-all cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Break (bon)</span>
          </button>
        )}
      </div>

      {/* Earned Break Celebration Toast Overlay */}
      {showCelebrationModal && (
        <div className="absolute inset-0 bg-zinc-950/95 border border-emerald-500/80 rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
          <h4 className="font-display text-base font-semibold text-white">Break Reserve Earned</h4>
          <p className="text-xs font-sans text-zinc-300 mt-1 max-w-xs">
            You protected your focus time! Unused break hours roll into your motivation bank.
          </p>
        </div>
      )}
    </div>
  );
};
