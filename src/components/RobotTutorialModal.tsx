import confetti from 'canvas-confetti';
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Command,
  EyeOff,
  Flame,
  Moon,
  Music,
  ShieldAlert,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

interface RobotTutorialModalProps {
  isOpen: boolean;
  onSkipForNow: () => void;
  onDoNotShowAgain: () => void;
  onCompleteLesson: () => void;
  onNavigateTab: (tab: 'desk' | 'timeline' | 'achievements' | 'importer' | 'vault' | 'review') => void;
}

interface WalkthroughStep {
  id: string;
  targetElementId: string;
  targetTab: 'desk' | 'timeline' | 'achievements' | 'importer' | 'vault' | 'review';
  sectionTag: string;
  title: string;
  whatItIsFor: string;
  howToUse: string[];
  botVisorHex: string;
  accentTextClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'command',
    targetElementId: 'section-command',
    targetTab: 'desk',
    sectionTag: 'Section 01 · Highlighted on screen',
    title: 'Desk Command Center',
    whatItIsFor: 'Tracks how long your desk session has been active since logging in and runs your daily sign-out check.',
    howToUse: [
      'Click "Day Login" when you sit down — the elapsed timer starts counting up.',
      'Hit "Undo Last" anytime if you accidentally logged the wrong entry.',
      'Click "Day Logout (OTD)" when finished to auto-check missing quotas or celebrate completion.',
    ],
    botVisorHex: '#fbbf24',
    accentTextClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    icon: <Command className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'focus',
    targetElementId: 'section-focus',
    targetTab: 'desk',
    sectionTag: 'Section 02 · Highlighted on screen',
    title: '6-Hour Study Quota & Shortcodes',
    whatItIsFor: 'Tracks your 6-hour daily deep focus goal and lets you control the whole app using fast keyboard shortcodes.',
    howToUse: [
      'Pick a Quick Topic chip (like DSA or Revision) or type your own, then click "Study (S on)".',
      'Or use the Quick Shortcode Bar: type "s on Math", "s off", "bon", "boff", "riyaz 3", or "undo" + Enter.',
    ],
    botVisorHex: '#10b981',
    accentTextClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50',
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'break',
    targetElementId: 'section-break',
    targetTab: 'desk',
    sectionTag: 'Section 03 · Highlighted on screen',
    title: '2-Hour Break Bank',
    whatItIsFor: 'Keeps your breaks disciplined with a live 2-hour countdown timer and emergency alert if you go over.',
    howToUse: [
      'Click "Break (bon)" at the bottom of this card whenever stepping away from the desk.',
      'Click "End Break (boff)" when back — unused minutes roll into your Carry-Forward Reserve.',
    ],
    botVisorHex: '#f59e0b',
    accentTextClass: 'text-amber-300',
    borderClass: 'border-amber-500/50',
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'sleep',
    targetElementId: 'section-sleep',
    targetTab: 'desk',
    sectionTag: 'Section 04 · Highlighted on screen',
    title: 'Restorative Sleep Tracker',
    whatItIsFor: 'Logs your sleep hours so overnight rest shows up in calm indigo instead of red unlogged lost time.',
    howToUse: [
      'Click "Log Sleep", choose bedtime → wake-up (or tap a preset like 23:00 → 07:00), and hit Save.',
      'Or tap "Start Night Timer" if tracking live overnight.',
    ],
    botVisorHex: '#818cf8',
    accentTextClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/50',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
  },
  {
    id: 'habits',
    targetElementId: 'section-habits',
    targetTab: 'desk',
    sectionTag: 'Section 05 · Highlighted on screen',
    title: 'Practice & Habits Hub',
    whatItIsFor: 'Tracks daily habits like Riyaz (+3h) or any custom routines you add (Gym, Reading, Coding).',
    howToUse: [
      'Tap "Track (Auto +3h)" to mark it done immediately from the current time.',
      'Forgot to tap earlier? Click the Clock icon next to it to set your real past start/end time.',
      'Click "Customize / Add Habits" to rename Riyaz, change colors, or create new habits.',
    ],
    botVisorHex: '#c084fc',
    accentTextClass: 'text-purple-400',
    borderClass: 'border-purple-500/50',
    icon: <Music className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'timeline',
    targetElementId: 'section-timeline',
    targetTab: 'desk',
    sectionTag: 'Section 06 · Highlighted on screen',
    title: '24-Hour Timeline & Charts',
    whatItIsFor: 'Reveals every hour of your day visually—highlighting unlogged gaps in RED so nothing gets wasted.',
    howToUse: [
      'Switch views between 24h Heatmap, Candlestick, Donut/Pie, and Stacked Bar.',
      'Click any red unlogged gap or logged entry to inspect or delete it.',
    ],
    botVisorHex: '#2dd4bf',
    accentTextClass: 'text-teal-400',
    borderClass: 'border-teal-500/50',
    icon: <BarChart3 className="w-4 h-4 text-teal-400" />,
  },
  {
    id: 'vault',
    targetElementId: 'section-vault',
    targetTab: 'vault',
    sectionTag: 'Vault Tab · Highlighted on screen',
    title: 'Vault of Lost Time & Recovery',
    whatItIsFor: 'Safely archives uncompleted focus shortfalls so tomorrow starts clean—while letting you reclaim them anytime.',
    howToUse: [
      'On any archived or pending shortfall, click "Carry Forward (+Xh)" or "Write Reason".',
      'Type your honest reason and confirm to add those hours back into your active Study Quota.',
    ],
    botVisorHex: '#fbbf24',
    accentTextClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'achievements',
    targetElementId: 'section-achievements',
    targetTab: 'achievements',
    sectionTag: 'Achievements Tab + Top Ticker',
    title: 'Personal Wins & News Bar',
    whatItIsFor: 'Lets ONLY you write milestones that flash across the thin news-channel bar at the top every 2 minutes.',
    howToUse: [
      'Pick an emoji (🔥, 🏆, ⚡), type your achievement, and click "Add Win".',
      'Adjust the flash frequency (default 2m or custom minutes) in the top-right ticker box.',
      'Need this guide again later? Tap "Intro" in the top header anytime!',
    ],
    botVisorHex: '#34d399',
    accentTextClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/60',
    icon: <Award className="w-4 h-4 text-emerald-400" />,
  },
];

