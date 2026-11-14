import confetti from 'canvas-confetti';
import { AlertCircle, Archive, Check, CheckCircle2, ShieldAlert, Trophy, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';

export interface DailyCompletionStatus {
  studyCompleted: boolean;
  studyRemainingMinutes: number;
  sleepLogged: boolean;
  habitsStatus: Array<{ id: string; name: string; completed: boolean }>;
}

interface DayCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyMinutesToday: number;
  breakMinutesToday: number;
  studyDeficitMinutes: number; // >0 means shortfall
  breakSurplusMinutes: number; // >0 means unused break
  dailyCompletionStatus?: DailyCompletionStatus;
  onConfirmReconciliation: (data: {
    carryForwardApproved: boolean;
    reason: string;
    action: 'carry_forward' | 'send_to_vault';
  }) => void;
}

export const DayCloseModal: React.FC<DayCloseModalProps> = ({
  isOpen,
  onClose,
  studyMinutesToday,
  breakMinutesToday,
  studyDeficitMinutes,
  breakSurplusMinutes,
  dailyCompletionStatus,
  onConfirmReconciliation,
}) => {
  const [reasonInput, setReasonInput] = useState('');
  const [errorText, setErrorText] = useState('');

  const formatHm = (mins: number) => {
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Auto-detect incomplete items across Focus Quota, Sleep, and all Active Habits
  const missingItems: string[] = [];
  if (dailyCompletionStatus) {
    if (!dailyCompletionStatus.studyCompleted) {
      missingItems.push(
        `6h Study Quota (${formatHm(dailyCompletionStatus.studyRemainingMinutes)} remaining)`
      );
    }
    if (!dailyCompletionStatus.sleepLogged) {
      missingItems.push('Restorative Sleep Entry');
    }
    dailyCompletionStatus.habitsStatus.forEach((h) => {
      if (!h.completed) {
        missingItems.push(h.name);
      }
    });
  } else if (studyDeficitMinutes > 0) {
    missingItems.push(`6h Study Quota (${formatHm(studyDeficitMinutes)} remaining)`);
  }

  const isAllCompleted = missingItems.length === 0;
  const hasDeficit = studyDeficitMinutes > 0;

  // Trigger victory confetti & celebration chime automatically when all quotas & habits are complete
  useEffect(() => {
    if (isOpen && isAllCompleted) {
      playEarnedChime();
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#10b981', '#ffffff', '#f59e0b'],
      });
    }
  }, [isOpen, isAllCompleted]);

  if (!isOpen) return null;

  const handleApproveCarryForward = () => {
    if (hasDeficit && !reasonInput.trim()) {
      setErrorText('A written reason is required to authorize carrying forward study debt.');
      return;
    }
    playEarnedChime();
    onConfirmReconciliation({
      carryForwardApproved: true,
      reason: reasonInput.trim() || 'Day closed cleanly with full completion.',
      action: 'carry_forward',
    });
    onClose();
  };

  const handleSendToVault = () => {
    playDeskClick();
    onConfirmReconciliation({
      carryForwardApproved: false,
      reason: reasonInput.trim() || 'Written off into Vault of Lost Time',
      action: 'send_to_vault',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative my-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 mb-1.5">
          {isAllCompleted ? (
            <Trophy className="w-5 h-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          )}
          <h2 className="font-display text-lg font-semibold text-white tracking-tight">
            Day Logout Auto-Audit & Reconciliation
          </h2>
        </div>
        <p className="text-xs font-sans text-zinc-400">
          Automatic system scan of today's study quota, restorative sleep, and habits ledger.
        </p>

        {/* Auto-Detection Diagnostic Result */}
        {isAllCompleted ? (
          <div className="my-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/45 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold label-scandi">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All Daily Quotas & Habits Completed</span>
            </div>
            <p className="text-xs font-sans text-zinc-200 leading-relaxed">
              Exceptional discipline today! Every task, study hour, sleep log, and habit target is checked off. Unused break hours bank cleanly into your Earned Reserve.
            </p>
          </div>
        ) : (
          <div className="my-4 p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2.5">
            <div className="flex items-center gap-2 text-red-300 font-bold label-scandi">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>You have not completed</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-zinc-200">
              {missingItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Daily Scoreboard */}
        <div className="mb-4 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
            <span className="label-scandi text-zinc-500 block mb-1">Study Completed</span>
            <div className="text-base font-bold text-white tabular-nums">
              {formatHm(studyMinutesToday)} / 6h 00m
            </div>
            {hasDeficit ? (
              <span className="text-zinc-300 block mt-1">
                Shortfall: -{formatHm(studyDeficitMinutes)}
              </span>
            ) : (
              <span className="text-emerald-400 block mt-1">Goal Met!</span>
            )}
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
            <span className="label-scandi text-zinc-500 block mb-1">Break Time Used</span>
            <div className="text-base font-bold text-white tabular-nums">
              {formatHm(breakMinutesToday)} / 2h 00m
            </div>
            {breakSurplusMinutes > 0 ? (
              <span className="text-emerald-400 block mt-1">
                Saved: +{formatHm(breakSurplusMinutes)}
              </span>
            ) : (
              <span className="text-red-400 block mt-1">Quota Exhausted</span>
            )}
          </div>
        </div>

        {/* Reason Input requirement when study deficit exists */}
        {hasDeficit && (
          <div className="mb-4">
            <label className="block label-scandi text-zinc-300 mb-1.5">
              Reason for Carrying Forward Study Debt <span className="text-red-400">*</span>
            </label>
            <p className="text-xs font-sans text-zinc-500 mb-2">
              Explain why this {formatHm(studyDeficitMinutes)} should carry over to tomorrow's quota, or retire it to the Vault of Lost Time.
            </p>
            <textarea
              rows={3}
              value={reasonInput}
              onChange={(e) => {
                setReasonInput(e.target.value);
                setErrorText('');
              }}
              placeholder="e.g. Urgent project deadline, travel day, caught up in college lab..."
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
            />
            {errorText && <span className="text-xs text-red-400 mt-1 block">{errorText}</span>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
          {hasDeficit && (
            <button
              type="button"
              onClick={handleSendToVault}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Don't add to tomorrow's workload; archive in the Vault of Lost Time"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Send to Vault of Lost Time</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApproveCarryForward}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {hasDeficit
                ? 'Approve & Carry Forward'
                : isAllCompleted
                ? 'Celebrate & Complete Day Logout'
                : 'Complete Day Logout'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
