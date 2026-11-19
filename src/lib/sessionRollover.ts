import { ActiveSession, SessionNote, TimeEntry, VaultEntry } from '../types/tracker';

export const BASE_STUDY_TARGET_MINUTES = 360; // 6h
export const BASE_BREAK_QUOTA_MINUTES = 120; // 2h

export function formatLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function getSessionAssignedDate(session: ActiveSession): string {
  if (isValidYmd(session.assignedDate)) {
    return session.assignedDate;
  }
  const d = new Date(session.startTime);
  if (!isNaN(d.getTime())) {
    return formatLocalYMD(d);
  }
  return formatLocalYMD(new Date());
}

export function normalizeActiveSession(session: ActiveSession | null | undefined): ActiveSession | null {
  if (!session) return null;
  return {
    ...session,
    assignedDate: getSessionAssignedDate(session),
    notes: Array.isArray(session.notes) ? session.notes : [],
    isPaused: Boolean(session.isPaused),
    pausedAt: session.pausedAt ?? null,
    accumulatedPausedMs:
      typeof session.accumulatedPausedMs === 'number' && Number.isFinite(session.accumulatedPausedMs)
        ? session.accumulatedPausedMs
        : 0,
  };
}

export function getEntryAssignedDate(entry: Pick<TimeEntry, 'startTime' | 'assignedDate'>): string {
  if (isValidYmd(entry.assignedDate)) {
    return entry.assignedDate;
  }
  const d = new Date(entry.startTime);
  if (!isNaN(d.getTime())) {
    return formatLocalYMD(d);
  }
  return '';
}

export function isEntryOnLocalDate(
  entry: Pick<TimeEntry, 'startTime' | 'assignedDate'>,
  targetYmd: string
): boolean {
  if (!targetYmd) return false;
  return getEntryAssignedDate(entry) === targetYmd;
}

export function shiftYmd(ymd: string, deltaDays: number): string {
  if (!isValidYmd(ymd)) return ymd;
  const d = parseLocalYmd(ymd);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalYMD(d);
}

export function getDeskOriginDate(
  isDeskLoggedIn: boolean,
  deskLoginTimestamp: string | null | undefined
): string | null {
  if (!isDeskLoggedIn || !deskLoginTimestamp) return null;
  const d = new Date(deskLoginTimestamp);
  if (isNaN(d.getTime())) return null;
  return formatLocalYMD(d);
}

/**
 * Whenever an active session is running (or an unclosed previous-day desk session is still open),
 * notes/logs associated with the current workflow belong to that active day's assigned date
 * rather than the new post-midnight date.
 */
export function getEffectiveWriteDate(
  activeSession: ActiveSession | null,
  selectedDate: string,
  openDeskOriginDate?: string | null
): string {
  if (activeSession) {
    return getSessionAssignedDate(activeSession);
  }
  if (openDeskOriginDate && isValidYmd(selectedDate) && selectedDate > openDeskOriginDate) {
    return openDeskOriginDate;
  }
  return selectedDate;
}

export function getSessionElapsedMs(session: ActiveSession | null, nowMs = Date.now()): number {
  if (!session) return 0;
  const startMs = new Date(session.startTime).getTime();
  if (isNaN(startMs)) return 0;
  const endMs =
    session.isPaused && session.pausedAt ? new Date(session.pausedAt).getTime() : nowMs;
  const pausedMs = session.accumulatedPausedMs || 0;
  return Math.max(0, endMs - startMs - pausedMs);
}

