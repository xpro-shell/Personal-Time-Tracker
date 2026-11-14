import { Sliders } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AchievementNewsTicker } from './components/AchievementNewsTicker';
import { AchievementsTab } from './components/AchievementsTab';
import { BreakBankCard } from './components/BreakBankCard';
import { CustomHabitsManager, DEFAULT_HABITS } from './components/CustomHabitsManager';
import { DateNavigator, formatLocalYMD } from './components/DateNavigator';
import { DailyCompletionStatus, DayCloseModal } from './components/DayCloseModal';
import { DeskQuickLogger } from './components/DeskQuickLogger';
import { HabitCard } from './components/HabitCard';
import { InsightsTips } from './components/InsightsTips';
import { IntroAnimation } from './components/IntroAnimation';
import { MotivationModal } from './components/MotivationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PastDayAuditBanner, UnreconciledPastDay } from './components/PastDayAuditBanner';
import { ResetInfoModal } from './components/ResetInfoModal';
import { ReviewQueue } from './components/ReviewQueue';
import { RobotTutorialModal } from './components/RobotTutorialModal';
import { SleepTrackerCard } from './components/SleepTrackerCard';
import { StudyQuotaCard } from './components/StudyQuotaCard';
import { TimelineHeatmap } from './components/TimelineHeatmap';
import { TopBar } from './components/TopBar';
import { VaultOfLostTime } from './components/VaultOfLostTime';
import { WhatsAppImporter } from './components/WhatsAppImporter';
import { useLocalProfile } from './context/LocalProfileContext';
import { playDeskClick, playEarnedChime } from './lib/audioAlert';
import { INITIAL_WORD_RULES, WordRule } from './lib/defaultWordList';
import { readLocalAsync, readLocalSync, STORAGE_KEYS, writeLocalData } from './lib/localDb';
import {
  AchievementItem,
  ActiveSession,
  CustomHabit,
  EntryType,
  GapItem,
  ParsedWhatsAppResult,
  ReviewItem,
  TickerSettings,
  TimeEntry,
  VaultEntry,
} from './types/tracker';

interface PersistedAppState {
  activeSession: ActiveSession | null;
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  studyDeficitCarryForwardMinutes: number;
  bankedCarryForwardMinutes: number;
  carriedDates: string[];
}

const getDefaultAppState = (): PersistedAppState => ({
  activeSession: null,
  isDeskLoggedIn: true,
  deskLoginTimestamp: new Date().toISOString(),
  studyDeficitCarryForwardMinutes: 0,
  bankedCarryForwardMinutes: 0,
  carriedDates: [],
});

const DEFAULT_TICKER_SETTINGS: TickerSettings = {
  intervalSeconds: 120, // Default every 2 minutes
  fadeAfterSeconds: 20, // Default smooth fade-out after 20 seconds
  scrollSpeed: 'normal',
  enabled: true,
};

interface TutorialPrefs {
  doNotShowAgain: boolean;
  claimedBonus: boolean;
}

const DEFAULT_TUTORIAL_PREFS: TutorialPrefs = {
  doNotShowAgain: false,
  claimedBonus: false,
};

