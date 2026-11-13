import { ChevronRight, Flame, Radio } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AchievementItem, TickerSettings } from '../types/tracker';

interface AchievementNewsTickerProps {
  achievements: AchievementItem[];
  tickerSettings: TickerSettings;
  onOpenAchievementsTab: () => void;
}

export const AchievementNewsTicker: React.FC<AchievementNewsTickerProps> = ({
  achievements,
  tickerSettings,
  onOpenAchievementsTab,
}) => {
  const tickerItems = achievements.filter((a) => a.showInTicker);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flashPulse, setFlashPulse] = useState(false);

  // Reset index safely when items change
  useEffect(() => {
    if (activeIndex >= tickerItems.length) {
      setActiveIndex(0);
    }
  }, [tickerItems.length, activeIndex]);

  // Rotate / flash ticker every `intervalSeconds` (default 120s = 2 minutes)
  useEffect(() => {
    if (!tickerSettings.enabled || tickerItems.length === 0) return;

    const intervalMs = Math.max(5, tickerSettings.intervalSeconds || 120) * 1000;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tickerItems.length);
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 1800);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [tickerSettings.enabled, tickerSettings.intervalSeconds, tickerItems.length]);

  if (!tickerSettings.enabled) return null;

  const formatIntervalLabel = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.round((secs / 60) * 10) / 10;
    return `${mins}m`;
  };

  if (tickerItems.length === 0) {
    return (
      <div
        onClick={onOpenAchievementsTab}
        className="w-full bg-[#111116] border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between gap-4 text-xs font-mono cursor-pointer hover:bg-zinc-900/80 transition-colors"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded text-[10px] font-bold tracking-wider uppercase text-amber-400 shrink-0">
            <Radio className="w-3 h-3" />
            <span>Wins Flash</span>
          </span>
          <span className="text-zinc-400 truncate">
            🔥 No pinned achievements yet — tap <strong className="text-zinc-200">Achievements</strong> tab to write your first milestone for the live ticker
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-amber-400 shrink-0 font-semibold">
          <span>Write</span>
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    );
  }

  const currentItem = tickerItems[activeIndex % tickerItems.length];

  return (
    <div
      onClick={onOpenAchievementsTab}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenAchievementsTab();
      }}
      className={`w-full border-b px-4 py-1.5 flex items-center justify-between gap-4 text-xs cursor-pointer transition-all duration-500 select-none ${
        flashPulse
          ? 'bg-gradient-to-r from-amber-950/80 via-[#1b1610] to-amber-950/80 border-amber-400/70'
          : 'bg-[#101014] border-amber-500/25 hover:bg-[#15151b]'
      }`}
      title="Click to manage Achievements & Ticker frequency"
    >
      {/* Left News-Channel Live Badge + Thin Marquee Headline */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 rounded text-[10px] font-extrabold tracking-widest uppercase shrink-0 shadow-sm">
          <Flame className={`w-3 h-3 fill-current ${flashPulse ? 'animate-bounce' : ''}`} />
          <span>Achievement</span>
        </span>

        <div
          key={currentItem.id}
          className="flex items-center gap-2 min-w-0 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <span className="text-sm shrink-0" aria-hidden="true">
            {currentItem.emoji || '🔥'}
          </span>
          <span className="font-sans font-semibold text-zinc-100 truncate tracking-tight">
            {currentItem.title}
          </span>
          {currentItem.category && (
            <>
              <span className="text-zinc-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[11px] font-mono text-amber-400/90 hidden sm:inline shrink-0">
                {currentItem.category}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Meta: Counter + Interval + Edit Link */}
      <div className="flex items-center gap-2.5 text-[10px] font-mono text-zinc-400 shrink-0">
        {tickerItems.length > 1 && (
          <span className="hidden md:inline tabular-nums">
            {(activeIndex % tickerItems.length) + 1}/{tickerItems.length}
          </span>
        )}
        <span className="hidden sm:inline text-zinc-500">
          Every {formatIntervalLabel(tickerSettings.intervalSeconds)}
        </span>
        <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
          <span className="hidden sm:inline">Manage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