export function addNoteToActiveSession(
  session: ActiveSession,
  noteText: string,
  now = new Date()
): ActiveSession {
  const trimmed = noteText.trim();
  if (!trimmed) return session;
  const assignedDate = getSessionAssignedDate(session);
  const nextNote: SessionNote = {
    id: `snote_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    text: trimmed,
    assignedDate,
    createdAt: now.toISOString(),
  };
  return {
    ...session,
    assignedDate,
    notes: [...(session.notes || []), nextNote],
  };
}

export function buildCompletedEntryFromSession(
  session: ActiveSession,
  now = new Date()
): TimeEntry {
  const nowIso = now.toISOString();
  const activeMs = getSessionElapsedMs(session, now.getTime());
  const elapsedMins = Math.max(1, Math.round(activeMs / 60000));
  const assignedDate = getSessionAssignedDate(session);
  const notes = Array.isArray(session.notes) && session.notes.length > 0 ? session.notes : undefined;
  const combinedNote = notes ? notes.map((n) => n.text).join(' · ') : undefined;

  return {
    id: `local_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: 'local_desktop_user',
    type: session.type,
    action: 'stop',
    topic: session.topic,
    startTime: session.startTime,
    endTime: nowIso,
    durationMinutes: elapsedMins,
    assignedDate,
    ...(notes ? { notes, note: combinedNote } : {}),
    source: 'manual',
    createdAt: nowIso,
  };
}

export interface DailyRolloverInput {
  fromDate: string;
  toDate: string;
  entries: TimeEntry[];
  vaultEntries: VaultEntry[];
  carriedDates: string[];
  rolledOverDates: string[];
  reconciledDates: string[];
  studyDeficitCarryForwardMinutes: number;
  bankedCarryForwardMinutes: number;
  activeSession: ActiveSession | null;
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  isDeskTimerPaused: boolean;
  deskPausedAt: string | null;
  deskAccumulatedPausedMs: number;
  forceCloseOpenDesk?: boolean;
  now?: Date;
}

export interface DailyRolloverResult {
  didRollover: boolean;
  balancesModified: boolean;
  nextActiveDate: string;
  nextLastRolloverDate: string;
  nextStudyDeficitCarryForwardMinutes: number;
  nextBankedCarryForwardMinutes: number;
  nextCarriedDates: string[];
  nextRolledOverDates: string[];
  nextEntries: TimeEntry[];
  nextDeskLoginTimestamp: string | null;
  nextDeskPausedAt: string | null;
  nextDeskAccumulatedPausedMs: number;
}

