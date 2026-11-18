import { BarChart2, Command, LogIn, LogOut, Pause, Play, RotateCcw, Square, Timer } from 'lucide-react';
import React from 'react';
import { playDeskClick } from '../lib/audioAlert';
import { ActiveSession, TimeEntry } from '../types/tracker';

interface DeskQuickLoggerProps {
  activeSession: ActiveSession | null;
  activeSessionSeconds: number;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onStopSession: () => void;
  onDayBoundary: (action: 'start' | 'stop') => void;
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  deskElapsedSeconds: number;
  isDeskTimerPaused: boolean;
  onToggleDeskTimerPause: () => void;
  onOpenDeskProgress?: () => void;
  lastLoggedEntry?: TimeEntry | null;
  onUndoEntry?: (entryId: string) => void;
}

export const DeskQuickLogger: React.FC<DeskQuickLoggerProps> = ({
  activeSession,
  activeSessionSeconds,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onDayBoundary,
  isDeskLoggedIn,
  deskLoginTimestamp,
  deskElapsedSeconds,
  isDeskTimerPaused,
  onToggleDeskTimerPause,
  onOpenDeskProgress,
  lastLoggedEntry,
  onUndoEntry,
}) => {
  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const loginDateObj = deskLoginTimestamp ? new Date(deskLoginTimestamp) : new Date();
  const isValidLoginDate = !isNaN(loginDateObj.getTime());

  const loginDateFormatted = (isValidLoginDate ? loginDateObj : new Date()).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  const loginTimeFormatted = isValidLoginDate
    ? loginDateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '--:--';

  return (
    <div className="studio-card p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0e1c17] via-[#121216] to-[#101218] border border-emerald-500/25 hover:border-emerald-400/50 shadow-[0_14px_40px_-18px_rgba(16,185,129,0.28)] space-y-4">
      {/* Top Header: Clear Hierarchy Headline > Inner Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-inner shadow-emerald-500/10">
            <Command className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Desk Command Center
            </h3>
            <span className="label-scandi text-zinc-400 block mt-0.5">
              Session login elapsed timer &amp; quick rollback
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Undo last entry button if present */}
          {lastLoggedEntry && onUndoEntry && (
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onUndoEntry(lastLoggedEntry.id);
              }}
              className="interactive-press flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-emerald-200 bg-zinc-900/90 border border-zinc-700/80 hover:border-emerald-400/60 hover:bg-emerald-950/30 rounded-lg transition-all cursor-pointer"
              title={`Undo last logged entry: ${lastLoggedEntry.topic || lastLoggedEntry.type}`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Undo Last: {lastLoggedEntry.topic || lastLoggedEntry.type}</span>
            </button>
          )}

          <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
            Desk: {isDeskLoggedIn ? 'Logged In' : 'Signed Out'}
          </span>

          {/* Shady Moody Day Logout (OTD) vs Luminous Emerald Day Login */}
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onDayBoundary(isDeskLoggedIn ? 'stop' : 'start');
            }}
            className={`interactive-press flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
              isDeskLoggedIn
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-zinc-700/90 text-zinc-300 shadow-[0_6px_24px_rgba(0,0,0,0.9)] hover:from-red-950/90 hover:via-zinc-950 hover:to-black hover:border-red-500/70 hover:text-red-200'
                : 'bg-gradient-to-r from-emerald-400 to-teal-300 border-emerald-300 text-zinc-950 hover:brightness-110 shadow-[0_0_20px_-4px_rgba(52,211,153,0.65)]'
            }`}
            title={
              isDeskLoggedIn
                ? 'Close today, run quota & habit audit, and wrap up desk session'
                : 'Start desk session with login chime & motivation'
            }
          >
            {isDeskLoggedIn ? (
              <>
                <LogOut className="w-3.5 h-3.5 opacity-80" />
                <span>Day Logout (OTD)</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Day Login</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subordinate Context Date + Active Desk Elapsed Timer with Pause/Resume */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-zinc-950/95 via-[#0f1614] to-zinc-950/95 border border-emerald-500/20 rounded-xl shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !isDeskLoggedIn
                  ? 'bg-zinc-600'
                  : isDeskTimerPaused
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]'
              }`}
            />
            <span className="label-scandi text-emerald-400/90">
              {!isDeskLoggedIn
                ? 'Desk Signed Out'
                : isDeskTimerPaused
                ? `Desk Timer Paused · Started ${loginTimeFormatted}`
                : `Logged In Since ${loginTimeFormatted}`}
            </span>
          </div>
          <div className="font-sans text-sm sm:text-base font-medium text-zinc-200 tracking-tight mt-1">
            {loginDateFormatted}
          </div>
        </div>

        <div className="flex items-center sm:justify-end gap-3">
          <div className="sm:text-right">
            <span className="label-scandi text-zinc-400 flex sm:justify-end items-center gap-1.5">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span>Active Desk Elapsed</span>
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums mt-0.5 ${
                !isDeskLoggedIn
                  ? 'text-zinc-600'
                  : isDeskTimerPaused
                  ? 'text-amber-300'
                  : 'text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.3)]'
              }`}
            >
              {isDeskLoggedIn ? formatTimer(deskElapsedSeconds) : '00:00:00'}
            </div>
          </div>

          {isDeskLoggedIn && (
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onToggleDeskTimerPause();
              }}
              className={`group interactive-press flex items-center justify-center rounded-full border transition-all duration-200 ease-out cursor-pointer shrink-0 overflow-hidden ${
                isDeskTimerPaused
                  ? 'h-6 px-2 hover:h-8 hover:px-3.5 hover:scale-105 bg-emerald-400 text-zinc-950 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.45)]'
                  : 'h-6 w-6 hover:w-auto hover:h-8 hover:px-3 hover:scale-105 bg-zinc-900/90 text-zinc-400 hover:text-amber-200 border-zinc-700/80 hover:border-amber-400/60 hover:bg-amber-500/15'
              }`}
              title={isDeskTimerPaused ? 'Resume desk elapsed timer' : 'Pause desk elapsed timer'}
              aria-label={isDeskTimerPaused ? 'Resume desk elapsed timer' : 'Pause desk elapsed timer'}
            >
              {isDeskTimerPaused ? (
                <>
                  <Play className="w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 fill-current shrink-0 transition-all duration-200" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[68px] group-hover:opacity-100 group-hover:ml-1.5 text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-200">
                    Resume
                  </span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 shrink-0 transition-all duration-200" />
                  <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 group-hover:ml-1.5 text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-200">
                    Pause
                  </span>
                </>
              )}
            </button>
          )}

          {onOpenDeskProgress && (
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onOpenDeskProgress();
              }}
              className="p-1.5 text-zinc-400 hover:text-teal-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="View Active Desk Time progress graphs"
              aria-label="View Active Desk Time progress graphs"
            >
              <BarChart2 className="w-3.5 h-3.5 text-teal-400" />
            </button>
          )}
        </div>
      </div>

      {/* Active Activity Session Live Timer with Pause / Resume & Stop */}
      {activeSession ? (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            activeSession.isPaused
              ? 'bg-gradient-to-r from-amber-950/40 via-[#151412] to-zinc-950 border-amber-400/55'
              : 'bg-gradient-to-r from-emerald-950/60 via-[#111c19] to-teal-950/40 border-emerald-400/55 shadow-[0_0_28px_-8px_rgba(16,185,129,0.4)]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSession.isPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                }`}
              />
              <span
                className={`label-scandi ${
                  activeSession.isPaused ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {activeSession.isPaused ? `Paused ${activeSession.type}` : `Active ${activeSession.type}`}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-sm font-sans font-semibold text-white">
                {activeSession.topic || activeSession.type}
              </span>
            </div>
            <div
              className={`mt-1 text-2xl font-mono font-bold tabular-nums ${
                activeSession.isPaused
                  ? 'text-amber-200'
                  : 'text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]'
              }`}
            >
              {formatTimer(activeSessionSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                if (activeSession.isPaused) onResumeSession();
                else onPauseSession();
              }}
              className={`interactive-press flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                activeSession.isPaused
                  ? 'bg-emerald-400 text-zinc-950 border-emerald-300 hover:brightness-110'
                  : 'bg-amber-500/20 text-amber-100 border-amber-400/60 hover:bg-amber-500/30'
              }`}
            >
              {activeSession.isPaused ? (
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

            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onStopSession();
              }}
              className="interactive-press flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:brightness-110 transition-all shadow-[0_0_18px_-4px_rgba(220,38,38,0.6)] cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Session</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-3 px-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-400 font-sans flex flex-wrap items-center justify-between gap-2">
          <span>
            No active timer running. Start Study in <strong className="text-emerald-400 font-mono">02</strong>, Break in{' '}
            <strong className="text-amber-400 font-mono">03</strong>, Sleep in <strong className="text-indigo-400 font-mono">04</strong>, or Habits in{' '}
            <strong className="text-purple-400 font-mono">05</strong>.
          </span>
          <span className="label-scandi text-zinc-500">Standby</span>
        </div>
      )}
    </div>
  );
};
