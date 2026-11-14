import { Award, BookOpen, Flame, Play, Square, Target, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';

interface StudyQuotaCardProps {
  completedStudyMinutesToday: number;
  isStudyActive: boolean;
  activeStudyDurationSeconds: number;
  studyDeficitCarryForwardMinutes: number; // e.g. 120 mins from yesterday
  currentStreak: number;
  level: number;
  onStartStudy: (topic: string) => void;
  onStopSession: () => void;
  onShortcodeSubmit: (command: string) => void;
}

const QUICK_TOPICS = ['Deep Work', 'DSA / Coding', 'System Design', 'Revision'];

export const StudyQuotaCard: React.FC<StudyQuotaCardProps> = ({
  completedStudyMinutesToday,
  isStudyActive,
  activeStudyDurationSeconds,
  studyDeficitCarryForwardMinutes,
  currentStreak,
  level,
  onStartStudy,
  onStopSession,
  onShortcodeSubmit,
}) => {
  const [studyTopicInput, setStudyTopicInput] = useState('');
  const [commandInput, setCommandInput] = useState('');

  const BASE_TARGET_MINUTES = 6 * 60; // 360 mins (6h)
  const effectiveTargetMinutes = BASE_TARGET_MINUTES + Math.max(0, studyDeficitCarryForwardMinutes);

  const currentStudySeconds =
    completedStudyMinutesToday * 60 + (isStudyActive ? activeStudyDurationSeconds : 0);
  const currentStudyMinutes = Math.round(currentStudySeconds / 60);

  const remainingMinutes = Math.max(0, effectiveTargetMinutes - currentStudyMinutes);
  const isGoalReached = currentStudyMinutes >= effectiveTargetMinutes;

  const percentage = Math.min(100, Math.round((currentStudyMinutes / effectiveTargetMinutes) * 100));

  const formatHm = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const handleStartStudyClick = () => {
    playDeskClick();
    onStartStudy(studyTopicInput.trim() || 'General Study');
    setStudyTopicInput('');
  };

  const handleShortcodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    playDeskClick();
    onShortcodeSubmit(commandInput.trim());
    setCommandInput('');
  };

  return (
    <div
      className={`studio-card p-5 rounded-2xl border flex flex-col justify-between gap-4 relative overflow-hidden ${
        isStudyActive
          ? 'bg-gradient-to-br from-[#0d241c] via-[#111817] to-[#121216] border-emerald-400/75 shadow-[0_0_38px_-10px_rgba(16,185,129,0.5)]'
          : isGoalReached
          ? 'bg-gradient-to-br from-[#0e221b] via-[#121616] to-[#121216] border-emerald-500/45 shadow-[0_12px_36px_-16px_rgba(16,185,129,0.35)]'
          : 'bg-gradient-to-br from-[#0c1a16] via-[#121215] to-[#111318] border-emerald-500/20 hover:border-emerald-400/50'
      }`}
    >
      {/* Subtle Ambient Corner Radiance */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-35"
        style={{ background: isStudyActive ? 'radial-gradient(circle, #34d399, transparent 70%)' : 'radial-gradient(circle, #10b981, transparent 70%)' }}
      />

      {/* Header & Progress */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-display text-base font-semibold tracking-tight text-white">
              6-Hour Study Quota
            </h3>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-zinc-400">
            <div className="flex items-center gap-1 text-amber-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentStreak}d</span>
            </div>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Lv {level}</span>
            </div>
          </div>
        </div>

        {/* Study Target and Progress */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="label-scandi text-emerald-300/80 block mb-1">
              {isGoalReached ? 'Daily Target Completed' : 'Focus Hours Completed'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tracking-tight text-white tabular-nums">
                {formatHm(currentStudyMinutes)}
              </span>
              <span className="text-xs font-mono text-zinc-400 tabular-nums">
                / {formatHm(effectiveTargetMinutes)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="label-scandi text-zinc-400 block mb-1">Status</span>
            <span
              className={`text-xs font-mono font-semibold ${
                isGoalReached ? 'text-emerald-300' : 'text-emerald-400/90'
              }`}
            >
              {isGoalReached ? 'Quota Reached (+100 XP)' : `${formatHm(remainingMinutes)} left · ${percentage}%`}
            </span>
          </div>
        </div>

        {/* Luminous Shimmering Progress Bar */}
        <div className="mt-4 w-full h-2 bg-zinc-950 border border-emerald-500/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 progress-shimmer shadow-[0_0_12px_rgba(52,211,153,0.65)]"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Deficit notice if yesterday or Vault carried forward */}
        {studyDeficitCarryForwardMinutes > 0 && (
          <div className="mt-3 text-xs font-mono text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Carried forward debt:</span>
            </div>
            <span className="font-semibold text-emerald-400">+{formatHm(studyDeficitCarryForwardMinutes)}</span>
          </div>
        )}
      </div>

      {/* Study Topic + Interactive Quick Chips + Study (S on) + Quick Shortcode Bar */}
      <div className="pt-3.5 border-t border-zinc-800/80 space-y-3 relative">
        {/* Interactive Quick Topic Selector */}
        {!isStudyActive && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-scandi text-zinc-400 flex items-center gap-1 mr-0.5">
              <Zap className="w-3 h-3 text-emerald-400" /> Quick:
            </span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  playDeskClick();
                  setStudyTopicInput(topic);
                }}
                className={`interactive-press px-2.5 py-0.5 text-[11px] font-sans rounded-md border transition-all cursor-pointer ${
                  studyTopicInput === topic
                    ? 'bg-emerald-400/20 border-emerald-400 text-emerald-200 font-semibold shadow-[0_0_12px_-3px_rgba(52,211,153,0.6)]'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-emerald-200 hover:border-emerald-500/40'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Study Topic + S on / Stop */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={studyTopicInput}
            onChange={(e) => setStudyTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isStudyActive) {
                e.preventDefault();
                handleStartStudyClick();
              }
            }}
            placeholder="Study Topic (e.g. Compiler Design)"
            className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-zinc-950/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
          />
          {isStudyActive ? (
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onStopSession();
              }}
              className="interactive-press flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:brightness-110 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_16px_-4px_rgba(220,38,38,0.6)]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop (S off)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartStudyClick}
              className="interactive-press flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-lg hover:brightness-110 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_20px_-4px_rgba(52,211,153,0.65)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Study (S on)</span>
            </button>
          )}
        </div>

        {/* Quick Shortcode Bar */}
        <form onSubmit={handleShortcodeFormSubmit}>
          <label htmlFor="study-shortcode-input" className="block label-scandi text-zinc-400 mb-1.5">
            Quick Shortcode Bar <span className="font-mono normal-case tracking-normal text-zinc-500">(S on topic, S off, bon, boff, riyaz 3, undo)</span>
          </label>
          <div className="relative">
            <input
              id="study-shortcode-input"
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type shortcode & press Enter..."
              className="w-full px-3 py-2 pr-16 text-xs font-mono bg-zinc-950/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
            />
            <button
              type="submit"
              className="interactive-press absolute right-1.5 top-1.5 px-2 py-1 text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded hover:border-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              Enter ↵
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