export function processDailyRollover(input: DailyRolloverInput): DailyRolloverResult {
  const {
    fromDate,
    toDate,
    entries,
    vaultEntries,
    carriedDates,
    rolledOverDates,
    reconciledDates,
    studyDeficitCarryForwardMinutes,
    bankedCarryForwardMinutes,
    activeSession,
    isDeskLoggedIn,
    deskLoginTimestamp,
    isDeskTimerPaused,
    deskPausedAt,
    deskAccumulatedPausedMs,
    forceCloseOpenDesk = false,
  } = input;

  // Never interrupt or roll over while an active session is running
  if (activeSession) {
    return {
      didRollover: false,
      balancesModified: false,
      nextActiveDate: fromDate,
      nextLastRolloverDate: rolledOverDates[rolledOverDates.length - 1] || '',
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      nextBankedCarryForwardMinutes: bankedCarryForwardMinutes,
      nextCarriedDates: carriedDates,
      nextRolledOverDates: rolledOverDates,
      nextEntries: entries,
      nextDeskLoginTimestamp: deskLoginTimestamp,
      nextDeskPausedAt: deskPausedAt,
      nextDeskAccumulatedPausedMs: deskAccumulatedPausedMs,
    };
  }

  // If the previous day's desk timer is still open across midnight and the user hasn't explicitly
  // logged out or clicked "Reset to Today", keep the previous desk day active so remaining quota
  // can still be completed on that day.
  const openDeskOrigin = getDeskOriginDate(isDeskLoggedIn, deskLoginTimestamp);
  if (!forceCloseOpenDesk && openDeskOrigin && openDeskOrigin < toDate) {
    return {
      didRollover: false,
      balancesModified: false,
      nextActiveDate: openDeskOrigin,
      nextLastRolloverDate: rolledOverDates[rolledOverDates.length - 1] || '',
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      nextBankedCarryForwardMinutes: bankedCarryForwardMinutes,
      nextCarriedDates: carriedDates,
      nextRolledOverDates: rolledOverDates,
      nextEntries: entries,
      nextDeskLoginTimestamp: deskLoginTimestamp,
      nextDeskPausedAt: deskPausedAt,
      nextDeskAccumulatedPausedMs: deskAccumulatedPausedMs,
    };
  }

  if (!isValidYmd(fromDate) || !isValidYmd(toDate) || fromDate >= toDate) {
    return {
      didRollover: false,
      balancesModified: false,
      nextActiveDate: fromDate || toDate,
      nextLastRolloverDate: rolledOverDates[rolledOverDates.length - 1] || '',
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      nextBankedCarryForwardMinutes: bankedCarryForwardMinutes,
      nextCarriedDates: carriedDates,
      nextRolledOverDates: rolledOverDates,
      nextEntries: entries,
      nextDeskLoginTimestamp: deskLoginTimestamp,
      nextDeskPausedAt: deskPausedAt,
      nextDeskAccumulatedPausedMs: deskAccumulatedPausedMs,
    };
  }

  // Idempotent guard: never apply carry-forward balances twice for the same fromDate
  if (rolledOverDates.includes(fromDate)) {
    return {
      didRollover: true,
      balancesModified: false,
      nextActiveDate: toDate,
      nextLastRolloverDate: fromDate,
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      nextBankedCarryForwardMinutes: bankedCarryForwardMinutes,
      nextCarriedDates: carriedDates,
      nextRolledOverDates: rolledOverDates,
      nextEntries: entries,
      nextDeskLoginTimestamp: deskLoginTimestamp,
      nextDeskPausedAt: deskPausedAt,
      nextDeskAccumulatedPausedMs: deskAccumulatedPausedMs,
    };
  }

  let nextEntries = entries;
  let nextDeskLoginTimestamp = deskLoginTimestamp;
  let nextDeskPausedAt = deskPausedAt;
  let nextDeskAccumulatedPausedMs = deskAccumulatedPausedMs;
  let deskSegmentAdded = false;

  // If desk remained logged in across midnight (with no active study/break session),
  // archive fromDate's desk attendance up to 23:59:59 of the login date and start today cleanly at 00:00.
  const toDateStart = parseLocalYmd(toDate);
  const toDateStartMs = toDateStart.getTime();
  const toDateStartIso = toDateStart.toISOString();

  if (isDeskLoggedIn && deskLoginTimestamp) {
    const loginDate = new Date(deskLoginTimestamp);
    const loginMs = loginDate.getTime();
    if (Number.isFinite(loginMs) && loginMs < toDateStartMs) {
      const loginYmd = formatLocalYMD(loginDate);
      const loginDayEnd = new Date(
        loginDate.getFullYear(),
        loginDate.getMonth(),
        loginDate.getDate(),
        23,
        59,
        59,
        999
      );
      const endMs = Math.min(loginDayEnd.getTime(), toDateStartMs - 1);
      const effectiveEndMs =
        isDeskTimerPaused && deskPausedAt
          ? Math.min(endMs, new Date(deskPausedAt).getTime())
          : endMs;
      const elapsedMs = Math.max(0, effectiveEndMs - loginMs - deskAccumulatedPausedMs);
      const deskMins = Math.round(elapsedMs / 60000);

      if (deskMins >= 1) {
        const deskEntry: TimeEntry = {
          id: `local_desk_roll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId: 'local_desktop_user',
          type: 'desk',
          action: 'stop',
          topic: 'Active Desk Time',
          startTime: deskLoginTimestamp,
          endTime: new Date(effectiveEndMs).toISOString(),
          durationMinutes: deskMins,
          assignedDate: loginYmd,
          source: 'manual',
          createdAt: toDateStartIso,
        };
        nextEntries = [...entries, deskEntry].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        deskSegmentAdded = true;
      }

      nextDeskLoginTimestamp = toDateStartIso;
      nextDeskPausedAt = isDeskTimerPaused ? toDateStartIso : null;
      nextDeskAccumulatedPausedMs = 0;
    }
  }

  // Compute carry-forward rules once for fromDate unless user already manually reconciled fromDate
  const alreadyManuallyReconciled =
    reconciledDates.includes(fromDate) || vaultEntries.some((v) => v.date === fromDate);

  let nextStudyDeficit = studyDeficitCarryForwardMinutes;
  let nextBankedCarryForward = bankedCarryForwardMinutes;
  const nextCarriedDates = [...carriedDates];

  if (!alreadyManuallyReconciled) {
    let studyCompleted = 0;
    let breakUsed = 0;
    let otherActivityMinutes = 0;

    for (const e of nextEntries) {
      if (!isEntryOnLocalDate(e, fromDate)) continue;
      if (e.type === 'day_boundary') continue;
      const mins = e.durationMinutes || 0;
      if (e.type === 'study' || e.type === 'content') {
        studyCompleted += mins;
      } else if (e.type === 'break') {
        breakUsed += mins;
      } else {
        otherActivityMinutes += mins;
      }
    }

    const hadTrackedActivityOnFromDate =
      studyCompleted > 0 || breakUsed > 0 || otherActivityMinutes > 0;

    if (hadTrackedActivityOnFromDate) {
      const fromDateObj = parseLocalYmd(fromDate);
      const dow = fromDateObj.getDay();
      const isWeekday = dow >= 1 && dow <= 5;

      if (isWeekday && !carriedDates.includes(fromDate)) {
        const effectiveTarget = BASE_STUDY_TARGET_MINUTES + Math.max(0, studyDeficitCarryForwardMinutes);
        nextStudyDeficit = Math.max(0, effectiveTarget - studyCompleted);
        nextCarriedDates.push(fromDate);
      }

      if (studyCompleted > 0 || breakUsed > 0) {
        const unusedBreak = Math.max(0, BASE_BREAK_QUOTA_MINUTES - breakUsed);
        nextBankedCarryForward = bankedCarryForwardMinutes + unusedBreak;
      }
    }
  }

  return {
    didRollover: true,
    balancesModified: !alreadyManuallyReconciled,
    nextActiveDate: toDate,
    nextLastRolloverDate: fromDate,
    nextStudyDeficitCarryForwardMinutes: nextStudyDeficit,
    nextBankedCarryForwardMinutes: nextBankedCarryForward,
    nextCarriedDates,
    nextRolledOverDates: [...rolledOverDates, fromDate],
    nextEntries,
    nextDeskLoginTimestamp,
    nextDeskPausedAt,
    nextDeskAccumulatedPausedMs,
  };
}

export interface ReassignEntriesInput {
  entries: TimeEntry[];
  entryIds: string[];
  targetDate: string;
  vaultEntries: VaultEntry[];
  carriedDates: string[];
  studyDeficitCarryForwardMinutes: number;
}

export interface ReassignEntriesResult {
  nextEntries: TimeEntry[];
  nextVaultEntries: VaultEntry[];
  nextCarriedDates: string[];
  nextStudyDeficitCarryForwardMinutes: number;
  reassignedCount: number;
  movedMinutes: number;
}

export function reconcileStudyDebtForDate(input: {
  targetDate: string;
  prevEntries: TimeEntry[];
  nextEntries: TimeEntry[];
  vaultEntries: VaultEntry[];
  carriedDates: string[];
  studyDeficitCarryForwardMinutes: number;
}): {
  nextVaultEntries: VaultEntry[];
  nextCarriedDates: string[];
  nextStudyDeficitCarryForwardMinutes: number;
} {
  const {
    targetDate,
    prevEntries,
    nextEntries,
    vaultEntries,
    carriedDates,
    studyDeficitCarryForwardMinutes,
  } = input;

  const studyMinutesOnTarget = (list: TimeEntry[]) =>
    list.reduce((sum, e) => {
      if (!isEntryOnLocalDate(e, targetDate)) return sum;
      if (e.type === 'study' || e.type === 'content') {
        return sum + (e.durationMinutes || 0);
      }
      return sum;
    }, 0);

  const prevStudyMins = studyMinutesOnTarget(prevEntries);
  const newStudyMins = studyMinutesOnTarget(nextEntries);
  const prevDeficit = Math.max(0, BASE_STUDY_TARGET_MINUTES - prevStudyMins);
  const newDeficit = Math.max(0, BASE_STUDY_TARGET_MINUTES - newStudyMins);
  const recoveredStudyMins = Math.max(0, prevDeficit - newDeficit);

  let nextStudyDeficit = studyDeficitCarryForwardMinutes;
  let nextCarriedDates = carriedDates;
  if (recoveredStudyMins > 0 && carriedDates.includes(targetDate)) {
    nextStudyDeficit = Math.max(0, studyDeficitCarryForwardMinutes - recoveredStudyMins);
    if (newDeficit === 0) {
      nextCarriedDates = carriedDates.filter((d) => d !== targetDate);
    }
  }

  let nextVaultEntries = vaultEntries;
  if (recoveredStudyMins > 0) {
    if (newDeficit === 0) {
      nextVaultEntries = vaultEntries.filter(
        (v) => !(v.date === targetDate && v.type === 'unreconciled_study_debt')
      );
    } else {
      const updatedLostHours = Math.round((newDeficit / 60) * 10) / 10;
      nextVaultEntries = vaultEntries.map((v) =>
        v.date === targetDate && v.type === 'unreconciled_study_debt'
          ? { ...v, hoursLost: updatedLostHours }
          : v
      );
    }
  }

  return {
    nextVaultEntries,
    nextCarriedDates,
    nextStudyDeficitCarryForwardMinutes: nextStudyDeficit,
  };
}

/**
 * Reassigns tracked entries (e.g., post-midnight study/break logs that landed on Today)
 * back to targetDate (e.g., Yesterday), updating study quota & clearing/reducing redundant
 * shortfall vault/carry-forward debt for targetDate automatically.
 */
export function reassignEntriesToDate(input: ReassignEntriesInput): ReassignEntriesResult {
  const {
    entries,
    entryIds,
    targetDate,
    vaultEntries,
    carriedDates,
    studyDeficitCarryForwardMinutes,
  } = input;

  if (!isValidYmd(targetDate) || entryIds.length === 0) {
    return {
      nextEntries: entries,
      nextVaultEntries: vaultEntries,
      nextCarriedDates: carriedDates,
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      reassignedCount: 0,
      movedMinutes: 0,
    };
  }

  const idSet = new Set(entryIds);
  let reassignedCount = 0;
  let movedMinutes = 0;

  const nextEntries = entries.map((e) => {
    if (!idSet.has(e.id) || e.type === 'day_boundary') return e;
    if (getEntryAssignedDate(e) === targetDate) return e;
    reassignedCount += 1;
    movedMinutes += e.durationMinutes || 0;
    return {
      ...e,
      assignedDate: targetDate,
    };
  });

  if (reassignedCount === 0) {
    return {
      nextEntries: entries,
      nextVaultEntries: vaultEntries,
      nextCarriedDates: carriedDates,
      nextStudyDeficitCarryForwardMinutes: studyDeficitCarryForwardMinutes,
      reassignedCount: 0,
      movedMinutes: 0,
    };
  }

  const debtUpdate = reconcileStudyDebtForDate({
    targetDate,
    prevEntries: entries,
    nextEntries,
    vaultEntries,
    carriedDates,
    studyDeficitCarryForwardMinutes,
  });

  return {
    nextEntries,
    nextVaultEntries: debtUpdate.nextVaultEntries,
    nextCarriedDates: debtUpdate.nextCarriedDates,
    nextStudyDeficitCarryForwardMinutes: debtUpdate.nextStudyDeficitCarryForwardMinutes,
    reassignedCount,
    movedMinutes,
  };
}

