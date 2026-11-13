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
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#161519] via-[#131317] to-[#111114] border border-amber-500/25 space-y-4 transition-colors hover:border-amber-500/40">
      {/* Top Header: Desk Status, Undo & Shady Day Logout Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Command className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold tracking-tight text-zinc-100">
              Desk Command Center
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-amber-300 bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 rounded-lg transition-colors cursor-pointer"
              title={`Undo last logged entry: ${lastLoggedEntry.topic || lastLoggedEntry.type}`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Undo Last: {lastLoggedEntry.topic || lastLoggedEntry.type}</span>
            </button>
          )}

          <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
            Desk: {isDeskLoggedIn ? 'Logged In' : 'Signed Out'}
          </span>

          {/* Shady Moody Day Logout (OTD) vs Bright Day Login */}
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onDayBoundary(isDeskLoggedIn ? 'stop' : 'start');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
              isDeskLoggedIn
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-zinc-700/90 text-zinc-300 shadow-[0_6px_24px_rgba(0,0,0,0.9)] hover:from-red-950/90 hover:via-zinc-950 hover:to-black hover:border-red-600/60 hover:text-red-200'
                : 'bg-amber-400 border-amber-300 text-zinc-950 hover:bg-amber-300 shadow-sm'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950/90 border border-amber-500/30 rounded-xl shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDeskLoggedIn ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-400 font-semibold">
              {isDeskLoggedIn
                ? `Logged In Since ${loginTimeFormatted}`
                : 'Desk Signed Out'}
            </span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-zinc-100 tracking-tight font-sans mt-0.5">
            {loginDateBoldFormatted}
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex sm:justify-end items-center gap-1">
            <Timer className="w-3 h-3 text-amber-400/80" />
            <span>Active Desk Elapsed</span>
          </span>
          <div
            className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
              isDeskLoggedIn ? 'text-white' : 'text-zinc-600'
            }`}
          >
            {isDeskLoggedIn ? formatTimer(deskElapsedSeconds) : '00:00:00'}
          </div>
        </div>
      </div>

      {/* Active Activity Session Live Timer */}
      {activeSession ? (
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                Active {activeSession.type}:
              </span>
              <span className="text-sm font-semibold text-zinc-100">
                {activeSession.topic || activeSession.type}
              </span>
            </div>
            <div className="mt-1 text-2xl font-mono font-bold text-zinc-100 tabular-nums">
              {formatTimer(elapsedSessionSeconds)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onStopSession();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Session</span>
          </button>
        </div>
      ) : (
        <div className="py-3 px-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400 font-mono flex flex-wrap items-center justify-between gap-2">
          <span>
            No active timer running. Start Study in <strong className="text-zinc-200">02</strong>, Break in{' '}
            <strong className="text-zinc-200">03</strong>, Sleep in <strong className="text-zinc-200">04</strong>, or Habits in{' '}
            <strong className="text-amber-400">05</strong>.
          </span>
          <span className="text-zinc-500">Standby</span>
        </div>
      )}
    </div>
  );
};
