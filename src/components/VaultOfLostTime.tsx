import {
  AlertTriangle,
  Archive,
  ArrowRightCircle,
  Calendar,
  Check,
  Edit3,
  History,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { VaultEntry } from '../types/tracker';
import { formatLocalYMD } from './DateNavigator';
import { UnreconciledPastDay } from './PastDayAuditBanner';

interface VaultOfLostTimeProps {
  vaultEntries: VaultEntry[];
  unreconciledDays?: UnreconciledPastDay[];
  onVaultPastDay?: (day: UnreconciledPastDay, reason?: string) => void;
  onCarryForwardPastDay?: (day: UnreconciledPastDay, reason: string) => void;
  onCarryForwardVaultEntry?: (entry: VaultEntry, reason: string) => void;
  onUpdateVaultNote?: (entryId: string, newReason: string) => void;
}

type VaultScope = 'week' | 'past' | 'total';

function getCurrentWeekRange(): {
  weekStartYmd: string;
  weekEndYmd: string;
  weekLabel: string;
} {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun .. 6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return {
    weekStartYmd: formatLocalYMD(monday),
    weekEndYmd: formatLocalYMD(sunday),
    weekLabel: `${fmt(monday)} – ${fmt(sunday)}`,
  };
}

export const VaultOfLostTime: React.FC<VaultOfLostTimeProps> = ({
  vaultEntries,
  unreconciledDays = [],
  onVaultPastDay,
  onCarryForwardPastDay,
  onCarryForwardVaultEntry,
  onUpdateVaultNote,
}) => {
  // Default to "This Week" lost time, with options for Past Vault and Total All-Time
  const [vaultScope, setVaultScope] = useState<VaultScope>('week');

  const { weekStartYmd, weekEndYmd, weekLabel } = useMemo(() => getCurrentWeekRange(), []);

  const { thisWeekEntries, pastEntries, thisWeekHours, pastHours, totalHoursLost } = useMemo(() => {
    const weekList: VaultEntry[] = [];
    const pastList: VaultEntry[] = [];
    let weekHrs = 0;
    let pastHrs = 0;
    let totalHrs = 0;

    vaultEntries.forEach((entry) => {
      const hrs = entry.hoursLost || 0;
      totalHrs += hrs;
      let normalizedYmd = entry.date || '';
      if (normalizedYmd.length > 10) {
        const parsed = new Date(normalizedYmd);
        if (!isNaN(parsed.getTime())) {
          normalizedYmd = formatLocalYMD(parsed);
        }
      }
      if (normalizedYmd >= weekStartYmd && normalizedYmd <= weekEndYmd) {
        weekList.push(entry);
        weekHrs += hrs;
      } else {
        pastList.push(entry);
        pastHrs += hrs;
      }
    });

    return {
      thisWeekEntries: weekList,
      pastEntries: pastList,
      thisWeekHours: Math.round(weekHrs * 10) / 10,
      pastHours: Math.round(pastHrs * 10) / 10,
      totalHoursLost: Math.round(totalHrs * 10) / 10,
    };
  }, [vaultEntries, weekStartYmd, weekEndYmd]);

  const displayedEntries =
    vaultScope === 'week'
      ? thisWeekEntries
      : vaultScope === 'past'
      ? pastEntries
      : vaultEntries;

  const displayedHours =
    vaultScope === 'week'
      ? thisWeekHours
      : vaultScope === 'past'
      ? pastHours
      : totalHoursLost;

  // Interactive state for editing reason or carrying forward an archived Vault entry
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
  const [vaultMode, setVaultMode] = useState<'carry' | 'edit' | null>(null);
  const [vaultReasonInput, setVaultReasonInput] = useState('');
  const [vaultError, setVaultError] = useState('');

  // Interactive state for pending unreconciled past days
  const [activePastDate, setActivePastDate] = useState<string | null>(null);
  const [pastReasonInput, setPastReasonInput] = useState('');
  const [pastError, setPastError] = useState('');

  const handleOpenVaultAction = (entry: VaultEntry, mode: 'carry' | 'edit') => {
    playDeskClick();
    setActiveVaultId(entry.id);
    setVaultMode(mode);
    setVaultReasonInput(entry.note || '');
    setVaultError('');
  };

  const handleCloseVaultAction = () => {
    setActiveVaultId(null);
    setVaultMode(null);
    setVaultReasonInput('');
    setVaultError('');
  };

  const handleSubmitVaultAction = (entry: VaultEntry) => {
    const trimmed = vaultReasonInput.trim();
    if (!trimmed) {
      setVaultError('Please write a clear reason first.');
      return;
    }

    if (vaultMode === 'carry' && onCarryForwardVaultEntry) {
      playEarnedChime();
      onCarryForwardVaultEntry(entry, trimmed);
      handleCloseVaultAction();
    } else if (vaultMode === 'edit' && onUpdateVaultNote) {
      playDeskClick();
      onUpdateVaultNote(entry.id, trimmed);
      handleCloseVaultAction();
    }
  };

  const handleSubmitPastCarryForward = (day: UnreconciledPastDay) => {
    const trimmed = pastReasonInput.trim();
    if (!trimmed) {
      setPastError('A written reason is required to carry forward this deficit.');
      return;
    }
    if (onCarryForwardPastDay) {
      playEarnedChime();
      onCarryForwardPastDay(day, trimmed);
      setActivePastDate(null);
      setPastReasonInput('');
      setPastError('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="studio-card p-6 rounded-2xl bg-[#121215] border border-zinc-800/90 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <Archive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Vault of Lost Time
              </h2>
              <p className="label-scandi text-zinc-400 mt-1">
                Default: This Week ({weekLabel}) · Switch to Past or Total anytime
              </p>
            </div>
          </div>

          {/* Scope Switcher: This Week (Default) | Past Vault | Total All-Time */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono shrink-0">
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setVaultScope('week');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vaultScope === 'week'
                  ? 'bg-emerald-400 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Week ({thisWeekHours}h)
            </button>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setVaultScope('past');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vaultScope === 'past'
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Past Vault ({pastHours}h)
            </button>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setVaultScope('total');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                vaultScope === 'total'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Total ({totalHoursLost}h)
            </button>
          </div>
        </div>

        <p className="text-xs font-sans text-zinc-300/90 max-w-3xl leading-relaxed">
          Uncompleted focus hours are sealed here so tomorrow stays clean. By default, this ledger highlights <strong className="text-emerald-300">This Week&apos;s</strong> lost time—switch tabs above to inspect <strong className="text-amber-300">Past Vault</strong> history or <strong className="text-white">Total All-Time</strong> hours, and write an honest reason anytime to carry hours forward.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-950/80 border border-emerald-500/35 rounded-xl">
            <span className="label-scandi text-emerald-400 block mb-1.5">
              {vaultScope === 'week'
                ? 'This Week Lost Time'
                : vaultScope === 'past'
                ? 'Past Vault Lost Time'
                : 'Total All-Time Lost'}
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {displayedHours} hours
            </div>
            <span className="text-[11px] font-sans text-zinc-400">
              {displayedEntries.length} archived {displayedEntries.length === 1 ? 'entry' : 'entries'} in view
            </span>
          </div>

          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <span className="label-scandi text-zinc-400 block mb-1.5">
              Vault Breakdown
            </span>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">This Week:</span>
                <span className="text-emerald-300 font-bold">{thisWeekHours}h ({thisWeekEntries.length})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Past Weeks:</span>
                <span className="text-amber-300 font-bold">{pastHours}h ({pastEntries.length})</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-1">
                <span className="text-zinc-300">Grand Total:</span>
                <span className="text-white font-bold">{totalHoursLost}h ({vaultEntries.length})</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <span className="label-scandi text-emerald-400 block mb-1.5">
              Recovery Rule
            </span>
            <div className="text-xs font-mono text-zinc-100 font-semibold mt-1">
              Write Reason → Carry Forward
            </div>
            <span className="text-[11px] font-sans text-zinc-400 block mt-1">
              Reclaim lost hours back into your active Study Quota
            </span>
          </div>
        </div>
      </div>

      {/* Pending Unarchived Past Days */}
      {unreconciledDays.length > 0 && (
        <div className="studio-card p-5 rounded-2xl bg-[#121215] border border-zinc-700 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="font-display text-lg font-bold tracking-tight text-white">
              Pending Write-Offs: This Week&apos;s Unlogged Weekday Shortfalls
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            These weekdays have uncompleted study quotas. Write a reason to carry the shortfall forward into your active focus target, or archive it into the Vault.
          </p>

          <div className="space-y-3">
            {unreconciledDays.map((day) => {
              const deficitH = Math.round((day.deficitMinutes / 60) * 10) / 10;
              const isWritingReason = activePastDate === day.date;

              return (
                <div
                  key={day.date}
                  className="p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-3 text-xs font-mono"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-zinc-100">{day.dayLabel}</span>
                      <span className="text-zinc-400 ml-2">
                        -{deficitH}h focus shortfall ({Math.round((day.loggedStudyMinutes / 60) * 10) / 10}h / 6.0h logged)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {onCarryForwardPastDay && (
                        <button
                          type="button"
                          onClick={() => {
                            playDeskClick();
                            setActivePastDate(isWritingReason ? null : day.date);
                            setPastReasonInput('');
                            setPastError('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          <span>Write Reason & Carry Forward</span>
                        </button>
                      )}

                      {onVaultPastDay && (
                        <button
                          type="button"
                          onClick={() =>
                            onVaultPastDay(
                              day,
                              `Unlogged study deficit from ${day.dayLabel} archived to Vault to keep week clean`
                            )
                          }
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Archive to Vault (-{deficitH}h)
                        </button>
                      )}
                    </div>
                  </div>

                  {isWritingReason && (
                    <div className="pt-3 border-t border-zinc-800 space-y-2 animate-in fade-in duration-150">
                      <label className="block label-scandi text-emerald-400">
                        Reason for Carrying Forward +{deficitH}h into Active Study Quota:
                      </label>
                      <textarea
                        rows={2}
                        value={pastReasonInput}
                        onChange={(e) => {
                          setPastReasonInput(e.target.value);
                          setPastError('');
                        }}
                        placeholder="e.g. Lab deadline, client work, sick day — making up these hours today..."
                        className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
                      />
                      {pastError && <p className="text-[11px] text-red-400">{pastError}</p>}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePastDate(null)}
                          className="px-3 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitPastCarryForward(day)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Carry Forward (+{deficitH}h)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vault Archive Ledger with Write Reason & Carry Forward */}
      <div className="studio-card p-6 rounded-2xl bg-[#121215] border border-zinc-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
            {vaultScope === 'week'
              ? `This Week's Write-Off Ledger (${thisWeekEntries.length})`
              : vaultScope === 'past'
              ? `Past Vault Archive (${pastEntries.length})`
              : `Complete All-Time Vault Ledger (${vaultEntries.length})`}
          </h3>
          <span className="label-scandi text-zinc-500">
            Write a reason to reclaim & carry forward any entry
          </span>
        </div>

        {displayedEntries.length > 0 ? (
          <div className="space-y-3">
            {displayedEntries.map((entry) => {
              const isSelected = activeVaultId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="p-4 bg-zinc-950/60 hover:bg-zinc-900/40 border border-zinc-800/90 rounded-xl transition-colors space-y-3 text-xs font-mono"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-zinc-100 font-semibold">{entry.date}</span>
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span className="text-zinc-400 capitalize">
                          {entry.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                        {entry.note || 'No reason written yet.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                      <div className="text-right mr-2">
                        <span className="text-sm font-bold text-white tabular-nums">
                          -{entry.hoursLost}h
                        </span>
                        <span className="label-scandi text-zinc-500 block">In Vault</span>
                      </div>

                      {onUpdateVaultNote && (
                        <button
                          type="button"
                          onClick={() => handleOpenVaultAction(entry, 'edit')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors cursor-pointer"
                          title="Write or edit reason"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Write Reason</span>
                        </button>
                      )}

                      {onCarryForwardVaultEntry && entry.hoursLost > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenVaultAction(entry, 'carry')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                          title="Write a reason and move these hours into your active Study Quota"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          <span>Carry Forward (+{entry.hoursLost}h)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Write Reason / Carry Forward Form */}
                  {isSelected && (
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <label className="label-scandi text-emerald-400">
                          {vaultMode === 'carry'
                            ? `Write Reason & Carry Forward (+${entry.hoursLost}h to Active Focus Quota):`
                            : 'Write or Update Reason for Lost Time:'}
                        </label>
                        <button
                          type="button"
                          onClick={handleCloseVaultAction}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={vaultReasonInput}
                        onChange={(e) => {
                          setVaultReasonInput(e.target.value);
                          setVaultError('');
                        }}
                        placeholder="Explain why these hours were missed and why you're carrying them forward or keeping them archived..."
                        className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
                      />

                      {vaultError && <span className="text-[11px] text-red-400 block">{vaultError}</span>}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCloseVaultAction}
                          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitVaultAction(entry)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            vaultMode === 'carry'
                              ? 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950'
                              : 'bg-zinc-100 hover:bg-white text-zinc-950'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {vaultMode === 'carry'
                              ? `Approve & Carry Forward (+${entry.hoursLost}h)`
                              : 'Save Reason'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
            <History className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-xs font-sans text-zinc-400">
              {vaultScope === 'week'
                ? 'No lost time archived this week yet. Check Past Vault or Total to inspect earlier records.'
                : vaultScope === 'past'
                ? 'No past archived entries before this week.'
                : 'The Vault of Lost Time is clean. All study debt has been either completed or carries verified reasons.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