export const RobotTutorialModal: React.FC<RobotTutorialModalProps> = ({
  isOpen,
  onSkipForNow,
  onDoNotShowAgain,
  onCompleteLesson,
  onNavigateTab,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isDancing, setIsDancing] = useState(true);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setIsDancing(true);
    }
  }, [isOpen]);

  const onNavigateTabRef = React.useRef(onNavigateTab);
  onNavigateTabRef.current = onNavigateTab;

  // Live Spotlight Effect: Switch tab, scroll target section into view, and apply glowing highlight ring
  useEffect(() => {
    if (!isOpen) return;

    const currentStep = WALKTHROUGH_STEPS[stepIndex];
    onNavigateTabRef.current(currentStep.targetTab);

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    let highlightedEl: HTMLElement | null = null;

    // Wait briefly so tab DOM mounts cleanly
    scrollTimer = setTimeout(() => {
      const targetEl = document.getElementById(currentStep.targetElementId);
      if (targetEl) {
        highlightedEl = targetEl;
        targetEl.classList.add('tutorial-spotlight-active');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 90);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      if (highlightedEl) {
        highlightedEl.classList.remove('tutorial-spotlight-active');
      }
      WALKTHROUGH_STEPS.forEach((s) => {
        document.getElementById(s.targetElementId)?.classList.remove('tutorial-spotlight-active');
      });
    };
  }, [isOpen, stepIndex]);

  if (!isOpen) return null;

  const step = WALKTHROUGH_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WALKTHROUGH_STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / WALKTHROUGH_STEPS.length) * 100);

  const handleNext = () => {
    if (isLast) {
      playEarnedChime();
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#fbbf24', '#34d399', '#ffffff'],
      });
      onNavigateTab('desk');
      onCompleteLesson();
    } else {
      playDeskClick();
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      playDeskClick();
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    playDeskClick();
    onNavigateTab('desk');
    onSkipForNow();
  };

  const handleDisableStartup = () => {
    playDeskClick();
    onNavigateTab('desk');
    onDoNotShowAgain();
  };

  return (
    <div
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 sm:w-full sm:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-label="Interactive Section Walkthrough"
    >
      <div
        className={`rounded-2xl bg-[#101216]/95 backdrop-blur-xl border ${step.borderClass} shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden`}
      >
        {/* Top Progress Bar */}
        <div className="w-full h-1 bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Compact Header */}
        <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {step.icon}
            <span className={`text-[11px] font-mono font-semibold ${step.accentTextClass}`}>
              {step.sectionTag}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
              {stepIndex + 1} / {WALKTHROUGH_STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setIsDancing((d) => !d);
              }}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-900 border border-zinc-800 text-emerald-300 hover:border-emerald-500/40 cursor-pointer"
              title="Toggle CoachBot animation"
            >
              {isDancing ? '♪ Bot' : 'Paused'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
              title="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body: Dancing Robot Teacher + "What it's for" & "How to use it" */}
        <div className="p-4 flex gap-3.5 items-start">
          {/* Compact Dancing Teacher Robot */}
          <div className="shrink-0 flex flex-col items-center pt-1">
            {isDancing && (
              <div className="flex gap-2 text-[10px] font-mono leading-none mb-0.5 select-none pointer-events-none">
                <span className="animate-bot-note text-emerald-400">♪</span>
                <span className="animate-bot-note text-amber-400" style={{ animationDelay: '0.6s' }}>
                  ✦
                </span>
              </div>
            )}
            <svg
              viewBox="0 0 170 185"
              className={`w-20 h-22 sm:w-24 sm:h-26 drop-shadow-[0_8px_14px_rgba(0,0,0,0.75)] ${
                isDancing ? 'animate-bot-dance' : ''
              }`}
              role="img"
              aria-label="CoachBot pointing to highlighted section"
            >
              <line x1="85" y1="18" x2="85" y2="34" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="85" cy="14" r="6" fill={step.botVisorHex} />
              <polygon points="56,36 85,26 114,36 85,44" fill="#27272a" stroke={step.botVisorHex} strokeWidth="1.5" />
              <rect x="48" y="38" width="74" height="44" rx="14" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
              <rect x="41" y="51" width="7" height="18" rx="3.5" fill={step.botVisorHex} opacity="0.85" />
              <rect x="122" y="51" width="7" height="18" rx="3.5" fill={step.botVisorHex} opacity="0.85" />
              <rect x="57" y="47" width="56" height="24" rx="8" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
              <circle cx="72" cy="58" r="4.2" fill={step.botVisorHex} />
              <circle cx="98" cy="58" r="4.2" fill={step.botVisorHex} />
              <circle cx="73.2" cy="56.8" r="1.3" fill="#ffffff" />
              <circle cx="99.2" cy="56.8" r="1.3" fill="#ffffff" />
              <path d="M 77 65 Q 85 70 93 65" fill="none" stroke={step.botVisorHex} strokeWidth="2" strokeLinecap="round" />
              <rect x="76" y="82" width="18" height="8" rx="3" fill="#3f3f46" />
              <g className={isDancing ? 'animate-bot-arm-groove' : ''}>
                <rect x="33" y="92" width="14" height="36" rx="7" fill="#27272a" stroke="#52525b" strokeWidth="2" />
                <circle cx="40" cy="131" r="6" fill={step.botVisorHex} opacity="0.9" />
              </g>
              <g className={isDancing ? 'animate-bot-arm-wave' : ''}>
                <rect x="123" y="92" width="14" height="36" rx="7" fill="#27272a" stroke="#52525b" strokeWidth="2" />
                <circle cx="130" cy="131" r="6" fill={step.botVisorHex} opacity="0.9" />
                <line x1="133" y1="131" x2="156" y2="100" stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="157" cy="99" r="3.5" fill="#fbbf24" />
              </g>
              <rect x="52" y="90" width="66" height="52" rx="14" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
              <rect x="65" y="102" width="40" height="24" rx="6" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
              <rect x="72" y="111" width="5" height="10" rx="2" fill={step.botVisorHex} />
              <rect x="82.5" y="106" width="5" height="15" rx="2" fill="#fbbf24" />
              <rect x="93" y="109" width="5" height="12" rx="2" fill={step.botVisorHex} />
              <rect x="64" y="142" width="12" height="24" rx="5" fill="#27272a" stroke="#52525b" strokeWidth="2" />
              <rect x="94" y="142" width="12" height="24" rx="5" fill="#27272a" stroke="#52525b" strokeWidth="2" />
              <rect x="59" y="164" width="20" height="9" rx="4.5" fill={step.botVisorHex} opacity="0.85" />
              <rect x="91" y="164" width="20" height="9" rx="4.5" fill={step.botVisorHex} opacity="0.85" />
            </svg>
          </div>

          {/* Practical Live Explanation */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">
                <strong className="text-zinc-100">Purpose:</strong> {step.whatItIsFor}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                How to use it:
              </span>
              <ul className="space-y-1 text-[11px] sm:text-xs text-zinc-200 leading-snug">
                {step.howToUse.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`font-mono font-bold ${step.accentTextClass} shrink-0`}>
                      {i + 1}.
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Step Dots + Footer Actions */}
        <div className="px-4 py-3 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSkip}
              className="px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer"
              title="Close for now — shows again next startup"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleDisableStartup}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-amber-300 bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 rounded-md transition-colors cursor-pointer"
              title="Don't show automatically on startup (tap Intro anytime to replay)"
            >
              <EyeOff className="w-3 h-3" />
              <span className="hidden xs:inline sm:inline">Do Not Show Again</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm ${
                isLast
                  ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950'
              }`}
            >
              <span>{isLast ? 'Finish (+25 XP)' : 'Next Section'}</span>
              {isLast ? <Flame className="w-3.5 h-3.5 fill-current" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
