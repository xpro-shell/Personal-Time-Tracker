import { ChevronRight, Flame, Radio, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AchievementItem, TickerSettings } from '../types/tracker';

interface AchievementNewsTickerProps {
  achievements: AchievementItem[];
  tickerSettings: TickerSettings;
  flashTrigger?: number;
  onOpenAchievementsTab: () => void;
}

export const AchievementNewsTicker: React.FC<AchievementNewsTickerProps> = ({
  achievements,
  tickerSettings,
  flashTrigger = 0,
  onOpenAchievementsTab,
}) => {
  const tickerItems = useMemo(
    () => achievements.filter((a) => a.showInTicker),
    [achievements]
  );

  const intervalSeconds = Math.max(5, tickerSettings.intervalSeconds || 120);
  const fadeAfterSeconds =
    typeof tickerSettings.fadeAfterSeconds === 'number'
      ? Math.max(0, tickerSettings.fadeAfterSeconds)
      : 20;
  const scrollSpeed = tickerSettings.scrollSpeed || 'normal';

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [flashPulse, setFlashPulse] = useState<boolean>(false);
  const [waveId, setWaveId] = useState<number>(1);

  const fadeTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
  };

  const triggerBroadcastWave = (withPulse = true) => {
    clearTimers();
    setIsVisible(true);
    setWaveId((w) => w + 1);

    if (withPulse) {
      setFlashPulse(true);
      pulseTimerRef.current = window.setTimeout(() => {
        setFlashPulse(false);
      }, 1800);
    }

    if (fadeAfterSeconds > 0) {
      fadeTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, fadeAfterSeconds * 1000);
    }
  };

  // Trigger broadcast on mount, manual flash, or when ticker timing settings update
  useEffect(() => {
    if (!tickerSettings.enabled) {
      clearTimers();
      setIsVisible(false);
      return;
    }

    triggerBroadcastWave(flashTrigger > 0);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tickerSettings.enabled,
    intervalSeconds,
    fadeAfterSeconds,
    flashTrigger,
    tickerItems.length,
  ]);

  // Recurring broadcast schedule every `intervalSeconds`
  useEffect(() => {
    if (!tickerSettings.enabled) return;

    const repeatMs = intervalSeconds * 1000;
    const intervalId = window.setInterval(() => {
      triggerBroadcastWave(true);
    }, repeatMs);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerSettings.enabled, intervalSeconds, fadeAfterSeconds]);

  // Build seamless duplicated items for one half of the marquee track
  const halfTrackItems = useMemo(() => {
    if (tickerItems.length === 0) return [];
    const repeatCount = tickerItems.length === 1 ? 4 : tickerItems.length === 2 ? 3 : 2;
    const expanded: Array<AchievementItem & { _dupKey: string }> = [];
    for (let r = 0; r < repeatCount; r++) {
      tickerItems.forEach((item, idx) => {
        expanded.push({ ...item, _dupKey: `${item.id}_${r}_${idx}` });
      });
    }
    return expanded;
  }, [tickerItems]);

  // Calculate balanced marquee duration (in seconds) based on text volume & speed setting
  const marqueeDurationSeconds = useMemo(() => {
    const speedMultiplier =
      scrollSpeed === 'fast' ? 0.65 : scrollSpeed === 'slow' ? 1.55 : 1;

    if (tickerItems.length === 0) {
      return Math.round(18 * speedMultiplier);
    }
    const totalChars = halfTrackItems.reduce(
      (sum, item) => sum + item.title.length + (item.category?.length || 0) + 12,
      0
    );
    // Roughly 7.5 chars/sec at normal speed, clamped to comfortable range
    const baseSecs = Math.min(60, Math.max(16, totalChars / 7.5));
    return Math.max(10, Math.round(baseSecs * speedMultiplier));
  }, [halfTrackItems, tickerItems.length, scrollSpeed]);

  if (!tickerSettings.enabled) return null;

  const formatDurationShort = (secs: number) => {
    if (secs === 0) return 'Always On';
    if (secs < 60) return `${secs}s`;
    const mins = Math.round((secs / 60) * 10) / 10;
    return `${mins}m`;
  };

  return (
    <div
      aria-live="polite"
      className={`relative w-full overflow-hidden transition-all duration-700 ease-in-out ${
        isVisible
          ? 'opacity-100 max-h-16 translate-y-0 border-b'
          : 'opacity-0 max-h-0 -translate-y-1 border-b-0 pointer-events-none'
      } ${
        flashPulse
          ? 'bg-gradient-to-r from-emerald-950/80 via-[#10231b] to-amber-950/50 border-emerald-400/75 shadow-[0_6px_24px_-6px_rgba(52,211,153,0.5)]'
          : 'bg-gradient-to-r from-[#0c1412] via-[#0e0f14] to-[#131018] border-zinc-800/80 hover:border-emerald-500/40'
      }`}
    >
      <div
        onClick={onOpenAchievementsTab}
        role="button"
        tabIndex={isVisible ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenAchievementsTab();
        }}
        className="w-full px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 text-xs cursor-pointer select-none"
        title="Live Achievement News Ticker · Hover to pause, click to manage"
      >
        {/* Left Broadcast Pill Label */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 rounded text-[10px] font-sans font-bold tracking-[0.14em] uppercase shrink-0 shadow-[0_0_12px_-2px_rgba(52,211,153,0.55)]">
            {tickerItems.length > 0 ? (
              <Flame className={`w-3 h-3 fill-current ${flashPulse ? 'animate-bounce' : ''}`} />
            ) : (
              <Radio className="w-3 h-3" />
            )}
            <span>{tickerItems.length > 0 ? 'Live Wins' : 'Wins Flash'}</span>
          </span>
        </div>

        {/* Center Continuous News Channel Moving Marquee */}
        <div
          className="news-ticker-viewport news-ticker-mask flex-1 min-w-0 overflow-hidden"
          style={{ ['--ticker-duration' as string]: `${marqueeDurationSeconds}s` }}
        >
          <div className="news-ticker-track items-center">
            {tickerItems.length === 0 ? (
              <>
                {[0, 1].map((copyIdx) => (
                  <div key={copyIdx} className="flex items-center shrink-0">
                    <span className="inline-flex items-center gap-2 px-6 text-zinc-300 font-sans whitespace-nowrap">
                      <span>🔥</span>
                      <span>
                        No pinned achievements yet — open the{' '}
                        <strong className="text-emerald-300 font-semibold">Achievements</strong> tab to write wins & watch them glide live across this news ticker
                      </span>
                      <span className="text-emerald-500/70 font-mono">✦</span>
                    </span>
                    <span className="inline-flex items-center gap-2 px-6 text-zinc-400 font-sans whitespace-nowrap">
                      <span>🏆</span>
                      <span>
                        Customize broadcast repeat frequency & auto-fade timer inside Achievements Studio
                      </span>
                      <span className="text-emerald-500/70 font-mono">✦</span>
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[0, 1].map((copyIdx) => (
                  <div
                    key={copyIdx}
                    aria-hidden={copyIdx === 1}
                    className="flex items-center shrink-0"
                  >
                    {halfTrackItems.map((item) => (
                      <div
                        key={`${copyIdx}_${item._dupKey}`}
                        className="inline-flex items-center gap-2.5 px-5 whitespace-nowrap"
                      >
                        <span className="text-sm shrink-0" aria-hidden="true">
                          {item.emoji || '🔥'}
                        </span>
                        <span className="font-sans font-medium text-zinc-100 tracking-tight">
                          {item.title}
                        </span>
                        {item.category && (
                          <span className="label-scandi text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                            {item.category}
                          </span>
                        )}
                        <span className="text-emerald-400/50 pl-2 font-mono" aria-hidden="true">
                          ◆
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Timing Meta + Manage + Manual Fade Button */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 shrink-0 z-10">
          <span className="hidden md:inline text-zinc-500">
            Every {formatDurationShort(intervalSeconds)}
            {fadeAfterSeconds > 0 ? ` · Fades ${formatDurationShort(fadeAfterSeconds)}` : ' · Pinned'}
          </span>
          <span className="flex items-center gap-0.5 text-emerald-400 font-sans uppercase tracking-[0.12em] font-semibold">
            <span className="hidden sm:inline">Manage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearTimers();
              setIsVisible(false);
            }}
            className="p-0.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Fade out now (returns next scheduled cycle)"
            aria-label="Fade out ticker now"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Subtle Bottom Fade-Countdown Hairline */}
      {isVisible && fadeAfterSeconds > 0 && (
        <div
          key={waveId}
          style={{ ['--fade-duration' as string]: `${fadeAfterSeconds}s` }}
          className="animate-ticker-countdown h-[2px] w-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 opacity-75"
        />
      )}
    </div>
  );
};
