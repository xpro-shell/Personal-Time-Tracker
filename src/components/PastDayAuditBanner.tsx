import { AlertTriangle, Archive, ArrowRight, CheckCircle2, History, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

export interface UnreconciledPastDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Monday, 9 Nov 2026"
  loggedStudyMinutes: number;
  studyQuotaMinutes: number; // 360 (6h)
  deficitMinutes: number;
}

interface PastDayAuditBannerProps {
  unreconciledDays: UnreconciledPastDay[];
  onVaultPastDay: (day: UnreconciledPastDay, reason?: string) => void;
  onCarryForwardPastDay: (day: UnreconciledPastDay, reason: string) => void;
  onVaultAllPastDays: () => void;
}

export const PastDayAuditBanner: React.FC<PastDayAuditBannerProps> = ({
  unreconciledDays,
  onVaultPastDay,
  onCarryForwardPastDay,
  onVaultAllPastDays,
}) => {
  const [activeDayForCarry, setActiveDayForCarry] = useState<UnreconciledPastDay | null>(null);
  const [carryReason, setCarryReason] = useState('');
  const [errorText, setErrorText] = useState('');

  if (unreconciledDays.length === 0) return null;

  const totalDeficitHours = Math.round(
    (unreconciledDays.reduce((acc, d) => acc + d.deficitMinutes, 0) / 60) * 10
  ) / 10;

  const handleConfirmCarry = () => {
    if (!activeDayForCarry) return;
    if (!carryReason.trim()) {
      setErrorText('A brief reason is required to carry forward study debt to today.');
      return;
    }
    playEarnedChime();
    onCarryForwardPastDay(activeDayForCarry, carryReason.trim());
    setActiveDayForCarry(null);
    setCarryReason('');
    setErrorText('');
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#121215] border border-zinc-700/80 shadow-lg space-y-3 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="label-scandi text-zinc-200">
            Unreconciled Past Weekday Ledger Detected
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playDeskClick();
              onVaultAllPastDays();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
            title="Move unlogged past hours directly into the Vault of Lost Time"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Send All to Vault of Lost Time (-{totalDeficitHours}h)</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Previous weekdays this week have uncompleted or unlogged study quotas. You can archive them into the <strong className="text-zinc-200">Vault of Lost Time</strong> so today starts fresh, or carry them forward into today's focus target with a written reason.
      </p>

      {/* List of Unreconciled Days */}
      <div className="space-y-2 pt-1">
        {unreconciledDays.map((day) => {
          const loggedH = Math.round((day.loggedStudyMinutes / 60) * 10) / 10;
          const deficitH = Math.round((day.deficitMinutes / 60) * 10) / 10;

          return (
            <div
              key={day.date}
              className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-100 font-semibold">{day.dayLabel}</span>
                  <span aria-hidden="true" className="text-zinc-700">·</span>
                  <span className="text-zinc-400">{loggedH}h / 6.0h logged</span>
                </div>
                <div className="text-emerald-400 mt-0.5">
                  Unstudied Shortfall: <span className="font-bold">-{deficitH} hours</span>
                </div>
              </div>

              {/* Action Buttons for this day */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    playDeskClick();
                    onVaultPastDay(day);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Archive unstudied hours into Vault of Lost Time"
                >
                  <Archive className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Send to Vault</span>
                </button>

                <button
                  onClick={() => {
                    setActiveDayForCarry(day);
                    setCarryReason('');
                    setErrorText('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-950 bg-zinc-100 rounded hover:bg-white transition-colors cursor-pointer"
                  title="Carry forward unstudied shortfall into today's quota"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Carry Forward (+{deficitH}h)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Modal for providing reason when carrying forward */}
      {activeDayForCarry && (
        <div className="p-3.5 bg-zinc-950 border border-zinc-700 rounded-lg space-y-2.5 text-xs font-mono animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-200">
              Carry Forward {Math.round(activeDayForCarry.deficitMinutes / 60)}h from {activeDayForCarry.dayLabel}
            </span>
            <button
              onClick={() => setActiveDayForCarry(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans">
            Please enter a reason why this deficit should carry forward into today's focus target.
          </p>
          <input
            type="text"
            value={carryReason}
            onChange={(e) => {
              setCarryReason(e.target.value);
              setErrorText('');
            }}
            placeholder='e.g. "Forgot to log desk sessions", "Travel day", "Exam prep"'
            className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
          />
          {errorText && <span className="text-red-400 block text-[11px]">{errorText}</span>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setActiveDayForCarry(null)}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCarry}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded cursor-pointer"
            >
              Authorize & Add to Today's Quota
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
