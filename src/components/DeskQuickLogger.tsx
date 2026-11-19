import { BarChart2, Calendar, Command, LogIn, LogOut, Pause, Play, Plus, RotateCcw, Sparkles, Square, StickyNote, Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import { formatLocalYMD, getSessionAssignedDate } from '../lib/sessionRollover';
import { ActiveSession, TimeEntry } from '../types/tracker';
import { ObservatoryCardBlackHole } from './CosmicHeroObservatory';

interface DeskQuickLoggerProps {
  activeSession: ActiveSession | null;
  activeSessionSeconds: number;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onStopSession: () => void;
  onAddSessionNote?: (noteText: string) => void;
  onDayBoundary: (action: 'start' | 'stop') => void;
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  deskElapsedSeconds: number;
  isDeskTimerPaused: boolean;
  onToggleDeskTimerPause: () => void;
  openDeskOriginDate?: string | null;
  currentSystemDate?: string;
  onResetOpenDeskToToday?: () => void;
  onOpenDeskProgress?: () => void;
  lastLoggedEntry?: TimeEntry | null;
  onUndoEntry?: (entryId: string) => void;
  isCosmicTheme?: boolean;
  pilotName?: string;
  level?: number;
  totalXp?: number;
  currentStreak?: number;
}

export const DeskQuickLogger: React.FC<DeskQuickLoggerProps> = ({
  activeSession,
  activeSessionSeconds,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onAddSessionNote,
  onDayBoundary,
  isDeskLoggedIn,
  deskLoginTimestamp,
  deskElapsedSeconds,
  isDeskTimerPaused,
  onToggleDeskTimerPause,
  openDeskOriginDate,
  currentSystemDate,
  onResetOpenDeskToToday,
  onOpenDeskProgress,
  lastLoggedEntry,
  onUndoEntry,
  isCosmicTheme = false,
  pilotName = 'Focus Pilot',
  level = 1,
  totalXp = 0,
  currentStreak = 1,
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [nowClock, setNowClock] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNowClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const sessionAssignedDate = activeSession ? getSessionAssignedDate(activeSession) : null;
  const isExtendedPastMidnight =
    !!sessionAssignedDate && sessionAssignedDate !== formatLocalYMD(new Date());

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed || !onAddSessionNote) return;
    playDeskClick();
    onAddSessionNote(trimmed);
    setNoteInput('');
  };
  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // When signed in, reflect active login timestamp; when signed out, show real live date/time cleanly
  const displayDateObj =
    isDeskLoggedIn && deskLoginTimestamp && !isNaN(new Date(deskLoginTimestamp).getTime())
      ? new Date(deskLoginTimestamp)
      : nowClock;

  const displayDateFormatted = displayDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const liveClockFormatted = nowClock.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const loginTimeFormatted =
    isDeskLoggedIn && deskLoginTimestamp && !isNaN(new Date(deskLoginTimestamp).getTime())
      ? new Date(deskLoginTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '--:--';

  const cosmicQuotes = [
    'Every moment creates your next chapter.',
    'Small focused orbits build unstoppable gravity.',
    'Protect deep work — your consistency compounds daily.',
    'One focused hour today reshapes tomorrow.',
  ];
  const cosmicLine = cosmicQuotes[nowClock.getDate() % cosmicQuotes.length];

  const isBreakSession = activeSession?.type === 'break';
  const cycleMinutes = isBreakSession ? 30 : 60;
  const orbitPct = Math.min(1, ((activeSessionSeconds % (cycleMinutes * 60)) || 0) / (cycleMinutes * 60));
  const orbitRadius = 32;
  const orbitCircumference = 2 * Math.PI * orbitRadius;
  const orbitDashOffset = orbitCircumference * (1 - orbitPct);

  return (
    <div
      className={`studio-card relative overflow-hidden p-5 sm:p-7 rounded-2xl border space-y-5 ${
        isCosmicTheme
          ? 'bg-[#060916]/82 border-violet-400/25 hover:border-violet-300/45 shadow-[0_24px_60px_-24px_rgba(99,102,241,0.38)]'
          : 'bg-gradient-to-br from-[#0e1c17] via-[#121216] to-[#101218] border-emerald-500/25 hover:border-emerald-400/50 shadow-[0_14px_40px_-18px_rgba(16,185,129,0.28)]'
      }`}
    >
      {/* Background Unobstructed 3D Black Hole when COSMIC — Beyond Time is active */}
      {isCosmicTheme && (
        <>
          <ObservatoryCardBlackHole />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-2/3 bg-gradient-to-r from-[#040610]/88 via-[#040610]/55 to-transparent"
          />
        </>
      )}

      {/* Top Header: Unified Hero Observatory in Cosmic OR Classic Desk Command Header */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
        {isCosmicTheme ? (
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-indigo-200/90">
              <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COSMIC — Beyond Time</span>
              </span>
              <span aria-hidden="true" className="text-indigo-500/60">·</span>
              <span className="text-slate-200 font-semibold">{pilotName}</span>
              <span aria-hidden="true" className="text-indigo-500/60">·</span>
              <span className="text-violet-300 font-semibold tabular-nums">
                Lv {level} · {totalXp} XP · {currentStreak}d Streak
              </span>
            </div>
            <h3 className="font-sans text-2xl sm:text-[2rem] font-bold tracking-tight text-white leading-tight">
              Your Universe. Your Time.
            </h3>
            <p className="text-xs sm:text-sm font-sans text-slate-300/95">
              {cosmicLine}
            </p>
          </div>
        ) : (
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
        )}

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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

          {!isCosmicTheme && (
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
              Desk: {isDeskLoggedIn ? 'Logged In' : 'Signed Out'}
            </span>
          )}

          {/* Shady Moody Day Logout (OTD) vs Luminous Day Login */}
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onDayBoundary(isDeskLoggedIn ? 'stop' : 'start');
            }}
            className={`interactive-press flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
              isDeskLoggedIn
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-zinc-700/90 text-zinc-300 shadow-[0_6px_24px_rgba(0,0,0,0.9)] hover:from-red-950/90 hover:via-zinc-950 hover:to-black hover:border-red-500/70 hover:text-red-200'
                : isCosmicTheme
                ? 'bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-300 border-cyan-200 text-zinc-950 hover:brightness-110 shadow-[0_0_22px_-4px_rgba(34,211,238,0.6)]'
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

      {/* Single Clean Date, Live Clock & Active Desk Elapsed Bar */}
      <div
        className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border shadow-lg shadow-black/40 ${
          isCosmicTheme
            ? 'bg-[#050816]/72 border-indigo-400/20 backdrop-blur-md'
            : 'bg-gradient-to-r from-zinc-950/95 via-[#0f1614] to-zinc-950/95 border-emerald-500/20'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !isDeskLoggedIn
                  ? 'bg-zinc-600'
                  : isDeskTimerPaused
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : isCosmicTheme
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]'
                  : 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]'
              }`}
            />
            <span
              className={`label-scandi ${
                isCosmicTheme ? 'text-cyan-300/95' : 'text-emerald-400/90'
              }`}
            >
              {!isDeskLoggedIn
                ? 'Desk Signed Out'
                : isDeskTimerPaused
                ? `Desk Timer Paused · Started ${loginTimeFormatted}`
                : `Logged In Since ${loginTimeFormatted}`}
            </span>
          </div>
          <div className="font-sans text-sm sm:text-base font-medium text-zinc-200 tracking-tight mt-1 flex flex-wrap items-center gap-2 tabular-nums">
            <span>{displayDateFormatted}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className={`font-mono text-xs sm:text-sm ${isCosmicTheme ? 'text-cyan-200 font-semibold' : 'text-zinc-400'}`}>
              {liveClockFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center sm:justify-end gap-3">
          <div className="sm:text-right">
            <span className="label-scandi text-zinc-400 flex sm:justify-end items-center gap-1.5">
              <Timer className={`w-3 h-3 ${isCosmicTheme ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <span>Active Desk Elapsed</span>
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums mt-0.5 ${
                !isDeskLoggedIn
                  ? 'text-zinc-600'
                  : isDeskTimerPaused
                  ? 'text-amber-300'
                  : isCosmicTheme
                  ? 'text-cyan-200 drop-shadow-[0_0_14px_rgba(34,211,238,0.3)]'
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

      {/* Post-Midnight Open Desk Continuity Banner + Explicit Reset to Today */}
      {isDeskLoggedIn &&
        openDeskOriginDate &&
        currentSystemDate &&
        openDeskOriginDate < currentSystemDate && (
          <div className="p-3.5 rounded-xl bg-cyan-950/35 border border-cyan-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-mono font-semibold text-cyan-200">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Desk Timer still open from {openDeskOriginDate} (Post-Midnight Mode)
                </span>
              </div>
              <p className="text-zinc-300 font-sans">
                Quotas &amp; entries stay on <strong className="text-white">{openDeskOriginDate}</strong> so you can finish remaining minutes. Ready for the new day?
              </p>
            </div>
            {onResetOpenDeskToToday && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  onResetOpenDeskToToday();
                }}
                className="interactive-press px-3 py-1.5 text-xs font-bold text-zinc-950 bg-cyan-300 hover:bg-cyan-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title={`Close ${openDeskOriginDate} desk day cleanly and activate Today (${currentSystemDate})`}
              >
                Reset to Today ({currentSystemDate})
              </button>
            )}
          </div>
        )}

      {/* Active Activity Session Live Timer with Assigned Date, Notes & Pause / Resume / Stop */}
      {activeSession ? (
        <div
          className={`relative z-10 p-4 sm:p-5 rounded-xl border space-y-3 ${
            isCosmicTheme
              ? activeSession.isPaused
                ? 'bg-[#0b0c1c]/85 border-amber-400/40'
                : isBreakSession
                ? 'bg-gradient-to-r from-[#140e24]/90 via-[#0a0c1d]/85 to-[#070b18]/90 border-amber-400/40 shadow-[0_0_30px_-10px_rgba(251,191,36,0.22)]'
                : 'bg-gradient-to-r from-[#090d22]/90 via-[#070b1a]/88 to-[#0b0920]/90 border-cyan-400/40 shadow-[0_0_32px_-10px_rgba(34,211,238,0.28)]'
              : activeSession.isPaused
              ? 'bg-gradient-to-r from-amber-950/40 via-[#151412] to-zinc-950 border-amber-400/55'
              : 'bg-gradient-to-r from-emerald-950/60 via-[#111c19] to-teal-950/40 border-emerald-400/55 shadow-[0_0_28px_-8px_rgba(16,185,129,0.4)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {isCosmicTheme && (
                <div
                  className="relative w-20 h-20 shrink-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  {/* Outer slow dotted observatory orbit */}
                  <div
                    className={`absolute inset-0 rounded-full border border-dashed ${
                      activeSession.isPaused
                        ? 'border-amber-400/35'
                        : isBreakSession
                        ? 'border-amber-300/35 animate-cosmic-orbit-slow'
                        : 'border-violet-300/35 animate-cosmic-orbit-slow'
                    }`}
                  />
                  {/* Progress Ring SVG */}
                  <svg className="w-[74px] h-[74px] -rotate-90" viewBox="0 0 74 74">
                    <circle
                      cx="37"
                      cy="37"
                      r={orbitRadius}
                      stroke="rgba(148, 163, 184, 0.14)"
                      strokeWidth="3.5"
                      fill="rgba(3, 4, 12, 0.72)"
                    />
                    <circle
                      cx="37"
                      cy="37"
                      r={orbitRadius}
                      stroke={
                        activeSession.isPaused
                          ? '#fbbf24'
                          : isBreakSession
                          ? '#f59e0b'
                          : '#22d3ee'
                      }
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={orbitCircumference}
                      strokeDashoffset={orbitDashOffset}
                      fill="transparent"
                      style={{
                        transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
                        filter: activeSession.isPaused
                          ? 'none'
                          : isBreakSession
                          ? 'drop-shadow(0 0 6px rgba(251,191,36,0.45))'
                          : 'drop-shadow(0 0 7px rgba(34,211,238,0.5))',
                      }}
                    />
                  </svg>
                  {/* Slow orbiting satellite dot */}
                  <div
                    className={`absolute inset-1 pointer-events-none ${
                      activeSession.isPaused ? '' : 'animate-cosmic-orbit'
                    }`}
                  >
                    <span
                      className={`block w-2 h-2 rounded-full mx-auto ${
                        isBreakSession
                          ? 'bg-amber-300 shadow-[0_0_8px_#fbbf24]'
                          : 'bg-cyan-300 shadow-[0_0_8px_#22d3ee]'
                      }`}
                    />
                  </div>
                  <span className="absolute text-[10px] font-mono font-semibold text-slate-200 tracking-wider uppercase">
                    {isBreakSession ? 'BRK' : 'ORB'}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeSession.isPaused
                        ? 'bg-amber-400'
                        : isCosmicTheme && !isBreakSession
                        ? 'bg-cyan-300 animate-pulse shadow-[0_0_8px_#22d3ee]'
                        : isBreakSession
                        ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]'
                        : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                    }`}
                  />
                  <span
                    className={`label-scandi ${
                      activeSession.isPaused
                        ? 'text-amber-300'
                        : isCosmicTheme && isBreakSession
                        ? 'text-amber-300'
                        : isCosmicTheme
                        ? 'text-cyan-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {activeSession.isPaused ? `Paused ${activeSession.type}` : `Active ${activeSession.type}`}
                  </span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span className="text-sm font-sans font-semibold text-white">
                    {activeSession.topic || activeSession.type}
                  </span>
                  {sessionAssignedDate && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                        isExtendedPastMidnight
                          ? 'bg-cyan-500/15 border-cyan-400/45 text-cyan-200'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
                      }`}
                      title="All time & notes for this session save to this original session date"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>
                        {isExtendedPastMidnight
                          ? `Assigned: ${sessionAssignedDate} · Post-midnight`
                          : `Session Date: ${sessionAssignedDate}`}
                      </span>
                    </span>
                  )}
                </div>
                <div
                  className={`mt-1 text-2xl sm:text-3xl font-mono font-bold tabular-nums tracking-tight ${
                    activeSession.isPaused
                      ? 'text-amber-200'
                      : isCosmicTheme && isBreakSession
                      ? 'text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                      : isCosmicTheme
                      ? 'text-white drop-shadow-[0_0_14px_rgba(34,211,238,0.28)]'
                      : 'text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                  }`}
                >
                  {formatTimer(activeSessionSeconds)}
                </div>
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

          {/* Session Notes Anchored to Original Assigned Date */}
          {onAddSessionNote && (
            <div className="pt-2.5 border-t border-zinc-800/70 space-y-2">
              {activeSession.notes && activeSession.notes.length > 0 && (
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {activeSession.notes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/75 border border-zinc-800/80 text-xs"
                    >
                      <span className="text-zinc-200 font-sans flex items-start gap-1.5 min-w-0">
                        <StickyNote className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="break-words">{n.text}</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {n.assignedDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmitNote} className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={`Add session note (saves to ${sessionAssignedDate || 'session date'})...`}
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs font-sans bg-zinc-950/85 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="interactive-press flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-700/80 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative z-10 py-3 px-4 rounded-xl border text-xs font-sans flex flex-wrap items-center justify-between gap-2 ${
            isCosmicTheme
              ? 'bg-[#050816]/72 border-indigo-400/20 text-slate-300 backdrop-blur-md'
              : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
          }`}
        >
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
