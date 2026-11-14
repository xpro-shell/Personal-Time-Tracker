import { Archive, CalendarClock, CheckCircle, Clock, HelpCircle, ShieldAlert, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ResetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerManualClose: () => void;
  selectedDate: string;
}

export const ResetInfoModal: React.FC<ResetInfoModalProps> = ({
  isOpen,
  onClose,
  onTriggerManualClose,
  selectedDate,
}) => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // 00:00 of tomorrow
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilMidnight(
        `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <CalendarClock className="w-5 h-5 text-emerald-400" />
          <h2 className="font-display text-lg font-semibold text-white tracking-tight">
            When & How Does the Tracker Reset?
          </h2>
        </div>
        <p className="text-xs font-sans text-zinc-400 mb-4">
          Understanding the daily 24-hour cycle, midnight rollover, and deficit reconciliation.
        </p>

        {/* Live Countdown to Midnight */}
        <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between mb-4">
          <div>
            <span className="label-scandi text-zinc-500 block">
              Automatic Midnight Reset In
            </span>
            <div className="text-xl font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
              {timeUntilMidnight}
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-zinc-400">
            <span>Cycle: 00:00 → 23:59</span>
            <div className="text-zinc-500">Active Date: {selectedDate}</div>
          </div>
        </div>

        {/* Explanatory Rules */}
        <div className="space-y-3 text-xs mb-5 font-sans">
          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Midnight (00:00) Rollover</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every night at <strong>00:00 (Midnight)</strong>, a brand-new day ledger begins. The 6h Study Quota, 2h Break Bank, and 8h Sleep meters renew.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Manual Day Logout (OTD Reconciliation)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Whenever you finish studying for the day, click <strong>"Day Logout (OTD)"</strong> in the Desk Command Center. This opens your day-end reconciliation:
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] text-zinc-400 list-disc list-inside">
              <li>
                <strong className="text-zinc-200">Study Deficit:</strong> If you studied less than 6 hours, you can carry it forward by entering an honest reason (e.g. exams, travel).
              </li>
              <li>
                <strong className="text-zinc-200">Vault of Lost Time:</strong> If you don't carry it forward, it is cleanly sealed away in the Vault so you start tomorrow fresh with zero guilt.
              </li>
              <li>
                <strong className="text-zinc-200">Saved Breaks:</strong> Unused break time converts into banked reserve minutes.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            onClick={() => {
              onClose();
              onTriggerManualClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Reconcile & Close Day Now</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
