import { BookOpen, Clock, Coffee, Inbox, Moon, Sparkles, Tv, X } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { CustomHabit, EntryType } from '../types/tracker';

export interface PendingHourPrompt {
  id: string;
  date: string;
  hour: number;
  hourLabel: string;
  startTime: string;
  endTime: string;
  uncountedMinutes: number;
}

interface HourlyCheckInModalProps {
  prompt: PendingHourPrompt | null;
  habits: CustomHabit[];
  onResolveHour: (options: {
    prompt: PendingHourPrompt;
    type: EntryType;
    topic: string;
    habitId?: string;
    durationMinutes: number;
  }) => void;
  onSendToReviewQueue: (prompt: PendingHourPrompt, note?: string) => void;
}

const QUICK_ACTIVITIES = [
  { label: 'Deep Study', type: 'study' as EntryType },
  { label: 'Watching TV', type: 'life' as EntryType },
  { label: 'Meal / Dinner', type: 'life' as EntryType },
  { label: 'Break / Rest', type: 'break' as EntryType },
  { label: 'Power Nap', type: 'sleep' as EntryType },
];

export const HourlyCheckInModal: React.FC<HourlyCheckInModalProps> = ({
  prompt,
  habits,
  onResolveHour,
  onSendToReviewQueue,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [durationInput, setDurationInput] = useState<string>('');

  if (!prompt) return null;

  const effectiveMins = Math.min(
    60,
    Math.max(5, parseInt(durationInput, 10) || prompt.uncountedMinutes || 60)
  );

  const handleLog = (type: EntryType, fallbackTopic: string, habitId?: string) => {
    playEarnedChime();
    onResolveHour({
      prompt,
      type,
      topic: topicInput.trim() || fallbackTopic,
      habitId,
      durationMinutes: effectiveMins,
    });
    setTopicInput('');
    setDurationInput('');
  };

  const handleQueue = () => {
    playDeskClick();
    onSendToReviewQueue(prompt, topicInput.trim() || undefined);
    setTopicInput('');
    setDurationInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Hourly Check-In Reminder"
      onClick={handleQueue}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[#111216] border border-emerald-500/45 shadow-[0_24px_70px_-15px_rgba(16,185,129,0.45)] overflow-hidden"
      >
        {/* Top Accent Strip */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950/60 via-[#12161a] to-[#121216] border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="label-scandi text-emerald-400 block">
                1-Hour Check-In Reminder
              </span>
              <h3 className="font-display text-base sm:text-lg font-semibold text-white">
                What did you do during {prompt.hourLabel}?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQueue}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Send to Review Queue for later"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5">
            <span>
              Slot: <strong className="text-zinc-100">{prompt.date}</strong> · {prompt.hourLabel}
            </span>
            <span className="text-amber-300 font-semibold">
              {prompt.uncountedMinutes}m uncounted
            </span>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIVITIES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  playDeskClick();
                  setTopicInput(q.label);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                  topicInput === q.label
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Activity Topic + Minutes Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-9">
              <input
                type="text"
                autoFocus
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Write what you did (e.g. DSA Practice, Watching TV, Dinner)..."
                className="w-full px-3.5 py-2.5 text-sm font-sans bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="sm:col-span-3">
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="60"
                  placeholder={String(prompt.uncountedMinutes)}
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="w-full px-3 py-2.5 pr-8 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400"
                  title="Minutes to log"
                />
                <span className="absolute right-2.5 top-2.5 text-[11px] font-mono text-zinc-500">m</span>
              </div>
            </div>
          </div>

          {/* Action Choices Matching App Software */}
          <div className="space-y-2">
            <span className="label-scandi text-zinc-400 block">
              Log Directly To:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleLog('study', 'Study Session')}
                className="interactive-press flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study</span>
              </button>

              <button
                type="button"
                onClick={() => handleLog('life', 'Life / Leisure')}
                className="interactive-press flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-pink-400 hover:bg-pink-300 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Life / TV</span>
              </button>

              <button
                type="button"
                onClick={() => handleLog('break', 'Break')}
                className="interactive-press flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Break</span>
              </button>

              <button
                type="button"
                onClick={() => handleLog('sleep', 'Restorative Sleep')}
                className="interactive-press flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-indigo-400 hover:bg-indigo-300 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Sleep</span>
              </button>
            </div>

            {/* Optional Custom Habits Strip */}
            {habits.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Habit:
                </span>
                {habits.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleLog(h.entryType, h.name, h.id)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-200 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Send to Review Queue */}
        <div className="px-5 py-3.5 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between gap-3">
          <span className="text-[11px] font-sans text-zinc-500">
            Not sure now? Queue it cleanly for later action.
          </span>
          <button
            type="button"
            onClick={handleQueue}
            className="interactive-press flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Inbox className="w-3.5 h-3.5 text-cyan-400" />
            <span>Send to Review Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
