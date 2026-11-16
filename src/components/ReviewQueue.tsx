import {
  Bell,
  BellOff,
  BookOpen,
  Clock,
  Coffee,
  Inbox,
  Moon,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Tv,
} from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { CustomHabit, EntryType, HourlyReviewItem } from '../types/tracker';

interface ReviewQueueProps {
  hourlyItems: HourlyReviewItem[];
  habits: CustomHabit[];
  hourlyReminderEnabled: boolean;
  autoSendBlankHours: boolean;
  secondsUntilNextReminder: number;
  onToggleHourlyReminder: () => void;
  onToggleAutoSendBlankHours: () => void;
  onTriggerTestPromptNow: () => void;
  onScanBlankHoursToday: () => number;
  onResolveItem: (options: {
    item: HourlyReviewItem;
    type: EntryType;
    topic: string;
    habitId?: string;
    durationMinutes: number;
  }) => void;
  onSendToVault: (item: HourlyReviewItem, reason: string) => void;
  onDismissItem: (id: string) => void;
  onClearAll: () => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  hourlyItems,
  habits,
  hourlyReminderEnabled,
  autoSendBlankHours,
  secondsUntilNextReminder,
  onToggleHourlyReminder,
  onToggleAutoSendBlankHours,
  onTriggerTestPromptNow,
  onScanBlankHoursToday,
  onResolveItem,
  onSendToVault,
  onDismissItem,
  onClearAll,
}) => {
  const [itemTopics, setItemTopics] = useState<Record<string, string>>({});
  const [itemDurations, setItemDurations] = useState<Record<string, number>>({});
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleScanClick = () => {
    playDeskClick();
    const added = onScanBlankHoursToday();
    const msg =
      added > 0
        ? `Queued ${added} uncounted blank hour${added === 1 ? '' : 's'} from today.`
        : 'All completed hours since login already have activity or are queued.';
    setScanMessage(msg);
    window.setTimeout(() => {
      setScanMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleResolve = (
    item: HourlyReviewItem,
    type: EntryType,
    fallbackTopic: string,
    habitId?: string
  ) => {
    playEarnedChime();
    const topic = (itemTopics[item.id] ?? item.note ?? '').trim() || fallbackTopic;
    const durationMinutes = Math.min(
      60,
      Math.max(5, itemDurations[item.id] || item.uncountedMinutes || 60)
    );
    onResolveItem({ item, type, topic, habitId, durationMinutes });
  };

  const handleVault = (item: HourlyReviewItem) => {
    playDeskClick();
    const reason =
      (itemTopics[item.id] ?? item.note ?? '').trim() ||
      `Uncounted hour (${item.hourLabel}) sent to Vault of Lost Time`;
    onSendToVault(item, reason);
  };

  return (
    <div id="section-review" className="space-y-6">
      {/* Header & 1-Hour Reminder Engine Controls */}
      <div className="studio-card p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0f171d] via-[#121216] to-[#121318] border border-cyan-500/25 shadow-xl shadow-black/40 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-300 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white">
                Hourly Review Queue ({hourlyItems.length})
              </h2>
              <p className="text-xs font-sans text-zinc-400 mt-0.5">
                Blank or uncounted hours from your 1-hour reminders land here cleanly so you can classify them according to your workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onTriggerTestPromptNow();
              }}
              className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 rounded-lg cursor-pointer shadow-[0_0_16px_-4px_rgba(34,211,238,0.55)]"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ask 1h Prompt Now</span>
            </button>

            <button
              type="button"
              onClick={handleScanClick}
              className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scan Blank Hours</span>
            </button>

            {hourlyItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  onClearAll();
                }}
                className="interactive-press flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-red-300 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Bar: Hourly Reminder Countdown + Auto-Queue Toggle */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onToggleHourlyReminder();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                hourlyReminderEnabled
                  ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {hourlyReminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>1-Hour Reminder: {hourlyReminderEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onToggleAutoSendBlankHours();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                autoSendBlankHours
                  ? 'bg-cyan-500/15 border-cyan-400/45 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <span>Auto-Queue Uncounted Hours: {autoSendBlankHours ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="text-zinc-400 tabular-nums">
            {hourlyReminderEnabled ? (
              <span>
                Next check-in in <strong className="text-cyan-300">{formatCountdown(secondsUntilNextReminder)}</strong>
              </span>
            ) : (
              <span>Hourly pop-up paused</span>
            )}
          </div>
        </div>

        {scanMessage && (
          <div className="px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/35 text-xs font-mono text-cyan-200">
            {scanMessage}
          </div>
        )}
      </div>

      {/* Queue List OR Clean Blank State */}
      {hourlyItems.length === 0 ? (
        <div className="studio-card p-12 rounded-2xl bg-[#121215] border border-dashed border-zinc-800 text-center space-y-2.5">
          <Inbox className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="font-display text-lg font-medium text-zinc-200">
            Review Queue is Blank
          </h3>
          <p className="text-xs font-sans text-zinc-500 max-w-md mx-auto leading-relaxed">
            Any uncounted 1-hour slot from your hourly reminders or silent blank hours after login will appear here automatically so you can assign it to Study, Break, Life/TV, Sleep, Habits, or the Vault of Lost Time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hourlyItems.map((item) => {
            const topicVal = itemTopics[item.id] ?? item.note ?? '';
            const durationVal = itemDurations[item.id] ?? item.uncountedMinutes ?? 60;

            return (
              <div
                key={item.id}
                className="studio-card p-5 rounded-2xl bg-[#121216] border border-zinc-800/90 hover:border-cyan-500/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/70">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-white text-sm">{item.hourLabel}</span>
                    <span className="text-zinc-600" aria-hidden="true">·</span>
                    <span className="text-zinc-400">{item.date}</span>
                    <span className="text-zinc-600" aria-hidden="true">·</span>
                    <span className="text-amber-300 font-semibold">
                      {item.uncountedMinutes}m blank
                    </span>
                  </div>

                  <span className="label-scandi text-cyan-400">
                    {item.source === 'hourly_prompt'
                      ? 'Queued from 1h Reminder'
                      : item.source === 'manual_scan'
                      ? 'Scanned Blank Slot'
                      : 'Auto-Detected Blank Hour'}
                  </span>
                </div>

                {/* Note / Activity & Minutes */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-9">
                    <input
                      type="text"
                      value={topicVal}
                      onChange={(e) =>
                        setItemTopics((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="What did you do in this hour? (e.g. DSA Study, Watching TV, Lunch, Nap)..."
                      className="w-full px-3.5 py-2 text-xs font-sans bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={durationVal}
                      onChange={(e) =>
                        setItemDurations((prev) => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value, 10) || 60,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-400"
                      title="Minutes to assign"
                    />
                    <span className="text-xs font-mono text-zinc-500 shrink-0">mins</span>
                  </div>
                </div>

                {/* Software Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResolve(item, 'study', 'Study Session')}
                      className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolve(item, 'life', 'Life / Leisure')}
                      className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-pink-400 hover:bg-pink-300 rounded-lg cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Life / TV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolve(item, 'break', 'Break')}
                      className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Break</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolve(item, 'sleep', 'Power Nap / Sleep')}
                      className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg cursor-pointer"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Sleep</span>
                    </button>

                    {habits.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleResolve(item, h.entryType, h.name, h.id)}
                        className="interactive-press flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 rounded-lg cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{h.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVault(item)}
                      className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/60 border border-red-700/60 rounded-lg cursor-pointer"
                      title="Archive this uncounted hour into Vault of Lost Time"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>Vault</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playDeskClick();
                        onDismissItem(item.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
                      title="Dismiss without logging"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
