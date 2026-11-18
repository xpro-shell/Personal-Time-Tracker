import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import React from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

export const CURRENT_APP_VERSION = '2.4.0';
export const RELEASE_CODENAME = 'RankPulse & Desk Telemetry';
export const SEEN_VERSION_STORAGE_KEY = 'ptt_seen_app_version_v1';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_HIGHLIGHTS = [
  {
    icon: Clock,
    accent: 'text-teal-400',
    title: 'Active Desk Time Now Tracked & Graphed',
    detail:
      'Live desk attendance (plus pause/resume) is recorded on Day Logout and graphed live across Hours, This Week, Weeks, Months, Years, and Growth Cards.',
  },
  {
    icon: Bot,
    accent: 'text-cyan-400',
    title: 'RankPulse AI Growth Chatbot (In Beta · Testing)',
    detail:
      'Tap the floating RankPulse circle inside Progress & Graphs to ask exact questions about 1-week % growth, active desk time, or all-time tracker stats.',
  },
  {
    icon: TrendingUp,
    accent: 'text-emerald-400',
    title: 'Growth Cards & Yesterday Deltas',
    detail:
      'Switch to the Growth Cards template or inspect any graph to see percentage growth or degrowth compared to yesterday.',
  },
  {
    icon: Activity,
    accent: 'text-purple-400',
    title: 'Refined Activity Pills, Pause Controls & Sleep Anytime',
    detail:
      'Smooth-scrolling rounded activity filters, hover-expanding Desk Pause button, pauseable activity timers, and any-hour Sleep logging.',
  },
  {
    icon: ShieldCheck,
    accent: 'text-amber-400',
    title: 'Zero-Data-Loss Updates & Local Backup',
    detail:
      'Timestamp-reconciled IndexedDB + LocalStorage sync preserves existing history across git pull updates, with JSON Backup/Restore in Reset: 00:00.',
  },
];

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
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

        {/* Feature List */}
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
