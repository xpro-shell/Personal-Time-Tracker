import { CheckCircle2, Sparkles, Zap } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import { TimeEntry } from '../types/tracker';

interface InsightsTipsProps {
  entries: TimeEntry[];
}

export const InsightsTips: React.FC<InsightsTipsProps> = ({ entries }) => {
  const [pinnedPrinciples, setPinnedPrinciples] = useState<string[]>([]);

  const togglePrinciple = (title: string) => {
    playDeskClick();
    setPinnedPrinciples((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Analyze best focus hours from user logs
  const personalPattern = useMemo(() => {
    if (entries.length < 5) {
      return {
        hasEnoughData: false,
        message:
          'Personal focus pattern analysis needs a few days of logged study blocks before calculating your optimal peak window.',
        peakHourRange: 'Analyzing...',
      };
    }

    const hourCounts: Record<number, number> = {};
    entries.forEach((e) => {
      if (e.type === 'study') {
        const d = new Date(e.startTime);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          hourCounts[h] = (hourCounts[h] || 0) + (e.durationMinutes || 30);
        }
      }
    });

    let bestHour = 9;
    let maxMinutes = 0;
    Object.entries(hourCounts).forEach(([hStr, mins]) => {
      if (mins > maxMinutes) {
        maxMinutes = mins;
        bestHour = parseInt(hStr, 10);
      }
    });

    const startH = bestHour.toString().padStart(2, '0');
    const endH = ((bestHour + 3) % 24).toString().padStart(2, '0');

    return {
      hasEnoughData: true,
      message: `Your highest sustained study density is between ${startH}:00 and ${endH}:00. Protect this window from non-study interruptions.`,
      peakHourRange: `${startH}:00 – ${endH}:00`,
    };
  }, [entries]);

  const generalScienceTips = [
    {
      title: 'Active Retrieval Practice',
      tag: 'Learning Science',
      body: 'Closing the book and reciting or writing down concepts from memory yields 2.5× higher retention than re-reading notes.',
    },
    {
      title: 'Spaced Repetition Intervals',
      tag: 'Memory Curve',
      body: 'Review difficult topics at increasing intervals (Day 1, Day 3, Day 7, Day 21) to reset the forgetting curve.',
    },
    {
      title: 'Interleaving Topics',
      tag: 'Deep Practice',
      body: 'Mixing related subjects (e.g. 90m Compiler Design + 60m Operating Systems) trains discrimination and long-term problem solving.',
    },
    {
      title: 'The 2-Hour Break Ceiling',
      tag: 'Desk Protocol',
      body: 'Long unstructured breaks create desk friction. Keeping your daily break bank capped at 2 hours preserves focus momentum.',
    },
  ];

  return (
    <div className="studio-card p-6 rounded-2xl bg-gradient-to-br from-[#14131e] via-[#121215] to-[#0d1915] border border-zinc-800/80 hover:border-zinc-700 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-white">
              Insights & Focus Science
            </h3>
            <span className="label-scandi text-zinc-400 block mt-0.5">
              Tap any principle below to commit it to today's focus protocol
            </span>
          </div>
        </div>
        {pinnedPrinciples.length > 0 && (
          <span className="text-xs font-mono text-emerald-300 font-semibold">
            {pinnedPrinciples.length} protocol{pinnedPrinciples.length > 1 ? 's' : ''} committed
          </span>
        )}
      </div>

      {/* Personal Data-Driven Tip */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/35 via-zinc-950/80 to-teal-950/25 border border-emerald-500/25 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="font-display text-sm font-semibold text-white">
              Personal Log Insight · Peak Focus Window
            </h4>
          </div>
          <span className="label-scandi text-emerald-400">
            Derived from logs
          </span>
        </div>
        <p className="text-xs font-sans text-zinc-300 leading-relaxed">
          {personalPattern.message}
        </p>
        {personalPattern.hasEnoughData && (
          <div className="mt-2 text-xs font-mono text-emerald-300 font-semibold">
            Primary Peak Window: {personalPattern.peakHourRange}
          </div>
        )}
      </div>

      {/* Interactive Principle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {generalScienceTips.map((tip) => {
          const isPinned = pinnedPrinciples.includes(tip.title);
          return (
            <button
              key={tip.title}
              type="button"
              onClick={() => togglePrinciple(tip.title)}
              className={`interactive-press text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isPinned
                  ? 'bg-gradient-to-br from-emerald-950/65 via-[#10201a] to-teal-950/40 border-emerald-400/75 shadow-[0_0_24px_-6px_rgba(16,185,129,0.4)]'
                  : 'bg-zinc-950/70 border-zinc-800/90 hover:border-emerald-500/40 hover:bg-zinc-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h5 className="font-display text-base font-semibold text-white flex items-center gap-1.5">
                    {isPinned && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    <span>{tip.title}</span>
                  </h5>
                  <span className={`label-scandi shrink-0 ${isPinned ? 'text-emerald-300' : 'text-emerald-400/80'}`}>
                    {tip.tag}
                  </span>
                </div>
                <p className="text-xs font-sans text-zinc-300/90 leading-relaxed">{tip.body}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