export default function App() {
  const { profile, addXp } = useLocalProfile();

  const [currentTab, setCurrentTab] = useState<
    'desk' | 'timeline' | 'achievements' | 'importer' | 'vault' | 'review'
  >('desk');

  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalYMD(new Date()));

  // Persisted core app state
  const initialAppState = useMemo(
    () => readLocalSync<PersistedAppState>(STORAGE_KEYS.APP_STATE, getDefaultAppState()),
    []
  );

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    initialAppState.activeSession
  );
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isDeskLoggedIn, setIsDeskLoggedIn] = useState<boolean>(initialAppState.isDeskLoggedIn);
  const [deskLoginTimestamp, setDeskLoginTimestamp] = useState<string | null>(
    initialAppState.deskLoginTimestamp || (initialAppState.isDeskLoggedIn ? new Date().toISOString() : null)
  );
  const [studyDeficitCarryForwardMinutes, setStudyDeficitCarryForwardMinutes] = useState<number>(
    initialAppState.studyDeficitCarryForwardMinutes
  );
  const [bankedCarryForwardMinutes, setBankedCarryForwardMinutes] = useState<number>(
    initialAppState.bankedCarryForwardMinutes
  );
  const [carriedDates, setCarriedDates] = useState<string[]>(initialAppState.carriedDates || []);

  // Offline Collections stored in IndexedDB + LocalStorage
  const [entries, setEntries] = useState<TimeEntry[]>(() =>
    readLocalSync<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, [])
  );
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>(() =>
    readLocalSync<VaultEntry[]>(STORAGE_KEYS.VAULT_ENTRIES, [])
  );
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() =>
    readLocalSync<ReviewItem[]>(STORAGE_KEYS.REVIEW_ITEMS, [])
  );
  const [toFillGaps, setToFillGaps] = useState<GapItem[]>(() =>
    readLocalSync<GapItem[]>(STORAGE_KEYS.TO_FILL_GAPS, [])
  );
  const [wordRules, setWordRules] = useState<WordRule[]>(() =>
    readLocalSync<WordRule[]>(STORAGE_KEYS.WORD_RULES, INITIAL_WORD_RULES)
  );
  const [habits, setHabits] = useState<CustomHabit[]>(() =>
    readLocalSync<CustomHabit[]>(STORAGE_KEYS.CUSTOM_HABITS, DEFAULT_HABITS)
  );
  const [achievements, setAchievements] = useState<AchievementItem[]>(() =>
    readLocalSync<AchievementItem[]>(STORAGE_KEYS.ACHIEVEMENTS, [])
  );
  const [tickerSettings, setTickerSettings] = useState<TickerSettings>(() => ({
    ...DEFAULT_TICKER_SETTINGS,
    ...readLocalSync<TickerSettings>(STORAGE_KEYS.TICKER_SETTINGS, DEFAULT_TICKER_SETTINGS),
  }));
  const [tickerFlashTrigger, setTickerFlashTrigger] = useState<number>(0);

  // Tutorial preferences (show on startup unless user clicked Do Not Show Again)
  const initialTutorialPrefs = useMemo(
    () => readLocalSync<TutorialPrefs>(STORAGE_KEYS.TUTORIAL_PREFS, DEFAULT_TUTORIAL_PREFS),
    []
  );
  const [tutorialPrefs, setTutorialPrefs] = useState<TutorialPrefs>(initialTutorialPrefs);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const pendingTutorialAfterIntroRef = useRef<boolean>(!initialTutorialPrefs.doNotShowAgain);

  // Modals
  const [isDayCloseOpen, setIsDayCloseOpen] = useState<boolean>(false);
  const [isResetInfoOpen, setIsResetInfoOpen] = useState<boolean>(false);
  const [isHabitsManagerOpen, setIsHabitsManagerOpen] = useState(false);
  const [forceShowIntro, setForceShowIntro] = useState(false);
  const [motivationModalState, setMotivationModalState] = useState<{
    isOpen: boolean;
    type: 'login' | 'logout';
    timestamp: string;
  }>({
    isOpen: false,
    type: 'login',
    timestamp: new Date().toISOString(),
  });

  // Interactive Studio Atmosphere Theme ('emerald' | 'gold' | 'violet' | 'cyan')
  const [studioTheme, setStudioTheme] = useState<'emerald' | 'gold' | 'violet' | 'cyan'>(() => {
    try {
      const saved = localStorage.getItem('ptt_studio_theme_v1');
      if (saved === 'emerald' || saved === 'gold' || saved === 'violet' || saved === 'cyan') {
        return saved;
      }
    } catch {
      // ignore storage failure
    }
    return 'emerald';
  });

  const handleSelectStudioTheme = (theme: 'emerald' | 'gold' | 'violet' | 'cyan') => {
    playDeskClick();
    setStudioTheme(theme);
    try {
      localStorage.setItem('ptt_studio_theme_v1', theme);
    } catch {
      // ignore storage failure
    }
  };

  const hasHydratedIdb = useRef(false);

  // Hydrate cleanly from IndexedDB on initial mount (IndexedDB can retain data even if LocalStorage is trimmed)
  useEffect(() => {
    let active = true;
    Promise.all([
      readLocalAsync<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, []),
      readLocalAsync<VaultEntry[]>(STORAGE_KEYS.VAULT_ENTRIES, []),
      readLocalAsync<ReviewItem[]>(STORAGE_KEYS.REVIEW_ITEMS, []),
      readLocalAsync<GapItem[]>(STORAGE_KEYS.TO_FILL_GAPS, []),
      readLocalAsync<WordRule[]>(STORAGE_KEYS.WORD_RULES, INITIAL_WORD_RULES),
      readLocalAsync<CustomHabit[]>(STORAGE_KEYS.CUSTOM_HABITS, DEFAULT_HABITS),
      readLocalAsync<AchievementItem[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
      readLocalAsync<TickerSettings>(STORAGE_KEYS.TICKER_SETTINGS, DEFAULT_TICKER_SETTINGS),
      readLocalAsync<PersistedAppState>(STORAGE_KEYS.APP_STATE, getDefaultAppState()),
      readLocalAsync<TutorialPrefs>(STORAGE_KEYS.TUTORIAL_PREFS, DEFAULT_TUTORIAL_PREFS),
    ]).then(
      ([
        loadedEntries,
        loadedVault,
        loadedReview,
        loadedGaps,
        loadedRules,
        loadedHabits,
        loadedAchievements,
        loadedTicker,
        loadedAppState,
        loadedTutorialPrefs,
      ]) => {
        if (!active) return;
        if (loadedEntries.length > 0) setEntries(loadedEntries);
        if (loadedVault.length > 0) setVaultEntries(loadedVault);
        if (loadedReview.length > 0) setReviewItems(loadedReview);
        if (loadedGaps.length > 0) setToFillGaps(loadedGaps);
        if (loadedRules.length > 0) setWordRules(loadedRules);
        if (loadedHabits.length > 0) setHabits(loadedHabits);
        if (loadedAchievements.length > 0) setAchievements(loadedAchievements);
        if (loadedTicker) setTickerSettings({ ...DEFAULT_TICKER_SETTINGS, ...loadedTicker });
        if (loadedTutorialPrefs) {
          setTutorialPrefs(loadedTutorialPrefs);
          if (loadedTutorialPrefs.doNotShowAgain) {
            pendingTutorialAfterIntroRef.current = false;
          }
        }
        if (loadedAppState) {
          setActiveSession(loadedAppState.activeSession || null);
          setIsDeskLoggedIn(
            typeof loadedAppState.isDeskLoggedIn === 'boolean'
              ? loadedAppState.isDeskLoggedIn
              : true
          );
          setDeskLoginTimestamp(
            loadedAppState.deskLoginTimestamp ||
              (loadedAppState.isDeskLoggedIn ? new Date().toISOString() : null)
          );
          setStudyDeficitCarryForwardMinutes(
            loadedAppState.studyDeficitCarryForwardMinutes || 0
          );
          setBankedCarryForwardMinutes(loadedAppState.bankedCarryForwardMinutes || 0);
          setCarriedDates(loadedAppState.carriedDates || []);
        }
        hasHydratedIdb.current = true;
      }
    );

    return () => {
      active = false;
    };
  }, []);

  // Persist collections to IndexedDB + LocalStorage whenever they update
  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.TIME_ENTRIES, entries);
  }, [entries]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.VAULT_ENTRIES, vaultEntries);
  }, [vaultEntries]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.REVIEW_ITEMS, reviewItems);
  }, [reviewItems]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.TO_FILL_GAPS, toFillGaps);
  }, [toFillGaps]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.WORD_RULES, wordRules);
  }, [wordRules]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.CUSTOM_HABITS, habits);
  }, [habits]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }, [achievements]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData(STORAGE_KEYS.TICKER_SETTINGS, tickerSettings);
  }, [tickerSettings]);

  useEffect(() => {
    if (!hasHydratedIdb.current) return;
    writeLocalData<PersistedAppState>(STORAGE_KEYS.APP_STATE, {
      activeSession,
      isDeskLoggedIn,
      deskLoginTimestamp,
      studyDeficitCarryForwardMinutes,
      bankedCarryForwardMinutes,
      carriedDates,
    });
  }, [
    activeSession,
    isDeskLoggedIn,
    deskLoginTimestamp,
    studyDeficitCarryForwardMinutes,
    bankedCarryForwardMinutes,
    carriedDates,
  ]);

  // Active session timer ticker based on real timestamp delta (survives reload/sleep!)
  useEffect(() => {
    if (!activeSession) {
      setActiveSeconds(0);
      return;
    }
    const startMs = new Date(activeSession.startTime).getTime();
    const updateTick = () => {
      setActiveSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Selected date's aggregated study, break, and sleep minutes
  const { studyMinutesToday, breakMinutesToday, sleepMinutesToday } = useMemo(() => {
    let study = 0;
    let brk = 0;
    let sleep = 0;
    entries.forEach((e) => {
      if (e.startTime && e.startTime.startsWith(selectedDate)) {
        if (e.type === 'study' || e.type === 'content') {
          study += e.durationMinutes || 0;
        } else if (e.type === 'break') {
          brk += e.durationMinutes || 0;
        } else if (e.type === 'sleep') {
          sleep += e.durationMinutes || 0;
        }
      }
    });
    return { studyMinutesToday: study, breakMinutesToday: brk, sleepMinutesToday: sleep };
  }, [entries, selectedDate]);

  // Deficit and Surplus for selected date
  const BASE_STUDY_TARGET = 360; // 6h (360m)
  const BASE_BREAK_QUOTA = 120; // 2h (120m)
  const effectiveStudyTarget = BASE_STUDY_TARGET + studyDeficitCarryForwardMinutes;
  const studyDeficitMinutes = Math.max(0, effectiveStudyTarget - studyMinutesToday);
  const breakSurplusMinutes = Math.max(0, BASE_BREAK_QUOTA - breakMinutesToday);

  // Duplicate hash guard for WhatsApp Importer
  const existingHashes = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => {
      if (e.sourceHash) s.add(e.sourceHash);
    });
    return s;
  }, [entries]);

  // Check if Riyaz is ticked on selectedDate
  const todayRiyazEntry = useMemo(() => {
    return entries.find(
      (e) => e.type === 'music' && e.startTime && e.startTime.startsWith(selectedDate)
    );
  }, [entries, selectedDate]);

  // Check if Sleep is logged on selectedDate
  const todaySleepEntry = useMemo(() => {
    return entries.find(
      (e) => e.type === 'sleep' && e.startTime && e.startTime.startsWith(selectedDate)
    );
  }, [entries, selectedDate]);

  // Last logged entry for selectedDate (used for quick undo)
  const lastLoggedEntry = useMemo(() => {
    const todayList = entries.filter(
      (e) => e.startTime && e.startTime.startsWith(selectedDate)
    );
    return todayList.length > 0 ? todayList[todayList.length - 1] : null;
  }, [entries, selectedDate]);

  // Dynamic audit of previous weekdays in the active week (Monday up to yesterday)
  const unreconciledDays = useMemo<UnreconciledPastDay[]>(() => {
    const now = new Date();
    const todayDow = now.getDay(); // 0=Sun, 1=Mon, 2=Tue ... 6=Sat
    // Days elapsed in current Mon-Fri workweek before today
    const daysSinceMonday = todayDow === 0 ? 5 : todayDow - 1;
    const pastWeekdays: Array<{ date: string; dayLabel: string }> = [];

    for (let offset = daysSinceMonday; offset >= 1; offset--) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) {
        pastWeekdays.push({
          date: formatLocalYMD(d),
          dayLabel: d.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        });
      }
    }

    const results: UnreconciledPastDay[] = [];

    for (const item of pastWeekdays) {
      const isVaulted = vaultEntries.some((v) => v.date === item.date);
      const isCarried = carriedDates.includes(item.date);

      if (!isVaulted && !isCarried) {
        let loggedStudy = 0;
        entries.forEach((e) => {
          if (e.startTime && e.startTime.startsWith(item.date)) {
            if (e.type === 'study' || e.type === 'content') {
              loggedStudy += e.durationMinutes || 0;
            }
          }
        });

        if (loggedStudy < BASE_STUDY_TARGET) {
          results.push({
            date: item.date,
            dayLabel: item.dayLabel,
            loggedStudyMinutes: loggedStudy,
            studyQuotaMinutes: BASE_STUDY_TARGET,
            deficitMinutes: BASE_STUDY_TARGET - loggedStudy,
          });
        }
      }
    }

    return results;
  }, [entries, vaultEntries, carriedDates]);

  // Daily completion status fed to DayLogout Auto-Audit modal
  const dailyCompletionStatus = useMemo<DailyCompletionStatus>(() => {
    const habitsStatus = habits.map((h) => {
      const isCompleted = entries.some(
        (e) =>
          e.startTime &&
          e.startTime.startsWith(selectedDate) &&
          (e.habitId === h.id ||
            e.type === h.entryType ||
            (e.topic && e.topic.toLowerCase().includes(h.shortcode.toLowerCase())))
      );
      return { id: h.id, name: h.name, completed: isCompleted };
    });

    return {
      studyCompleted: studyDeficitMinutes === 0,
      studyRemainingMinutes: studyDeficitMinutes,
      sleepLogged: !!todaySleepEntry,
      habitsStatus,
    };
  }, [habits, entries, selectedDate, studyDeficitMinutes, todaySleepEntry]);

  // Archive past unlogged day deficit directly into local Vault of Lost Time
  const handleVaultPastDay = (day: UnreconciledPastDay, customReason?: string) => {
    const lostHours = Math.round((day.deficitMinutes / 60) * 10) / 10;
    const nowIso = new Date().toISOString();
    const vaultItem: VaultEntry = {
      id: `local_v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: 'local_desktop_user',
      date: day.date,
      hoursLost: lostHours,
      type: 'unreconciled_study_debt',
      note:
        customReason ||
        `Unlogged study deficit from ${day.dayLabel} archived to Vault of Lost Time.`,
      createdAt: nowIso,
    };
    setVaultEntries((prev) => [...prev, vaultItem]);
  };

  const handleVaultAllPastDays = () => {
    for (const day of unreconciledDays) {
      handleVaultPastDay(day);
    }
  };

  const handleCarryForwardPastDay = (day: UnreconciledPastDay) => {
    setStudyDeficitCarryForwardMinutes((prev) => prev + day.deficitMinutes);
    setCarriedDates((prev) => [...prev, day.date]);
    playEarnedChime();
  };

  // Reclaim archived Vault entry: write reason & carry forward lost hours into Study Quota
  const handleCarryForwardVaultEntry = (entry: VaultEntry, _reason: string) => {
    const minutesToCarry = Math.max(0, Math.round((entry.hoursLost || 0) * 60));
    setStudyDeficitCarryForwardMinutes((prev) => prev + minutesToCarry);
    setCarriedDates((prev) => (prev.includes(entry.date) ? prev : [...prev, entry.date]));
    setVaultEntries((prev) => prev.filter((v) => v.id !== entry.id));
    playEarnedChime();
  };

  // Update reason note on an archived Vault entry
  const handleUpdateVaultNote = (entryId: string, newReason: string) => {
    setVaultEntries((prev) =>
      prev.map((v) => (v.id === entryId ? { ...v, note: newReason } : v))
    );
  };

  // Start Session
  const handleStartSession = (type: EntryType, topic?: string) => {
    if (activeSession) {
      handleStopSession();
    }
    setActiveSession({
      type,
      topic: topic || (type === 'study' ? 'General Study' : 'Break'),
      startTime: new Date().toISOString(),
    });
    setActiveSeconds(0);
  };

  // Stop Session
  const handleStopSession = () => {
    if (!activeSession) return;
    const nowIso = new Date().toISOString();
    const startMs = new Date(activeSession.startTime).getTime();
    const elapsedMins = Math.max(1, Math.round((Date.now() - startMs) / 60000));

    const newEntry: TimeEntry = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: 'local_desktop_user',
      type: activeSession.type,
      action: 'stop',
      topic: activeSession.topic,
      startTime: activeSession.startTime,
      endTime: nowIso,
      durationMinutes: elapsedMins,
      source: 'manual',
      createdAt: nowIso,
    };

    setEntries((prev) =>
      [...prev, newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );

    if (activeSession.type === 'study') {
      const earnedXp = Math.min(60, Math.round(elapsedMins * 0.5));
      addXp(earnedXp);
    } else if (activeSession.type === 'sleep') {
      addXp(30);
    }

    setActiveSession(null);
    setActiveSeconds(0);
  };

  // Delete / Undo any logged time entry
  const handleDeleteEntry = (entryId: string) => {
    const entryToDelete = entries.find((e) => e.id === entryId);
    if (!entryToDelete) return;

    setEntries((prev) => prev.filter((e) => e.id !== entryId));

    if (entryToDelete.type === 'music') {
      addXp(-50);
    } else if (entryToDelete.type === 'study') {
      const xpToDeduct = Math.min(60, Math.round((entryToDelete.durationMinutes || 0) * 0.5));
      addXp(-xpToDeduct);
    } else if (entryToDelete.type === 'sleep') {
      addXp(-30);
    }
  };

  // Log Custom Sleep Window (Bedtime -> Wake up)
  const handleLogCustomSleep = (options: {
    startTimeIso: string;
    endTimeIso: string;
    durationMinutes: number;
  }) => {
    if (todaySleepEntry) {
      handleDeleteEntry(todaySleepEntry.id);
    }

    const newEntry: TimeEntry = {
      id: `local_sleep_${Date.now()}`,
      userId: 'local_desktop_user',
      type: 'sleep',
      action: 'stop',
      topic: 'Restorative Sleep',
      startTime: options.startTimeIso,
      endTime: options.endTimeIso,
      durationMinutes: options.durationMinutes,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) =>
      [...prev.filter((e) => e.id !== todaySleepEntry?.id), newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );
    addXp(30);
    playEarnedChime();
  };

  // Toggle Riyaz helper
  const handleToggleRiyaz = (options?: {
    startTimeIso?: string;
    endTimeIso?: string;
    durationMinutes?: number;
  }) => {
    if (todayRiyazEntry && !options) {
      handleDeleteEntry(todayRiyazEntry.id);
      return;
    }

    const now = new Date();
    const startIso = options?.startTimeIso || now.toISOString();
    const durMins = options?.durationMinutes || 180;
    const endIso =
      options?.endTimeIso ||
      new Date(new Date(startIso).getTime() + durMins * 60000).toISOString();

    const newEntry: TimeEntry = {
      id: `local_riyaz_${Date.now()}`,
      userId: 'local_desktop_user',
      type: 'music',
      action: 'tick',
      topic: 'Riyaz (Music Practice)',
      habitId: 'music',
      startTime: startIso,
      endTime: endIso,
      durationMinutes: durMins,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) =>
      [...prev.filter((e) => e.id !== todayRiyazEntry?.id), newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );
    addXp(50);
    playEarnedChime();
  };

  // Save / Update Custom Habits
  const handleSaveHabits = (newHabits: CustomHabit[]) => {
    setHabits(newHabits);
    writeLocalData(STORAGE_KEYS.CUSTOM_HABITS, newHabits);
  };

  // Generic Habit Toggle
  const handleToggleHabit = (
    habit: CustomHabit,
    options?: {
      startTimeIso?: string;
      endTimeIso?: string;
      durationMinutes?: number;
    }
  ) => {
    const existing = entries.find(
      (e) =>
        (e.habitId === habit.id ||
          e.type === habit.entryType ||
          (e.topic && e.topic.toLowerCase().includes(habit.shortcode.toLowerCase()))) &&
        e.startTime &&
        e.startTime.startsWith(selectedDate)
    );

    if (existing && !options) {
      handleDeleteEntry(existing.id);
      return;
    }

    const now = new Date();
    const startIso = options?.startTimeIso || now.toISOString();
    const durMins = options?.durationMinutes || Math.round(habit.defaultDurationHours * 60);
    const endIso =
      options?.endTimeIso ||
      new Date(new Date(startIso).getTime() + durMins * 60000).toISOString();

    const newEntry: TimeEntry = {
      id: `local_h_${Date.now()}`,
      userId: 'local_desktop_user',
      type: habit.entryType,
      action: 'tick',
      topic: habit.name,
      habitId: habit.id,
      startTime: startIso,
      endTime: endIso,
      durationMinutes: durMins,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) =>
      [...prev.filter((e) => e.id !== existing?.id), newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );
    addXp(50);
    playEarnedChime();
  };

  // Day Boundary (Login / Shady Logout Auto-Check)
  const handleDayBoundary = (action: 'start' | 'stop') => {
    const nowIso = new Date().toISOString();

    const newEntry: TimeEntry = {
      id: `local_boundary_${Date.now()}`,
      userId: 'local_desktop_user',
      type: 'day_boundary',
      action,
      topic: action === 'start' ? 'Desk Login' : 'Desk Logout',
      startTime: nowIso,
      endTime: nowIso,
      durationMinutes: 0,
      source: 'manual',
      createdAt: nowIso,
    };

    setEntries((prev) => [...prev, newEntry]);

    if (action === 'start') {
      setIsDeskLoggedIn(true);
      setDeskLoginTimestamp(nowIso);
      setMotivationModalState({
        isOpen: true,
        type: 'login',
        timestamp: nowIso,
      });
    } else {
      // Stop active timer cleanly if running on logout
      if (activeSession) {
        handleStopSession();
      }
      setIsDeskLoggedIn(false);
      // Open Day-End Audit modal first (it auto-checks missing quotas/habits or celebrates!)
      setIsDayCloseOpen(true);
    }
  };

  // Confirm Day-End Reconciliation -> trigger logout chime + motivation animation
  const handleConfirmReconciliation = (data: {
    carryForwardApproved: boolean;
    reason: string;
    action: 'carry_forward' | 'send_to_vault';
  }) => {
    const nowIso = new Date().toISOString();

    if (data.action === 'carry_forward' && data.carryForwardApproved) {
      setStudyDeficitCarryForwardMinutes(studyDeficitMinutes);
      setBankedCarryForwardMinutes((prev) => prev + breakSurplusMinutes);
    } else if (data.action === 'send_to_vault' && studyDeficitMinutes > 0) {
      const lostHours = Math.round((studyDeficitMinutes / 60) * 10) / 10;
      const vaultItem: VaultEntry = {
        id: `local_v_${Date.now()}`,
        userId: 'local_desktop_user',
        date: selectedDate,
        hoursLost: lostHours,
        type: 'unreconciled_study_debt',
        note: data.reason || 'Retired to Vault without carry-forward.',
        createdAt: nowIso,
      };
      setVaultEntries((prev) => [...prev, vaultItem]);
      setStudyDeficitCarryForwardMinutes(0);
    }

    setMotivationModalState({
      isOpen: true,
      type: 'logout',
      timestamp: nowIso,
    });
  };

  // Unified Shortcode Command Handler (lives in Study Quota Card 02)
  const handleShortcodeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    const cmd = trimmed.toLowerCase();
    if (!cmd) return;

    if (cmd.startsWith('s on ') || cmd.startsWith('study on ')) {
      const topic = trimmed.slice(cmd.indexOf('on ') + 3).trim();
      handleStartSession('study', topic || 'General Study');
    } else if (cmd === 's on' || cmd === 'study on') {
      handleStartSession('study', 'General Study');
    } else if (cmd === 's off' || cmd === 'study off') {
      handleStopSession();
    } else if (cmd === 'bon' || cmd === 'break on' || cmd === 'b on') {
      handleStartSession('break', 'Break');
    } else if (cmd === 'boff' || cmd === 'break off' || cmd === 'b off') {
      handleStopSession();
    } else if (cmd === 'c on' || cmd === 'content on') {
      handleStartSession('content', 'Content Creation');
    } else if (cmd === 'c off' || cmd === 'content off') {
      handleStopSession();
    } else if (cmd === 'sl on' || cmd === 'sleep on') {
      handleStartSession('sleep', 'Restorative Sleep');
    } else if (cmd === 'sl off' || cmd === 'sleep off') {
      handleStopSession();
    } else if (cmd.startsWith('sleep') || cmd.startsWith('sl ')) {
      const parts = cmd.split(/\s+/);
      const parsedH = parts.length > 1 ? parseFloat(parts[1]) : 8;
      const validH = isNaN(parsedH) || parsedH <= 0 ? 8 : parsedH;
      const startDate = new Date(`${selectedDate}T23:00:00`);
      const durMins = Math.round(validH * 60);
      const endDate = new Date(startDate.getTime() + durMins * 60000);
      handleLogCustomSleep({
        startTimeIso: startDate.toISOString(),
        endTimeIso: endDate.toISOString(),
        durationMinutes: durMins,
      });
    } else if (cmd === 'login' || cmd === 'on desk') {
      handleDayBoundary('start');
    } else if (cmd === 'logout' || cmd === 'off desk' || cmd === 'otd') {
      handleDayBoundary('stop');
    } else if (cmd === 'undo' && lastLoggedEntry) {
      handleDeleteEntry(lastLoggedEntry.id);
    } else {
      const matchedHabit = habits.find(
        (h) =>
          cmd === h.shortcode.toLowerCase() ||
          cmd.startsWith(`${h.shortcode.toLowerCase()} `) ||
          (h.id === 'music' && (cmd.startsWith('riyaz') || cmd.startsWith('music')))
      );

      if (matchedHabit) {
        const parts = cmd.split(/\s+/);
        const parsedH =
          parts.length > 1 ? parseFloat(parts[1]) : matchedHabit.defaultDurationHours;
        const validH =
          isNaN(parsedH) || parsedH <= 0 ? matchedHabit.defaultDurationHours : parsedH;

        const now = new Date();
        const durMins = Math.round(validH * 60);
        const end = new Date(now.getTime() + durMins * 60000);

        handleToggleHabit(matchedHabit, {
          startTimeIso: now.toISOString(),
          endTimeIso: end.toISOString(),
          durationMinutes: durMins,
        });
      }
    }
  };

  // Achievements CRUD (strictly user-written / user-managed)
  const handleAddAchievement = (item: Omit<AchievementItem, 'id' | 'createdAt'>) => {
    const created: AchievementItem = {
      id: `ach_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...item,
    };
    setAchievements((prev) => [created, ...prev]);
    if (created.showInTicker) {
      setTickerFlashTrigger((n) => n + 1);
    }
    addXp(25);
  };

  const handleUpdateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDeleteAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  // WhatsApp Import Commit (Local IndexedDB / LocalStorage)
  const handleCommitWhatsApp = async (result: ParsedWhatsAppResult): Promise<void> => {
    const nowIso = new Date().toISOString();

    const importedEntries: TimeEntry[] = result.validEntries.map((item, idx) => ({
      id: `wa_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      userId: 'local_desktop_user',
      ...item,
      createdAt: nowIso,
    }));

    setEntries((prev) =>
      [...prev, ...importedEntries].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );

    const importedReviews: ReviewItem[] = result.reviewItems.map((r, idx) => ({
      id: `wa_rev_${Date.now()}_${idx}`,
      userId: 'local_desktop_user',
      rawMessage: r.rawMessage,
      timestamp: r.timestamp,
      reason: r.reason,
      status: 'pending',
      createdAt: nowIso,
    }));
    setReviewItems((prev) => [...prev, ...importedReviews]);

    const newGaps: GapItem[] = result.toFillGaps.map((g, idx) => ({
      id: `gap_${Date.now()}_${idx}`,
      startTime: g.timestamp,
      endTime: g.timestamp,
      durationMinutes: 45,
      type: g.suspectedType === 'missing_off' ? 'missing_off' : 'unaccounted_gap',
      description: g.description,
    }));
    setToFillGaps((prev) => [...prev, ...newGaps]);

    addXp(result.validEntries.length * 10);
  };

  // Fill Gap from Review Queue
  const handleFillGap = (gapId: string, durationMinutes: number, type: 'study' | 'break') => {
    const gap = toFillGaps.find((g) => g.id === gapId);
    if (!gap) return;

    const nowIso = new Date().toISOString();
    const newEntry: TimeEntry = {
      id: `filled_${Date.now()}`,
      userId: 'local_desktop_user',
      type,
      action: 'stop',
      topic: type === 'study' ? 'Filled Gap Session' : 'Filled Break',
      startTime: gap.startTime,
      endTime: new Date(new Date(gap.startTime).getTime() + durationMinutes * 60000).toISOString(),
      durationMinutes,
      source: 'manual',
      createdAt: nowIso,
    };

    setEntries((prev) =>
      [...prev, newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );
    setToFillGaps((prev) => prev.filter((g) => g.id !== gapId));
  };

  const handleDismissReviewItem = (id: string) => {
    setReviewItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddWordRule = (rule: Omit<WordRule, 'id'>) => {
    setWordRules((prev) => [...prev, { id: `rule_${Date.now()}`, ...rule }]);
  };

  const handleDeleteWordRule = (id: string) => {
    setWordRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Intro + Robot Teacher Tutorial Bundle Handlers
  const handleIntroComplete = () => {
    setForceShowIntro(false);
    if (pendingTutorialAfterIntroRef.current) {
      pendingTutorialAfterIntroRef.current = false;
      setIsTutorialOpen(true);
    }
  };

  const handleReplayIntroBundle = () => {
    setIsTutorialOpen(false);
    pendingTutorialAfterIntroRef.current = true;
    setForceShowIntro(true);
  };

  const handleSkipTutorialForNow = () => {
    setIsTutorialOpen(false);
  };

  const handleDoNotShowTutorialAgain = () => {
    const updated: TutorialPrefs = { ...tutorialPrefs, doNotShowAgain: true };
    setTutorialPrefs(updated);
    writeLocalData(STORAGE_KEYS.TUTORIAL_PREFS, updated);
    setIsTutorialOpen(false);
  };

  const handleCompleteTutorialLesson = () => {
    if (!tutorialPrefs.claimedBonus) {
      addXp(25);
      const updated: TutorialPrefs = { ...tutorialPrefs, claimedBonus: true };
      setTutorialPrefs(updated);
      writeLocalData(STORAGE_KEYS.TUTORIAL_PREFS, updated);
    }
    setIsTutorialOpen(false);
  };

  return (
    <div
      data-studio-theme={studioTheme}
      className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-100 relative overflow-x-clip"
    >
      {/* Fixed Ambient Studio Lighting Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="animate-studio-float absolute -top-40 left-[-10%] w-[520px] h-[520px] rounded-full blur-[120px] transition-colors duration-700"
          style={{ background: 'radial-gradient(circle, var(--studio-orb-1), transparent 70%)' }}
        />
        <div
          className="animate-studio-float absolute top-[35%] right-[-12%] w-[540px] h-[540px] rounded-full blur-[130px] transition-colors duration-700"
          style={{
            background: 'radial-gradient(circle, var(--studio-orb-2), transparent 70%)',
            animationDelay: '-5s',
          }}
        />
        <div
          className="animate-studio-float absolute -bottom-36 left-[28%] w-[500px] h-[500px] rounded-full blur-[130px] transition-colors duration-700"
          style={{
            background: 'radial-gradient(circle, var(--studio-orb-3), transparent 70%)',
            animationDelay: '-9s',
          }}
        />
      </div>

      {/* Minimalist Cinematic Intro Animation (Bundled with Robot Teacher Tutorial) */}
      <IntroAnimation
        forceShow={forceShowIntro}
        autoShowOnMount={!initialTutorialPrefs.doNotShowAgain}
        onComplete={handleIntroComplete}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* 3-Zone Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as typeof currentTab)}
        reviewCount={reviewItems.length + toFillGaps.length}
        vaultCount={vaultEntries.length}
        achievementsCount={achievements.length}
        onOpenResetInfo={() => setIsResetInfoOpen(true)}
        onReplayIntro={handleReplayIntroBundle}
      />

      {/* News-Channel Moving Achievement Ticker at the Top */}
      <AchievementNewsTicker
        achievements={achievements}
        tickerSettings={tickerSettings}
        flashTrigger={tickerFlashTrigger}
        onOpenAchievementsTab={() => setCurrentTab('achievements')}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Date Navigator */}
        {(currentTab === 'desk' || currentTab === 'timeline') && (
          <DateNavigator
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            unreconciledCount={unreconciledDays.length}
          />
        )}

        {/* Past Day Audit Banner */}
        {unreconciledDays.length > 0 && currentTab === 'desk' && (
          <PastDayAuditBanner
            unreconciledDays={unreconciledDays}
            onVaultPastDay={handleVaultPastDay}
            onCarryForwardPastDay={handleCarryForwardPastDay}
            onVaultAllPastDays={handleVaultAllPastDays}
          />
        )}

        {/* Tab 1: Desk Cockpit - Cleanly Separated Step-by-Step Sections */}
        {currentTab === 'desk' && (
          <div className="space-y-10 sm:space-y-12">
            {/* Quick Step Navigation Strip + Interactive Studio Vibe Switcher */}
            <div className="sticky top-[56px] lg:top-[58px] z-30 py-2.5 px-4 bg-[#101014]/90 backdrop-blur-md border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 overflow-x-auto text-xs scrollbar-none shadow-xl shadow-black/50">
              <div className="flex items-center gap-3 shrink-0">
                <span className="label-scandi text-emerald-400">
                  Desk Flow
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <a href="#section-command" className="px-2.5 py-1 rounded-md hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-emerald-400 font-bold mr-1">01.</span>
                    <span className="font-medium">Command</span>
                  </a>
                  <span className="text-zinc-800">·</span>
                  <a href="#section-focus" className="px-2.5 py-1 rounded-md hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-emerald-400 font-bold mr-1">02.</span>
                    <span className="font-medium">Focus (6h)</span>
                  </a>
                  <span className="text-zinc-800">·</span>
                  <a href="#section-break" className="px-2.5 py-1 rounded-md hover:bg-amber-500/10 text-zinc-300 hover:text-amber-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-amber-400 font-bold mr-1">03.</span>
                    <span className="font-medium">Break Bank</span>
                  </a>
                  <span className="text-zinc-800">·</span>
                  <a href="#section-sleep" className="px-2.5 py-1 rounded-md hover:bg-indigo-500/10 text-zinc-300 hover:text-indigo-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-indigo-400 font-bold mr-1">04.</span>
                    <span className="font-medium">Sleep</span>
                  </a>
                  <span className="text-zinc-800">·</span>
                  <a href="#section-habits" className="px-2.5 py-1 rounded-md hover:bg-purple-500/10 text-zinc-200 hover:text-purple-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-purple-400 font-bold mr-1">05.</span>
                    <span className="font-medium">Habits ({habits.length})</span>
                  </a>
                  <span className="text-zinc-800">·</span>
                  <a href="#section-timeline" className="px-2.5 py-1 rounded-md hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-200 transition-colors whitespace-nowrap">
                    <span className="font-mono text-cyan-400 font-bold mr-1">06.</span>
                    <span className="font-medium">Visuals</span>
                  </a>
                </div>
              </div>

              {/* Interactive Studio Mood Selector */}
              <div className="flex items-center gap-2 pl-3 border-l border-zinc-800 shrink-0">
                <span className="label-scandi text-zinc-500 hidden xl:inline">Studio Light</span>
                <div className="flex items-center gap-1.5" role="group" aria-label="Studio Atmosphere Color">
                  {(
                    [
                      { id: 'emerald', label: 'Emerald Focus', dotClass: 'bg-emerald-400 shadow-[0_0_10px_#34d399]' },
                      { id: 'gold', label: 'Obsidian Gold', dotClass: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' },
                      { id: 'violet', label: 'Royal Violet', dotClass: 'bg-purple-400 shadow-[0_0_10px_#c084fc]' },
                      { id: 'cyan', label: 'Arctic Cyan', dotClass: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' },
                    ] as const
                  ).map((vibe) => (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => handleSelectStudioTheme(vibe.id)}
                      title={`Switch Studio Atmosphere: ${vibe.label}`}
                      aria-label={`Switch Studio Atmosphere: ${vibe.label}`}
                      className={`interactive-press w-4 h-4 rounded-full transition-all cursor-pointer ${vibe.dotClass} ${
                        studioTheme === vibe.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#101014] scale-110 opacity-100'
                          : 'opacity-50 hover:opacity-90 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step 01: Desk Command Center & Active Elapsed Login Timer */}
            <section id="section-command" className="scroll-mt-28 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-mono font-bold text-emerald-400">01.</span>
                  <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white">
                    Desk Command & Session Controls
                  </h2>
                </div>
                <span className="label-scandi text-emerald-400/80 hidden sm:inline">Elapsed Login Monitor</span>
              </div>
              <DeskQuickLogger
                activeSession={activeSession}
                onStopSession={handleStopSession}
                onDayBoundary={handleDayBoundary}
                isDeskLoggedIn={isDeskLoggedIn}
                deskLoginTimestamp={deskLoginTimestamp}
                lastLoggedEntry={lastLoggedEntry}
                onUndoEntry={handleDeleteEntry}
              />
            </section>

            {/* Step 02, 03, 04: The Core Quota Triad */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Step 02: 6-Hour Study Quota Card + S on + Quick Shortcode Bar */}
              <section id="section-focus" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-1.5 border-b border-emerald-500/25">
                  <span className="text-xs font-mono font-bold text-emerald-400">02.</span>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-emerald-50">
                    Focus Quota (6h Target)
                  </h2>
                </div>
                <StudyQuotaCard
                  completedStudyMinutesToday={studyMinutesToday}
                  isStudyActive={activeSession?.type === 'study'}
                  activeStudyDurationSeconds={activeSession?.type === 'study' ? activeSeconds : 0}
                  studyDeficitCarryForwardMinutes={studyDeficitCarryForwardMinutes}
                  currentStreak={profile.currentStreak || 1}
                  level={profile.level || 1}
                  onStartStudy={(topic) => handleStartSession('study', topic)}
                  onStopSession={handleStopSession}
                  onShortcodeSubmit={handleShortcodeCommand}
                />
              </section>

              {/* Step 03: 2-Hour Decrementing Break Bank Card + Break (bon) Button */}
              <section id="section-break" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-1.5 border-b border-amber-500/25">
                  <span className="text-xs font-mono font-bold text-amber-400">03.</span>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-amber-50">
                    Break Bank & Emergency Alerts
                  </h2>
                </div>
                <BreakBankCard
                  usedBreakMinutesToday={breakMinutesToday}
                  isBreakActive={activeSession?.type === 'break'}
                  activeBreakDurationSeconds={activeSession?.type === 'break' ? activeSeconds : 0}
                  bankedCarryForwardMinutes={bankedCarryForwardMinutes}
                  onStartBreak={() => handleStartSession('break', 'Break')}
                  onStopBreak={handleStopSession}
                />
              </section>

              {/* Step 04: 8-Hour Restorative Sleep Tracker Card */}
              <section id="section-sleep" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-1.5 border-b border-indigo-500/25">
                  <span className="text-xs font-mono font-bold text-indigo-400">04.</span>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-indigo-50">
                    Restorative Sleep & Recovery
                  </h2>
                </div>
                <SleepTrackerCard
                  sleepMinutesToday={sleepMinutesToday}
                  isSleepActive={activeSession?.type === 'sleep'}
                  activeSleepDurationSeconds={activeSession?.type === 'sleep' ? activeSeconds : 0}
                  todaySleepEntry={todaySleepEntry}
                  onStartSleep={() => handleStartSession('sleep', 'Restorative Sleep')}
                  onStopSleep={handleStopSession}
                  onLogCustomSleep={handleLogCustomSleep}
                  onUndoSleep={handleDeleteEntry}
                  selectedDate={selectedDate}
                />
              </section>
            </div>

            {/* Step 05: Practice & Habits Hub (Riyaz, Gym, Reading, Custom Routines) */}
            <section id="section-habits" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/25">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-mono font-bold text-purple-400">05.</span>
                  <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-purple-50">
                    Practice & Habits Hub
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHabitsManagerOpen(true)}
                  className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-gradient-to-r from-purple-400 to-fuchsia-300 hover:brightness-110 rounded-lg transition-all cursor-pointer shadow-[0_0_18px_-4px_rgba(192,132,252,0.55)]"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Customize / Add Habits</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    todayEntries={entries}
                    onToggleHabit={handleToggleHabit}
                    onEditHabit={() => setIsHabitsManagerOpen(true)}
                    selectedDate={selectedDate}
                  />
                ))}
              </div>
            </section>

            {/* Step 06: Timeline, Heatmap & Multi-Visualization Analytics */}
            <section id="section-timeline" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/25">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-mono font-bold text-cyan-400">06.</span>
                  <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-cyan-50">
                    24-Hour Timeline & Visual Analytics
                  </h2>
                </div>
                <span className="label-scandi text-cyan-400/80 hidden sm:inline">
                  Heatmap · Candlestick · Donut · Stacked
                </span>
              </div>
              <TimelineHeatmap
                entries={entries}
                selectedDate={selectedDate}
                gaps={toFillGaps}
                onDeleteEntry={handleDeleteEntry}
              />
            </section>

            {/* Step 07: Study Science & Insights */}
            <section id="section-insights" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-baseline gap-2.5 pb-2.5 border-b border-emerald-500/25">
                <span className="text-xs font-mono font-bold text-emerald-400">07.</span>
                <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-emerald-50">
                  Accountability & Focus Principles
                </h2>
              </div>
              <InsightsTips entries={entries} />
            </section>
          </div>
        )}

        {/* Tab 2: Timeline & Analytics */}
        {currentTab === 'timeline' && (
          <TimelineHeatmap
            entries={entries}
            selectedDate={selectedDate}
            gaps={toFillGaps}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {/* Tab 3: Achievements & News Ticker Studio (next to Timeline & Heatmap) */}
        {currentTab === 'achievements' && (
          <div id="section-achievements" className="scroll-mt-24">
            <AchievementsTab
              achievements={achievements}
              onAddAchievement={handleAddAchievement}
              onUpdateAchievement={handleUpdateAchievement}
              onDeleteAchievement={handleDeleteAchievement}
              tickerSettings={tickerSettings}
              onUpdateTickerSettings={setTickerSettings}
              onFlashTickerNow={() => setTickerFlashTrigger((n) => n + 1)}
            />
          </div>
        )}

        {/* Tab 4: WhatsApp Importer */}
        {currentTab === 'importer' && (
          <WhatsAppImporter
            wordRules={wordRules}
            onAddWordRule={handleAddWordRule}
            onDeleteWordRule={handleDeleteWordRule}
            onCommitImport={handleCommitWhatsApp}
            existingHashes={existingHashes}
          />
        )}

        {/* Tab 5: Vault of Lost Time */}
        {currentTab === 'vault' && (
          <div id="section-vault" className="scroll-mt-24">
            <VaultOfLostTime
              vaultEntries={vaultEntries}
              unreconciledDays={unreconciledDays}
              onVaultPastDay={handleVaultPastDay}
              onCarryForwardPastDay={handleCarryForwardPastDay}
              onCarryForwardVaultEntry={handleCarryForwardVaultEntry}
              onUpdateVaultNote={handleUpdateVaultNote}
            />
          </div>
        )}

        {/* Tab 6: Review Queue */}
        {currentTab === 'review' && (
          <ReviewQueue
            reviewItems={reviewItems}
            toFillGaps={toFillGaps}
            onDismissReviewItem={handleDismissReviewItem}
            onFillGap={handleFillGap}
          />
        )}
      </main>

      {/* Day Close Auto-Audit Modal */}
      <DayCloseModal
        isOpen={isDayCloseOpen}
        onClose={() => setIsDayCloseOpen(false)}
        studyMinutesToday={studyMinutesToday}
        breakMinutesToday={breakMinutesToday}
        studyDeficitMinutes={studyDeficitMinutes}
        breakSurplusMinutes={breakSurplusMinutes}
        dailyCompletionStatus={dailyCompletionStatus}
        onConfirmReconciliation={handleConfirmReconciliation}
      />

      {/* Reset Info & Rollover Schedule Modal */}
      <ResetInfoModal
        isOpen={isResetInfoOpen}
        onClose={() => setIsResetInfoOpen(false)}
        onTriggerManualClose={() => {
          setIsResetInfoOpen(false);
          setIsDayCloseOpen(true);
        }}
        selectedDate={selectedDate}
      />

      {/* Custom Habits Management Modal */}
      <CustomHabitsManager
        isOpen={isHabitsManagerOpen}
        onClose={() => setIsHabitsManagerOpen(false)}
        habits={habits}
        onSaveHabits={handleSaveHabits}
      />

      {/* Day Login & Logout Beep & Motivation Animation Modal */}
      <MotivationModal
        isOpen={motivationModalState.isOpen}
        onClose={() => setMotivationModalState((prev) => ({ ...prev, isOpen: false }))}
        type={motivationModalState.type}
        timestamp={motivationModalState.timestamp}
      />

      {/* Interactive Gamified Dancing Robot Teacher Tutorial */}
      <RobotTutorialModal
        isOpen={isTutorialOpen}
        onSkipForNow={handleSkipTutorialForNow}
        onDoNotShowAgain={handleDoNotShowTutorialAgain}
        onCompleteLesson={handleCompleteTutorialLesson}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}
