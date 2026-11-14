import { Check, CheckCircle2, Clock, DollarSign, FileQuestion, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { GapItem, ReviewItem, TimeEntry } from '../types/tracker';

interface ReviewQueueProps {
  reviewItems: ReviewItem[];
  toFillGaps: GapItem[];
  onDismissReviewItem: (id: string) => void;
  onFillGap: (gapId: string, durationMinutes: number, type: 'study' | 'break') => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  reviewItems,
  toFillGaps,
  onDismissReviewItem,
  onFillGap,
}) => {
  const [fillDuration, setFillDuration] = useState<Record<string, number>>({});
  const [fillType, setFillType] = useState<Record<string, 'study' | 'break'>>({});

  return (
    <div className="space-y-6">
      {/* 1. "To Fill" List (Unclear or Missing Entries) */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-base font-semibold tracking-tight text-white">
              "To Fill" Queue ({toFillGaps.length})
            </h2>
          </div>
          <span className="label-scandi text-zinc-500">Unclosed Sessions & Missing Offs</span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Entries like an "S on" with no "S off" or unclosed breaks go here. You can fill in the missing duration whenever you like.
        </p>

        {toFillGaps.length > 0 ? (
          <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-lg overflow-hidden">
            {toFillGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-4 bg-zinc-950/40 hover:bg-zinc-900/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 font-semibold">{gap.type.replace(/_/g, ' ')}</span>
                    <span aria-hidden="true" className="text-zinc-700">·</span>
                    <span className="text-zinc-400">
                      {new Date(gap.startTime).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans">{gap.description}</p>
                </div>

                {/* Fill Form */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={fillType[gap.id] || 'study'}
                    onChange={(e) =>
                      setFillType({ ...fillType, [gap.id]: e.target.value as 'study' | 'break' })
                    }
                    className="px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="study">Study</option>
                    <option value="break">Break</option>
                  </select>

                  <input
                    type="number"
                    min="5"
                    max="600"
                    placeholder="Mins (e.g. 60)"
                    value={fillDuration[gap.id] || ''}
                    onChange={(e) =>
                      setFillDuration({ ...fillDuration, [gap.id]: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-24 px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
                  />

                  <button
                    onClick={() => {
                      const dur = fillDuration[gap.id] || 45;
                      const typ = fillType[gap.id] || 'study';
                      onFillGap(gap.id, dur, typ);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded hover:bg-emerald-300 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Fill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-mono text-zinc-400">
              All desk sessions have matching starts and stops. No gaps pending.
            </p>
          </div>
        )}
      </div>

      {/* 2. Review Notes List (Numbers & Amounts from WhatsApp) */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-base font-semibold tracking-tight text-white">
              Numbers, Amounts & Non-Time Notes ({reviewItems.length})
            </h2>
          </div>
          <span className="label-scandi text-zinc-500">Never Guessed Automatically</span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Chat entries containing random numbers, cash amounts, or non-time chatter are placed here so they never corrupt your focus time statistics.
        </p>

        {reviewItems.length > 0 ? (
          <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-lg overflow-hidden">
            {reviewItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-zinc-950/40 hover:bg-zinc-900/30 transition-colors flex items-center justify-between gap-4 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-zinc-100 font-semibold font-mono text-sm">
                      "{item.rawMessage}"
                    </span>
                    <span aria-hidden="true" className="text-zinc-700">·</span>
                    <span className="text-zinc-500">
                      {new Date(item.timestamp).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">{item.reason}</span>
                </div>

                <button
                  onClick={() => onDismissReviewItem(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Dismiss</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
            <FileQuestion className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
            <p className="text-xs font-mono text-zinc-400">
              Review queue is clear. No unclassified numbers or amounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
