import { Command, LogIn, LogOut, RotateCcw, Square, Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import { ActiveSession, TimeEntry } from '../types/tracker';

interface DeskQuickLoggerProps {
  activeSession: ActiveSession | null;
  onStopSession: () => void;
  onDayBoundary: (action: 'start' | 'stop') => void;
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  lastLoggedEntry?: TimeEntry | null;
  onUndoEntry?: (entryId: string) => void;
}

export const DeskQuickLogger: React.FC<DeskQuickLoggerProps> = ({
  activeSession,
  onStopSession,
  onDayBoundary,
  isDeskLoggedIn,
  deskLoginTimestamp,
  lastLoggedEntry,
  onUndoEntry,
}) => {
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [deskElapsedSeconds, setDeskElapsedSeconds] = useState(0);

  // Elapsed time SINCE logged into the desk
  useEffect(() => {
    if (!isDeskLoggedIn || !deskLoginTimestamp) {
      setDeskElapsedSeconds(0);
      return;
    }

    const loginMs = new Date(deskLoginTimestamp).getTime();
    if (isNaN(loginMs)) {
      setDeskElapsedSeconds(0);
      return;
    }

    const updateDeskElapsed = () => {
      setDeskElapsedSeconds(Math.max(0, Math.floor((Date.now() - loginMs) / 1000)));
    };

    updateDeskElapsed();
    const timer = setInterval(updateDeskElapsed, 1000);
    return () => clearInterval(timer);
  }, [isDeskLoggedIn, deskLoginTimestamp]);

  // Live timer for active activity session
  useEffect(() => {
    if (!activeSession) {
      setElapsedSessionSeconds(0);
      return;
    }

    const startMs = new Date(activeSession.startTime).getTime();
    const updateElapsed = () => {
      setElapsedSessionSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const loginDateObj = deskLoginTimestamp ? new Date(deskLoginTimestamp) : new Date();
  const isValidLoginDate = !isNaN(loginDateObj.getTime());

  const loginDateBoldFormatted = (isValidLoginDate ? loginDateObj : new Date())
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();

  const loginTimeFormatted = isValidLoginDate
    ? loginDateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '--:--';

  return (
    <div className="studio-card p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0e1c17] via-[#121216] to-[#101218] border border-emerald-500/25 hover:border-emerald-400/50 shadow-[0_14px_40px_-18px_rgba(16,185,129,0.28)] space-y-4">
      {/* Top Header: Desk Status, Undo & Shady Day Logout Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-inner shadow-emerald-500/10">
            <Command className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-white">
              Desk Command Center
            </h2>
            <span className="label-scandi text-zinc-400 block mt-0.5">
              Session login elapsed timer & quick rollback
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

      {/* Prominent Bold Login Date + Elapsed Time Since Logged In */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-zinc-950/95 via-[#0f1614] to-zinc-950/95 border border-emerald-500/20 rounded-xl shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDeskLoggedIn ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]' : 'bg-zinc-600'
              }`}
            />
            <span className="label-scandi text-emerald-400">
              {isDeskLoggedIn
                ? `Logged In Since ${loginTimeFormatted}`
                : 'Desk Signed Out'}
            </span>
          </div>
          <div className="font-display text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            {loginDateBoldFormatted}
          </div>
        </div>

        <div className="sm:text-right">
          <span className="label-scandi text-zinc-400 flex sm:justify-end items-center gap-1.5">
            <Timer className="w-3 h-3 text-emerald-400" />
            <span>Active Desk Elapsed</span>
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums mt-0.5 ${
              isDeskLoggedIn
                ? 'text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.3)]'
                : 'text-zinc-600'
            }`}
          >
            {isDeskLoggedIn ? formatTimer(deskElapsedSeconds) : '00:00:00'}
          </div>
        </div>
      </div>

      {/* Active Activity Session Live Timer */}
      {activeSession ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#111c19] to-teal-950/40 border border-emerald-400/55 shadow-[0_0_28px_-8px_rgba(16,185,129,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="label-scandi text-emerald-300">
                Active {activeSession.type}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-sm font-sans font-semibold text-white">
                {activeSession.topic || activeSession.type}
              </span>
            </div>
            <div className="mt-1 text-2xl font-mono font-bold text-emerald-200 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]">
              {formatTimer(elapsedSessionSeconds)}
            </div>
          </div>

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
