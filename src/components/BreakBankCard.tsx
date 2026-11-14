import confetti from 'canvas-confetti';
import { AlertTriangle, Coffee, Sparkles, Square, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playBreakExhaustedAlert, playDeskClick, playEarnedChime } from '../lib/audioAlert';

interface BreakBankCardProps {
  usedBreakMinutesToday: number;
  isBreakActive: boolean;
  activeBreakDurationSeconds: number;
  bankedCarryForwardMinutes: number;
  onStartBreak: () => void;
  onStopBreak: () => void;
}

export const BreakBankCard: React.FC<BreakBankCardProps> = ({
  usedBreakMinutesToday,
  isBreakActive,
  activeBreakDurationSeconds,
  bankedCarryForwardMinutes,
  onStartBreak,
  onStopBreak,
}) => {
  const BASE_QUOTA_SECONDS = 2 * 60 * 60; // 7,200 seconds (2h)
  const totalUsedSeconds = Math.round(usedBreakMinutesToday * 60) + (isBreakActive ? activeBreakDurationSeconds : 0);
  const remainingSeconds = BASE_QUOTA_SECONDS - totalUsedSeconds;
  const isExhausted = remainingSeconds <= 0;

  const [hasAlerted, setHasAlerted] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${isExhausted ? 'bg-red-950/70 border-red-500/40' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <Coffee className={`w-4 h-4 ${isExhausted ? 'text-red-400' : 'text-amber-400'}`} />
            </div>
            <h3 className="font-display text-base font-semibold tracking-tight text-white">
              2-Hour Break Bank
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-zinc-400">
            <span>{Math.round(totalUsedSeconds / 60)}m / 120m used</span>
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
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              onStopBreak();
            }}
            className="interactive-press w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 rounded-lg transition-all shadow-[0_0_18px_-4px_rgba(220,38,38,0.6)] cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Break (boff)</span>
          </button>
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
