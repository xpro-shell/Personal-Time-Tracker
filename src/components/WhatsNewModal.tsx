import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  MoonStar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

export const CURRENT_APP_VERSION = '2.5.4';
export const RELEASE_CODENAME = 'Clean Personalized Studio Header';
export const SEEN_VERSION_STORAGE_KEY = 'ptt_seen_app_version_v1';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_HIGHLIGHTS = [
  {
    icon: Sparkles,
    accent: 'text-cyan-400',
    title: 'Clean Greeting, Motivation & Date Header',
    detail:
      'Activity Progress Studio greets you by time of day using your local profile name (default: Focus Pilot), shows a short motivational line, and displays only the active date underneath.',
  },
  {
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    title: 'Streamlined Desk Flow (Section 07 Removed)',
    detail:
      'Removed Section 07 (Accountability & Focus Principles) from the Desk Flow view for a cleaner, distraction-free workspace.',
  },
  {
    icon: Clock,
    accent: 'text-emerald-400',
    title: 'Compact Clock Icon with Hover "Log" Label',
    detail:
      'Study Quota, Break Bank, Restorative Sleep, and all Custom Habits show a clean Clock icon that expands to reveal "Log" on hover, with manual logging removed from Desk Command Center.',
  },
  {
    icon: Activity,
    accent: 'text-purple-400',
    title: 'New "Studio Matrix" Progress Template',
    detail:
      'Added the Studio Matrix layout inside Progress & Graphs featuring top KPI cards, a colored multi-activity consistency matrix, detailed bars, and live insights styled from your software colors and local habits.',
  },
  {
    icon: ShieldCheck,
    accent: 'text-teal-400',
    title: 'Zero-Data-Loss Updates',
    detail:
      'All existing logs, carried balances, Vault hours, custom habits, and active timers stay completely intact.',
  },
];

const EARLIER_RELEASES = [
  {
    version: 'v2.5.1 · Retroactive Study, Break & Habit Logging',
    items: [
      {
        icon: BookOpen,
        accent: 'text-teal-400',
        title: 'Inline Past Loggers Inside Study Quota & Break Bank',
        detail:
          'Log Study Focus, Content Creation, or Break sessions with synced Start/End times, quick duration chips, notes, and automatic debt/Vault clearance.',
      },
      {
        icon: Zap,
        accent: 'text-cyan-400',
        title: 'Quick Shortcode Retroactive Logging',
        detail:
          'Type shortcuts like "s 45m", "study DSA 1.5h", "b 20m", "c 1h", or "desk 2h" inside the Quick Shortcode Bar to instantly record completed blocks.',
      },
      {
        icon: Coffee,
        accent: 'text-amber-400',
        title: 'Multi-Session Custom Habit Logging',
        detail:
          'Custom Habit time windows append extra sessions cleanly instead of overwriting earlier logs (with an optional replace toggle).',
      },
    ],
  },
  {
    version: 'v2.5.0 · Midnight Continuity & Time Recovery',
    items: [
      {
        icon: MoonStar,
        accent: 'text-emerald-400',
        title: 'Session-Aware Midnight Rollover',
        detail: 'Active Study, Break, or Sleep sessions crossing 12:00 AM stay on their original assigned date with all notes preserved.',
      },
      {
        icon: CalendarClock,
        accent: 'text-cyan-400',
        title: 'Open Desk Timer Continuity & Reset to Today',
        detail: 'Leaving Desk Timer open past midnight keeps yesterday open until you click "Reset to Today" or Day Logout.',
      },
      {
        icon: ArrowLeftRight,
        accent: 'text-teal-400',
        title: '1-Click Send Tracked Time Back to Yesterday',
        detail: 'Move post-midnight logs back to yesterday from the Past Weekday banner or "Prev Day" button in Activity Progress.',
      },
    ],
  },
  {
    version: 'v2.4.0 · RankPulse & Desk Telemetry',
    items: [
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
    ],
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

        {/* Collapsible Earlier Release Notes (v2.5.0 & v2.4.0) */}
        <div className="border border-zinc-800/70 rounded-xl bg-[#0b0c10]/70 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              playDeskClick();
              setShowPrevious((prev) => !prev);
            }}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Earlier Releases (v2.5.1, v2.5.0 &amp; v2.4.0)</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showPrevious ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showPrevious && (
            <div className="border-t border-zinc-800/70 divide-y divide-zinc-800/70">
              {EARLIER_RELEASES.map((rel) => (
                <div key={rel.version} className="py-2">
                  <div className="px-3.5 py-1 text-[11px] font-mono font-semibold text-zinc-300">
                    {rel.version}
                  </div>
                  {rel.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="px-3.5 py-2 flex items-start gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${item.accent} shrink-0 mt-0.5`} />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200">{item.title}</div>
                          <div className="text-[11px] font-sans text-zinc-400">{item.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] font-mono text-zinc-500">
            Re-open anytime from top bar or Reset: 00:00
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
