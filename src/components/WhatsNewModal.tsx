import {
  Activity,
  ArrowLeftRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  MoonStar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

export const CURRENT_APP_VERSION = '2.5.0';
export const RELEASE_CODENAME = 'Midnight Continuity & Time Recovery';
export const SEEN_VERSION_STORAGE_KEY = 'ptt_seen_app_version_v1';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_HIGHLIGHTS = [
  {
    icon: MoonStar,
    accent: 'text-emerald-400',
    title: 'Session-Aware Midnight Rollover',
    detail:
      'Active Study, Break, or Sleep sessions crossing 12:00 AM stay on their original assigned date—including all notes added after midnight—until you stop the session.',
  },
  {
    icon: CalendarClock,
    accent: 'text-cyan-400',
    title: 'Open Desk Timer Continuity & Reset to Today',
    detail:
      'If your Desk Timer stays logged in past midnight, yesterday stays open so you can finish remaining quota. Click "Reset to Today" inside Desk Command Center whenever ready to advance.',
  },
  {
    icon: ArrowLeftRight,
    accent: 'text-teal-400',
    title: '1-Click Send Tracked Time Back to Yesterday',
    detail:
      'Use "Send Time Back" in the Past Weekday banner or "Prev Day" on any entry in Activity Progress to move post-midnight logs back to yesterday and auto-clear shortfall or Vault debt.',
  },
  {
    icon: CheckCircle2,
    accent: 'text-purple-400',
    title: 'Distraction-Free Tracking (Hourly Reminders Removed)',
    detail:
      'Completely removed automatic 1-hour untracked-time popups and background checks while preserving all manual timers, notes, and shortcuts.',
  },
  {
    icon: ShieldCheck,
    accent: 'text-amber-400',
    title: 'Zero-Data-Loss Updates',
    detail:
      'Existing logs, carried-forward balances, Vault hours, custom habits, and XP stay untouched across git pull updates.',
  },
];

const PREVIOUS_V240_HIGHLIGHTS = [
  {
    icon: Clock,
    accent: 'text-teal-400',
    title: 'Active Desk Time Tracked & Graphed',
    detail: 'Live desk attendance graphed across Hours, This Week, Weeks, Months, Years, and Growth Cards.',
  },
  {
    icon: Bot,
    accent: 'text-cyan-400',
    title: 'RankPulse AI Growth Chatbot (In Beta · Testing)',
    detail: 'Circular growth assistant inside Progress & Graphs for 1-week % growth and all-time stats.',
  },
  {
    icon: TrendingUp,
    accent: 'text-emerald-400',
    title: 'Growth Cards & Yesterday Deltas',
    detail: 'Card template comparing today vs yesterday % growth or degrowth.',
  },
  {
    icon: Activity,
    accent: 'text-purple-400',
    title: 'Refined Activity Pills, Hover Pause & Anytime Sleep',
    detail: 'Rounded activity filter pills, compact expanding Desk Pause control, and 24h Sleep logging.',
  },
];

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  const [showPrevious, setShowPrevious] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
    >
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[#111216] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative space-y-5">
        <button
          type="button"
          onClick={() => {
            playDeskClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          aria-label="Close release notes"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Software Updated</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Version {CURRENT_APP_VERSION}</span>
          </div>
          <h2
            id="whats-new-title"
            className="font-display text-2xl font-bold tracking-tight text-white"
          >
            What&apos;s New in v{CURRENT_APP_VERSION}
          </h2>
          <p className="text-xs font-sans text-zinc-400">
            {RELEASE_CODENAME} — all your saved entries, Vault hours, XP, and habits stay intact.
          </p>
        </div>

        {/* Current Release Feature List */}
        <div className="divide-y divide-zinc-800/80 border border-zinc-800/90 rounded-xl bg-[#0b0c10] overflow-hidden">
          {RELEASE_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                  <Icon className={`w-4 h-4 ${item.accent}`} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-100">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-sans text-zinc-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Earlier Release Notes (v2.4.0) */}
        <div className="border border-zinc-800/70 rounded-xl bg-[#0b0c10]/70 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              setShowPrevious((prev) => !prev);
            }}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Earlier Release (v2.4.0 · RankPulse &amp; Desk Telemetry)</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showPrevious ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showPrevious && (
            <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/70">
              {PREVIOUS_V240_HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="px-3.5 py-2.5 flex items-start gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${item.accent} shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200">{item.title}</div>
                      <div className="text-[11px] font-sans text-zinc-400">{item.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] font-mono text-zinc-500">
            Re-open anytime inside Reset: 00:00
          </span>
          <button
            type="button"
            onClick={() => {
              playEarnedChime();
              onClose();
            }}
            className="interactive-press flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Continue to Desk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
