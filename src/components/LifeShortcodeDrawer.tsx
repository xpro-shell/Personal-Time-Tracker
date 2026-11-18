import {
  ChevronRight,
  Clock,
  Coffee,
  Footprints,
  Gamepad2,
  History,
  Pause,
  Phone,
  Pin,
  PinOff,
  Play,
  Plus,
  Square,
  Trash2,
  Tv,
  Utensils,
  Wrench,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { ActiveSession, TimeEntry } from '../types/tracker';
import { isEntryOnLocalDate } from '../lib/sessionRollover';

interface LifeShortcodeDrawerProps {
  activeSession: ActiveSession | null;
  todayEntries: TimeEntry[];
  selectedDate: string;
  onStartLifeTimer: (topic: string) => void;
  onPauseSession?: () => void;
  onResumeSession?: () => void;
  onStopSession: () => void;
  onLogPastLifeActivity: (options: { topic: string; durationMinutes: number }) => void;
  onUndoEntry: (entryId: string) => void;
}

const LIFE_ACTIVITY_PRESETS = [
  { label: 'Watching TV', code: 'tv', icon: Tv, defaultMins: 60 },
  { label: 'Meal / Dinner', code: 'meal', icon: Utensils, defaultMins: 30 },
  { label: 'Walk / Outdoor', code: 'walk', icon: Footprints, defaultMins: 30 },
  { label: 'Family / Call', code: 'call', icon: Phone, defaultMins: 20 },
  { label: 'YouTube / Reels', code: 'yt', icon: Youtube, defaultMins: 30 },
  { label: 'Gaming / Chill', code: 'game', icon: Gamepad2, defaultMins: 60 },
  { label: 'Chores / Errands', code: 'chore', icon: Wrench, defaultMins: 40 },
  { label: 'Tea / Coffee', code: 'tea', icon: Coffee, defaultMins: 15 },
];

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

const SHORTCODE_ALIASES: Record<string, string> = {
  tv: 'Watching Television',
  television: 'Watching Television',
  movie: 'Movie / Cinema',
  meal: 'Meal / Food',
  lunch: 'Lunch',
  dinner: 'Dinner',
  breakfast: 'Breakfast',
  walk: 'Outdoor Walk',
  call: 'Phone / Family Call',
  yt: 'YouTube / Media',
  youtube: 'YouTube / Media',
  reels: 'Short Video / Reels',
  game: 'Gaming',
  gaming: 'Gaming',
  chore: 'Home Chores',
  chores: 'Home Chores',
  tea: 'Tea / Coffee',
  nap: 'Power Nap',
};

export const LifeShortcodeDrawer: React.FC<LifeShortcodeDrawerProps> = ({
  activeSession,
  todayEntries,
  selectedDate,
  onStartLifeTimer,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onLogPastLifeActivity,
  onUndoEntry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const [shortcodeInput, setShortcodeInput] = useState('');
  const [activityTopic, setActivityTopic] = useState('Watching Television');
  const [mode, setMode] = useState<'did' | 'start'>('did');
  const [durationMins, setDurationMins] = useState<number>(45);
  const [customMinsInput, setCustomMinsInput] = useState<string>('45');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const hoverCloseTimerRef = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; ignore: boolean } | null>(null);

  const isLifeTimerActive = activeSession?.type === 'life';

  const lifeEntriesToday = useMemo(() => {
    return todayEntries.filter(
      (e) => e.type === 'life' && isEntryOnLocalDate(e, selectedDate)
    );
  }, [todayEntries, selectedDate]);

  const totalLifeMinutesToday = useMemo(() => {
    return lifeEntriesToday.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  }, [lifeEntriesToday]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const clearHoverTimer = () => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const handleEdgeMouseEnter = () => {
    clearHoverTimer();
    setIsOpen(true);
  };

  const handleDrawerMouseLeave = () => {
    if (isPinned) return;
    // Don't auto-close while the user is focused inside an input field in the drawer
    const activeEl = document.activeElement;
    if (activeEl && drawerRef.current?.contains(activeEl)) {
      return;
    }
    clearHoverTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 320);
  };

  // Global Touch Swipe Gesture (Mobile Swipe Left or Left-Edge Swipe Open) + Escape Key
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const target = e.target as HTMLElement | null;
      // Do not hijack horizontal swipes inside scrollable strips/tables or modals
      const inScrollable = !!target?.closest('.overflow-x-auto, [role="dialog"]');
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        ignore: inScrollable,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.ignore || e.changedTouches.length !== 1) return;

      const end = e.changedTouches[0];
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;

      // Require predominantly horizontal swipe
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      if (!isOpen) {
        // Swipe left anywhere on mobile OR swipe right from left screen edge
        if (dx < -65 || (start.x <= 42 && dx > 45)) {
          setIsOpen(true);
        }
      } else if (dx < -55) {
        // When open, swipe left slides it shut cleanly
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      clearHoverTimer();
    };
  }, [isOpen]);

  // Natural Shortcode Parser for Non-Study Activities
  // Examples: "tv on", "tv off", "tv 1.5", "watched cricket 45m", "dinner 30m", "walk on"
  const handleShortcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = shortcodeInput.trim();
    if (!raw) return;

    const lower = raw.toLowerCase();

    // Stop active life timer
    if (lower === 'off' || lower === 'stop' || lower.endsWith(' off') || lower.endsWith(' stop')) {
      if (activeSession) {
        playDeskClick();
        onStopSession();
        showFeedback(`Stopped "${activeSession.topic || activeSession.type}"`);
        setShortcodeInput('');
      } else {
        showFeedback('No active timer running right now.');
      }
      return;
    }

    // Start live timer ("tv on", "started watching tv", "walk start")
    if (
      lower.endsWith(' on') ||
      lower.endsWith(' start') ||
      lower.startsWith('started ') ||
      lower.startsWith('start ')
    ) {
      let cleaned = raw
        .replace(/\b(on|start|started)\b/gi, '')
        .trim();
      const alias = SHORTCODE_ALIASES[cleaned.toLowerCase()];
      const finalTopic = alias || cleaned || 'Life Activity';
      playDeskClick();
      onStartLifeTimer(finalTopic);
      showFeedback(`Started live timer: ${finalTopic}`);
      setShortcodeInput('');
      return;
    }

    // Check for duration suffix or embedded duration: "tv 1.5", "tv 45m", "dinner 1h", "watched tv 90m"
    const durationMatch = raw.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes?)?$/i);
    if (durationMatch) {
      let labelPart = durationMatch[1].replace(/^(did|watched)\s+/i, '').trim();
      const numVal = parseFloat(durationMatch[2]);
      const unit = (durationMatch[3] || '').toLowerCase();

      if (!isNaN(numVal) && numVal > 0) {
        const computedMins =
          unit.startsWith('m')
            ? Math.round(numVal)
            : unit.startsWith('h') || numVal <= 8
            ? Math.round(numVal * 60)
            : Math.round(numVal);

        const alias = SHORTCODE_ALIASES[labelPart.toLowerCase()];
        const finalTopic = alias || labelPart || 'Life Activity';

        playEarnedChime();
        onLogPastLifeActivity({ topic: finalTopic, durationMinutes: Math.max(1, computedMins) });
        showFeedback(`Logged ${finalTopic} (${computedMins}m)`);
        setShortcodeInput('');
        return;
      }
    }

    // Fallback: single word alias or plain text -> use current Mode toggle ("Started Now" vs "Already Did")
    const cleanedWord = raw.replace(/^(did|watched)\s+/i, '').trim();
    const resolvedTopic = SHORTCODE_ALIASES[cleanedWord.toLowerCase()] || cleanedWord;

    if (mode === 'start') {
      playDeskClick();
      onStartLifeTimer(resolvedTopic);
      showFeedback(`Started live timer: ${resolvedTopic}`);
    } else {
      playEarnedChime();
      onLogPastLifeActivity({ topic: resolvedTopic, durationMinutes: durationMins });
      showFeedback(`Logged ${resolvedTopic} (${durationMins}m)`);
    }
    setShortcodeInput('');
  };

  const handleBuilderAction = () => {
    const cleanTopic = activityTopic.trim() || 'Life Activity';
    if (mode === 'start') {
      playDeskClick();
      onStartLifeTimer(cleanTopic);
      showFeedback(`Started live timer: ${cleanTopic}`);
    } else {
      const mins = Math.max(1, parseInt(customMinsInput, 10) || durationMins || 30);
      playEarnedChime();
      onLogPastLifeActivity({ topic: cleanTopic, durationMinutes: mins });
      showFeedback(`Logged ${cleanTopic} (${mins}m)`);
    }
  };

  const formatDurationLabel = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  return (
    <>
      {/* Desktop Left-Edge Invisible Hover Strip */}
      <div
        onMouseEnter={handleEdgeMouseEnter}
        className="fixed left-0 top-[18%] bottom-[18%] w-3 z-40 hidden md:block"
        aria-hidden="true"
      />

      {/* Always-Discoverable Left Edge Button (Hover on PC / Tap or Swipe Left on Mobile) */}
      <button
        type="button"
        onMouseEnter={handleEdgeMouseEnter}
        onClick={() => {
          playDeskClick();
          setIsOpen(true);
        }}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 px-1.5 py-3 rounded-r-xl border border-l-0 transition-all duration-200 cursor-pointer shadow-xl ${
          isLifeTimerActive
            ? 'bg-gradient-to-b from-pink-500 to-rose-600 border-pink-300 text-white shadow-[0_0_22px_rgba(236,72,153,0.6)]'
            : 'bg-[#121218]/95 hover:bg-zinc-900 border-pink-500/40 hover:border-pink-400 text-pink-200 hover:pl-2.5'
        } ${isOpen ? 'opacity-0 pointer-events-none -translate-x-2' : 'opacity-100'}`}
        title="Hover or swipe left: Quick Life Shortcode (TV, Meals, Walks, Non-Study)"
        aria-label="Open Life Activity Shortcode Drawer"
      >
        <Tv className={`w-4 h-4 ${isLifeTimerActive ? 'animate-pulse' : 'text-pink-400'}`} />
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
          {isLifeTimerActive ? 'Live' : 'Life'}
        </span>
        <ChevronRight className="w-3 h-3 text-pink-400" />
      </button>

      {/* Backdrop when pinned/tapped open */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            setIsPinned(false);
          }}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] md:bg-black/25 transition-opacity"
        />
      )}

      {/* Slide-Out Left Shortcode Drawer */}
      <aside
        ref={drawerRef}
        onMouseEnter={clearHoverTimer}
        onMouseLeave={handleDrawerMouseLeave}
        aria-label="Life Activity Shortcode Drawer"
        className={`fixed top-0 left-0 bottom-0 z-50 w-[90vw] max-w-[380px] bg-[#0e0f14]/98 backdrop-blur-xl border-r border-pink-500/35 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.9)] flex flex-col transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800/80 bg-gradient-to-r from-pink-950/35 via-[#121218] to-[#0e0f14] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-400/40 flex items-center justify-center text-pink-300 shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-white truncate">
                Life & Leisure Shortcode
              </h3>
              <p className="text-[11px] font-sans text-zinc-400 truncate">
                TV, meals, walks & anything non-study
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setIsPinned((p) => !p);
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isPinned ? 'Unpin drawer' : 'Pin drawer open'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPinned(false);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close drawer"
              aria-label="Close Life Activity Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Active Life Timer Banner if Running */}
          {isLifeTimerActive && activeSession && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                activeSession.isPaused
                  ? 'bg-gradient-to-r from-amber-950/50 to-zinc-950 border-amber-400/60'
                  : 'bg-gradient-to-r from-pink-950/60 to-rose-950/40 border-pink-400/60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeSession.isPaused ? 'bg-amber-400' : 'bg-pink-400 animate-pulse'
                    }`}
                  />
                  <span className="label-scandi text-pink-300">
                    {activeSession.isPaused ? 'Paused Activity' : 'Live Activity'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white truncate mt-0.5">
                  {activeSession.topic}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onPauseSession && onResumeSession && (
                  <button
                    type="button"
                    onClick={() => {
                      playDeskClick();
                      if (activeSession.isPaused) onResumeSession();
                      else onPauseSession();
                    }}
                    className={`interactive-press flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                      activeSession.isPaused
                        ? 'bg-emerald-400 text-zinc-950 border-emerald-300'
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/55 hover:bg-amber-500/30'
                    }`}
                  >
                    {activeSession.isPaused ? (
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
                    onStopSession();
                    showFeedback(`Saved "${activeSession.topic}"`);
                  }}
                  className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer shrink-0"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Toast inside Drawer */}
          {feedbackMsg && (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/50 text-xs font-mono text-emerald-200">
              ✓ {feedbackMsg}
            </div>
          )}

          {/* 1. Fast Command Shortcode Input */}
          <form onSubmit={handleShortcodeSubmit} className="space-y-2">
            <label htmlFor="life-shortcode-input" className="label-scandi text-pink-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Quick Shortcode Command
            </label>
            <div className="relative">
              <input
                id="life-shortcode-input"
                type="text"
                value={shortcodeInput}
                onChange={(e) => setShortcodeInput(e.target.value)}
                placeholder="e.g. tv on, tv 1.5, dinner 45m, tv off"
                className="w-full px-3 py-2.5 pr-16 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-pink-400"
              />
              <button
                type="submit"
                className="interactive-press absolute right-1.5 top-1.5 px-2.5 py-1 text-[11px] font-mono font-bold text-zinc-950 bg-pink-400 hover:bg-pink-300 rounded-lg transition-colors cursor-pointer"
              >
                Run ↵
              </button>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
              Try <span className="text-zinc-300">tv on</span> (started now),{' '}
              <span className="text-zinc-300">tv 1.5</span> (did 1.5h),{' '}
              <span className="text-zinc-300">walk 30m</span>, or <span className="text-zinc-300">tv off</span>.
            </p>
          </form>

          {/* 2. Quick Activity Chips + Did vs Started Mode Builder */}
          <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-zinc-800/90 space-y-3.5">
            <div>
              <span className="label-scandi text-zinc-400 block mb-2">
                Choose or Type Activity
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {LIFE_ACTIVITY_PRESETS.map((preset) => {
                  const IconComp = preset.icon;
                  const isActive = activityTopic.toLowerCase() === preset.label.toLowerCase();
                  return (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => {
                        playDeskClick();
                        setActivityTopic(preset.label);
                        setDurationMins(preset.defaultMins);
                        setCustomMinsInput(String(preset.defaultMins));
                      }}
                      className={`interactive-press flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-pink-500/20 border-pink-400 text-pink-100 font-semibold'
                          : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-pink-500/40'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Activity Name */}
            <input
              type="text"
              value={activityTopic}
              onChange={(e) => setActivityTopic(e.target.value)}
              placeholder="Or type anything (e.g. Watching Cricket, Shopping)"
              className="w-full px-3 py-2 text-xs font-sans bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-pink-400"
            />

            {/* Two-Mode Toggle: "I Already Did This" vs "I Just Started This" */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  setMode('did');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === 'did'
                    ? 'bg-pink-400 text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Already Did</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  setMode('start');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === 'start'
                    ? 'bg-emerald-400 text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Started Now</span>
              </button>
            </div>

            {/* Duration Picker when in "Already Did" Mode */}
            {mode === 'did' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-pink-400" /> How long did you spend?
                  </span>
                  <span className="text-pink-300 font-semibold">
                    {formatDurationLabel(parseInt(customMinsInput, 10) || durationMins)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DURATIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        playDeskClick();
                        setDurationMins(mins);
                        setCustomMinsInput(String(mins));
                      }}
                      className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                        Number(customMinsInput) === mins
                          ? 'bg-pink-500/20 border-pink-400 text-pink-200 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {formatDurationLabel(mins)}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={customMinsInput}
                      onChange={(e) => {
                        setCustomMinsInput(e.target.value);
                        const parsed = parseInt(e.target.value, 10);
                        if (!isNaN(parsed) && parsed > 0) setDurationMins(parsed);
                      }}
                      className="w-14 px-1.5 py-1 text-[11px] font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-pink-400"
                      title="Custom minutes"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleBuilderAction}
              className={`interactive-press w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'start'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 shadow-[0_0_18px_-4px_rgba(52,211,153,0.5)]'
                  : 'bg-gradient-to-r from-pink-400 to-rose-400 text-zinc-950 shadow-[0_0_18px_-4px_rgba(244,114,182,0.5)]'
              }`}
            >
              {mode === 'start' ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Live Timer ({activityTopic || 'Activity'})</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    Log {formatDurationLabel(parseInt(customMinsInput, 10) || durationMins)} of{' '}
                    {activityTopic || 'Activity'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 3. Today's Logged Non-Study Life Activities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-scandi text-zinc-400">
                Today's Life Logs ({lifeEntriesToday.length})
              </span>
              <span className="text-[11px] font-mono text-pink-300 font-semibold">
                {formatDurationLabel(totalLifeMinutesToday)} total
              </span>
            </div>

            {lifeEntriesToday.length === 0 ? (
              <p className="text-xs font-sans text-zinc-500 p-3 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800">
                No non-study life activities logged today yet. Log TV, meals, walks, or calls above — they count on your 24h timeline without affecting your 6h Study Quota.
              </p>
            ) : (
              <div className="space-y-1.5">
                {lifeEntriesToday
                  .slice()
                  .reverse()
                  .map((entry) => {
                    const startD = new Date(entry.startTime);
                    const timeLabel = !isNaN(startD.getTime())
                      ? startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    return (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-100 truncate">
                            {entry.topic || 'Life Activity'}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            {timeLabel} · {formatDurationLabel(entry.durationMinutes || 0)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playDeskClick();
                            onUndoEntry(entry.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                          title="Remove entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
