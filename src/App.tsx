import { Sliders } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AchievementNewsTicker } from './components/AchievementNewsTicker';
import { AchievementsTab } from './components/AchievementsTab';
import { BreakBankCard } from './components/BreakBankCard';
import { CustomHabitsManager, DEFAULT_HABITS } from './components/CustomHabitsManager';
import { DateNavigator } from './components/DateNavigator';
import { DailyCompletionStatus, DayCloseModal } from './components/DayCloseModal';
import { DeskQuickLogger } from './components/DeskQuickLogger';
import { HabitCard } from './components/HabitCard';
import { InsightsTips } from './components/InsightsTips';
import { IntroAnimation } from './components/IntroAnimation';
import { LifeShortcodeDrawer } from './components/LifeShortcodeDrawer';
import { MotivationModal } from './components/MotivationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PastDayAuditBanner, UnreconciledPastDay } from './components/PastDayAuditBanner';
import { ResetInfoModal } from './components/ResetInfoModal';
import { RobotTutorialModal } from './components/RobotTutorialModal';
import { SleepTrackerCard } from './components/SleepTrackerCard';
import { StudioDesignPicker, THEME_DEFAULT_TEXT_STYLE } from './components/StudioDesignPicker';
import { StudyQuotaCard } from './components/StudyQuotaCard';
import { ActivityProgressModal } from './components/ActivityProgressModal';
import { ActivityProgressStudio } from './components/ActivityProgressStudio';
import { TopBar } from './components/TopBar';
import {
  CURRENT_APP_VERSION,
  SEEN_VERSION_STORAGE_KEY,
  WhatsNewModal,
} from './components/WhatsNewModal';
import { ActiveDeskTelemetry, ActivityFilterId, ProgressTemplateId } from './lib/progressAnalytics';
import { VaultOfLostTime } from './components/VaultOfLostTime';
import { useLocalProfile } from './context/LocalProfileContext';
import { playDeskClick, playEarnedChime } from './lib/audioAlert';
import { readLocalAsync, readLocalSync, STORAGE_KEYS, writeLocalData } from './lib/localDb';
import {
  addNoteToActiveSession,
  BASE_BREAK_QUOTA_MINUTES,
  BASE_STUDY_TARGET_MINUTES,
  buildCompletedEntryFromSession,
  formatLocalYMD,
  getEffectiveWriteDate,
  getSessionAssignedDate,
  getSessionElapsedMs,
  isEntryOnLocalDate,
  normalizeActiveSession,
  processDailyRollover,
} from './lib/sessionRollover';
import {
  AchievementItem,
  ActiveSession,
  CustomHabit,
  EntryType,
  GapItem,
  StudioTextStyleId,
  StudioThemeId,
  TickerSettings,
  TimeEntry,
  VaultEntry,
} from './types/tracker';

interface PersistedAppState {
  activeSession: ActiveSession | null;
  activeDate?: string;
  lastRolloverDate?: string;
  rolledOverDates?: string[];
  reconciledDates?: string[];
  isDeskLoggedIn: boolean;
  deskLoginTimestamp: string | null;
  isDeskTimerPaused?: boolean;
  deskPausedAt?: string | null;
  deskAccumulatedPausedMs?: number;
  studyDeficitCarryForwardMinutes: number;
  bankedCarryForwardMinutes: number;
  carriedDates: string[];
}

const getDefaultAppState = (): PersistedAppState => ({
  activeSession: null,
  activeDate: formatLocalYMD(new Date()),
  lastRolloverDate: '',
  rolledOverDates: [],
  reconciledDates: [],
  isDeskLoggedIn: true,
  deskLoginTimestamp: new Date().toISOString(),
  isDeskTimerPaused: false,
  deskPausedAt: null,
  deskAccumulatedPausedMs: 0,
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
    'desk' | 'timeline' | 'achievements' | 'vault'
  >('desk');

  // Persisted core app state
  const initialAppState = useMemo(
    () => readLocalSync<PersistedAppState>(STORAGE_KEYS.APP_STATE, getDefaultAppState()),
    []
  );
  const initialNormalizedSession = useMemo(
    () => normalizeActiveSession(initialAppState.activeSession),
    [initialAppState]
  );
  const initialActiveDate = useMemo(() => {
    if (initialNormalizedSession) {
      return getSessionAssignedDate(initialNormalizedSession);
    }
    return initialAppState.activeDate || formatLocalYMD(new Date());
  }, [initialNormalizedSession, initialAppState]);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    initialNormalizedSession
  );
  const [activeDate, setActiveDate] = useState<string>(initialActiveDate);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    initialNormalizedSession ? getSessionAssignedDate(initialNormalizedSession) : formatLocalYMD(new Date())
  );
  const [currentSystemDate, setCurrentSystemDate] = useState<string>(() =>
    formatLocalYMD(new Date())
  );
  const [lastRolloverDate, setLastRolloverDate] = useState<string>(
    initialAppState.lastRolloverDate || ''
  );
  const [rolledOverDates, setRolledOverDates] = useState<string[]>(
    initialAppState.rolledOverDates || []
  );
  const [reconciledDates, setReconciledDates] = useState<string[]>(
    initialAppState.reconciledDates || []
  );

  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isDeskLoggedIn, setIsDeskLoggedIn] = useState<boolean>(initialAppState.isDeskLoggedIn);
  const [deskLoginTimestamp, setDeskLoginTimestamp] = useState<string | null>(
    initialAppState.deskLoginTimestamp || (initialAppState.isDeskLoggedIn ? new Date().toISOString() : null)
  );
  const [isDeskTimerPaused, setIsDeskTimerPaused] = useState<boolean>(
    !!initialAppState.isDeskTimerPaused
  );
  const [deskPausedAt, setDeskPausedAt] = useState<string | null>(
    initialAppState.deskPausedAt || null
  );
  const [deskAccumulatedPausedMs, setDeskAccumulatedPausedMs] = useState<number>(
    initialAppState.deskAccumulatedPausedMs || 0
  );
  const [deskElapsedSeconds, setDeskElapsedSeconds] = useState<number>(0);
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
  const [toFillGaps, setToFillGaps] = useState<GapItem[]>(() =>
    readLocalSync<GapItem[]>(STORAGE_KEYS.TO_FILL_GAPS, [])
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
    () => ({
      ...DEFAULT_TUTORIAL_PREFS,
      ...readLocalSync<Partial<TutorialPrefs>>(STORAGE_KEYS.TUTORIAL_PREFS, DEFAULT_TUTORIAL_PREFS),
    }),
    []
  );
  const [tutorialPrefs, setTutorialPrefs] = useState<TutorialPrefs>(initialTutorialPrefs);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const pendingTutorialAfterIntroRef = useRef<boolean>(!initialTutorialPrefs.doNotShowAgain);

  // Modals & Version Update Changelog
  const initialHasUnseenUpdate = useMemo(() => {
    try {
      return localStorage.getItem(SEEN_VERSION_STORAGE_KEY) !== CURRENT_APP_VERSION;
    } catch {
      return true;
    }
  }, []);
  const pendingWhatsNewAfterIntroRef = useRef<boolean>(initialHasUnseenUpdate);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState<boolean>(false);
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

  // Interactive Studio Atmosphere & Design Personality Theme
  const [studioTheme, setStudioTheme] = useState<StudioThemeId>(() => {
    try {
      const saved = localStorage.getItem('ptt_studio_theme_v1');
      if (
        saved === 'emerald' ||
        saved === 'gold' ||
        saved === 'violet' ||
        saved === 'cyan' ||
        saved === 'rose' ||
        saved === 'solar' ||
        saved === 'royal' ||
        saved === 'synth'
      ) {
        return saved;
      }
    } catch {
      // ignore storage failure
    }
    return 'emerald';
  });

  const [studioTextStyle, setStudioTextStyle] = useState<StudioTextStyleId>(() => {
    try {
      const saved = localStorage.getItem('ptt_studio_text_style_v1');
      if (
        saved === 'auto' ||
        saved === 'minimal' ||
        saved === 'luxury' ||
        saved === 'aurora' ||
        saved === 'blueprint' ||
        saved === 'zen' ||
        saved === 'neopop' ||
        saved === 'royal' ||
        saved === 'monarch' ||
        saved === 'orbit' ||
        saved === 'crazy'
      ) {
        return saved;
      }
    } catch {
      // ignore storage failure
    }
    return 'auto';
  });

  const handleSelectStudioTheme = (theme: StudioThemeId) => {
    playDeskClick();
    setStudioTheme(theme);
    try {
      localStorage.setItem('ptt_studio_theme_v1', theme);
    } catch {
      // ignore storage failure
    }
  };

  const handleSelectStudioTextStyle = (style: StudioTextStyleId) => {
    playDeskClick();
    setStudioTextStyle(style);
    try {
      localStorage.setItem('ptt_studio_text_style_v1', style);
    } catch {
      // ignore storage failure
    }
  };

  const effectiveStudioFont =
    studioTextStyle === 'auto' ? THEME_DEFAULT_TEXT_STYLE[studioTheme] : studioTextStyle;

  // Remade Activity Progress Studio state & Template bar preference
  const [progressActivityFilter, setProgressActivityFilter] = useState<ActivityFilterId>('all');
  const [progressModalActivity, setProgressModalActivity] = useState<ActivityFilterId | null>(null);
  const [progressTemplate, setProgressTemplate] = useState<ProgressTemplateId>(() => {
    try {
      const saved = localStorage.getItem('ptt_progress_template_v1');
      if (
        saved === 'clean-bars' ||
        saved === 'growth-cards' ||
        saved === 'smooth-wave' ||
        saved === 'rings-grid' ||
        saved === 'pulse-blocks'
      ) {
        return saved;
      }
    } catch {
      // ignore storage failure
    }
    return 'clean-bars';
  });

  const handleChangeProgressTemplate = (tpl: ProgressTemplateId) => {
    setProgressTemplate(tpl);
    try {
      localStorage.setItem('ptt_progress_template_v1', tpl);
    } catch {
      // ignore storage failure
    }
  };

  const handleOpenFullProgressSection = (filterId: ActivityFilterId) => {
    setProgressActivityFilter(filterId);
    setCurrentTab('desk');
    window.setTimeout(() => {
      document.getElementById('section-timeline')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const hasHydratedIdb = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const preHydrationActionRef = useRef(false);

  // Hydrate cleanly from IndexedDB on initial mount & re-sync cleanly when a JSON backup is imported
  useEffect(() => {
    let active = true;

    const hydrateAll = (forceImportSync = false) => {
      Promise.all([
        readLocalAsync<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, []),
        readLocalAsync<VaultEntry[]>(STORAGE_KEYS.VAULT_ENTRIES, []),
        readLocalAsync<GapItem[]>(STORAGE_KEYS.TO_FILL_GAPS, []),
        readLocalAsync<CustomHabit[]>(STORAGE_KEYS.CUSTOM_HABITS, DEFAULT_HABITS),
        readLocalAsync<AchievementItem[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
        readLocalAsync<TickerSettings>(STORAGE_KEYS.TICKER_SETTINGS, DEFAULT_TICKER_SETTINGS),
        readLocalAsync<PersistedAppState>(STORAGE_KEYS.APP_STATE, getDefaultAppState()),
        readLocalAsync<Partial<TutorialPrefs>>(STORAGE_KEYS.TUTORIAL_PREFS, DEFAULT_TUTORIAL_PREFS),
      ]).then(
        ([
          loadedEntries,
          loadedVault,
          loadedGaps,
          loadedHabits,
          loadedAchievements,
          loadedTicker,
          loadedAppState,
          loadedTutorialPrefs,
        ]) => {
          if (!active) return;

          // If user already triggered a mutation during the ~10ms boot window, preserve in-memory state instead of clobbering
          const skipOverwrite = !forceImportSync && preHydrationActionRef.current;

          if (!skipOverwrite) {
            if (forceImportSync || loadedEntries.length > 0) setEntries(loadedEntries);
            if (forceImportSync || loadedVault.length > 0) setVaultEntries(loadedVault);
            if (forceImportSync || loadedGaps.length > 0) setToFillGaps(loadedGaps);
            if (forceImportSync || loadedHabits.length > 0) {
              const normalizedHabits = (loadedHabits.length > 0 ? loadedHabits : DEFAULT_HABITS).map(
                (h) => {
                  const safeHours = h.defaultDurationHours || 1;
                  return {
                    ...h,
                    defaultDurationHours: safeHours,
                    dailyTargetMinutes: Math.max(
                      15,
                      h.dailyTargetMinutes || Math.round(safeHours * 60) || 60
                    ),
                  };
                }
              );
              setHabits(normalizedHabits);
            }
            if (forceImportSync || loadedAchievements.length > 0) {
              setAchievements(loadedAchievements);
            }
            if (loadedTicker) setTickerSettings({ ...DEFAULT_TICKER_SETTINGS, ...loadedTicker });
            if (loadedTutorialPrefs) {
              const mergedTut = { ...DEFAULT_TUTORIAL_PREFS, ...loadedTutorialPrefs };
              setTutorialPrefs(mergedTut);
              if (mergedTut.doNotShowAgain) {
                pendingTutorialAfterIntroRef.current = false;
              }
            }
            if (loadedAppState) {
              const normalizedSession = normalizeActiveSession(loadedAppState.activeSession);
              const todayYmd = formatLocalYMD(new Date());
              const loadedIsDeskLoggedIn =
                typeof loadedAppState.isDeskLoggedIn === 'boolean'
                  ? loadedAppState.isDeskLoggedIn
                  : true;
              const loadedDeskLoginTimestamp =
                loadedAppState.deskLoginTimestamp ||
                (loadedIsDeskLoggedIn ? new Date().toISOString() : null);
              const loadedIsDeskTimerPaused = !!loadedAppState.isDeskTimerPaused;
              const loadedDeskPausedAt = loadedAppState.deskPausedAt || null;
              const loadedDeskAccumulatedPausedMs = loadedAppState.deskAccumulatedPausedMs || 0;
              const loadedStudyDeficit = loadedAppState.studyDeficitCarryForwardMinutes || 0;
              const loadedBankedCarry = loadedAppState.bankedCarryForwardMinutes || 0;
              const loadedCarriedDates = loadedAppState.carriedDates || [];
              const loadedRolledOverDates = loadedAppState.rolledOverDates || [];
              const loadedReconciledDates = loadedAppState.reconciledDates || [];
              const loadedLastRolloverDate = loadedAppState.lastRolloverDate || '';

              setActiveSession(normalizedSession);
              setIsDeskLoggedIn(loadedIsDeskLoggedIn);

              if (normalizedSession) {
                // Active session crosses midnight safely: keep its assignedDate and do NOT roll over
                const sessionDate = getSessionAssignedDate(normalizedSession);
                setActiveDate(sessionDate);
                setSelectedDate(sessionDate);
                setDeskLoginTimestamp(loadedDeskLoginTimestamp);
                setIsDeskTimerPaused(loadedIsDeskTimerPaused);
                setDeskPausedAt(loadedDeskPausedAt);
                setDeskAccumulatedPausedMs(loadedDeskAccumulatedPausedMs);
                setStudyDeficitCarryForwardMinutes(loadedStudyDeficit);
                setBankedCarryForwardMinutes(loadedBankedCarry);
                setCarriedDates(loadedCarriedDates);
                setRolledOverDates(loadedRolledOverDates);
                setReconciledDates(loadedReconciledDates);
                setLastRolloverDate(loadedLastRolloverDate);
              } else {
                const candidateActiveDate = loadedAppState.activeDate || todayYmd;
                if (candidateActiveDate < todayYmd) {
                  // Browser reopened on a new day with NO active session -> process rollover once cleanly
                  const effectiveEntries =
                    loadedEntries.length > 0 || forceImportSync ? loadedEntries : entries;
                  const effectiveVault =
                    loadedVault.length > 0 || forceImportSync ? loadedVault : vaultEntries;

                  const rollover = processDailyRollover({
                    fromDate: candidateActiveDate,
                    toDate: todayYmd,
                    entries: effectiveEntries,
                    vaultEntries: effectiveVault,
                    carriedDates: loadedCarriedDates,
                    rolledOverDates: loadedRolledOverDates,
                    reconciledDates: loadedReconciledDates,
                    studyDeficitCarryForwardMinutes: loadedStudyDeficit,
                    bankedCarryForwardMinutes: loadedBankedCarry,
                    activeSession: null,
                    isDeskLoggedIn: loadedIsDeskLoggedIn,
                    deskLoginTimestamp: loadedDeskLoginTimestamp,
                    isDeskTimerPaused: loadedIsDeskTimerPaused,
                    deskPausedAt: loadedDeskPausedAt,
                    deskAccumulatedPausedMs: loadedDeskAccumulatedPausedMs,
                  });

                  setEntries(rollover.nextEntries);
                  setDeskLoginTimestamp(rollover.nextDeskLoginTimestamp);
                  setIsDeskTimerPaused(loadedIsDeskTimerPaused);
                  setDeskPausedAt(rollover.nextDeskPausedAt);
                  setDeskAccumulatedPausedMs(rollover.nextDeskAccumulatedPausedMs);
                  setStudyDeficitCarryForwardMinutes(rollover.nextStudyDeficitCarryForwardMinutes);
                  setBankedCarryForwardMinutes(rollover.nextBankedCarryForwardMinutes);
                  setCarriedDates(rollover.nextCarriedDates);
                  setRolledOverDates(rollover.nextRolledOverDates);
                  setReconciledDates(loadedReconciledDates);
                  setLastRolloverDate(rollover.nextLastRolloverDate);
                  setActiveDate(rollover.nextActiveDate);
                  setSelectedDate(rollover.nextActiveDate);
                } else {
                  setDeskLoginTimestamp(loadedDeskLoginTimestamp);
                  setIsDeskTimerPaused(loadedIsDeskTimerPaused);
                  setDeskPausedAt(loadedDeskPausedAt);
                  setDeskAccumulatedPausedMs(loadedDeskAccumulatedPausedMs);
                  setStudyDeficitCarryForwardMinutes(loadedStudyDeficit);
                  setBankedCarryForwardMinutes(loadedBankedCarry);
                  setCarriedDates(loadedCarriedDates);
                  setRolledOverDates(loadedRolledOverDates);
                  setReconciledDates(loadedReconciledDates);
                  setLastRolloverDate(loadedLastRolloverDate);
                  setActiveDate(candidateActiveDate);
                }
              }
            }
          }

          if (forceImportSync) {
            try {
              const t = localStorage.getItem('ptt_studio_theme_v1') as StudioThemeId | null;
              if (t) setStudioTheme(t);
              const f = localStorage.getItem('ptt_studio_text_style_v1') as StudioTextStyleId | null;
              if (f) setStudioTextStyle(f);
              const p = localStorage.getItem('ptt_progress_template_v1') as ProgressTemplateId | null;
              if (p) setProgressTemplate(p);
            } catch {
              // ignore storage read error
            }
          }

          hasHydratedIdb.current = true;
          setIsHydrated(true);
        }
      );
    };

    hydrateAll(false);

    const handleBackupImported = () => hydrateAll(true);
    window.addEventListener('ptt-data-imported', handleBackupImported);

    return () => {
      active = false;
      window.removeEventListener('ptt-data-imported', handleBackupImported);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mountedRef = useRef(false);
  const shouldPersist = () => {
    if (hasHydratedIdb.current) return true;
    if (mountedRef.current) {
      preHydrationActionRef.current = true;
      return true;
    }
    return false;
  };

  // Persist collections to IndexedDB + LocalStorage whenever they update
  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.TIME_ENTRIES, entries);
  }, [entries]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.VAULT_ENTRIES, vaultEntries);
  }, [vaultEntries]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.TO_FILL_GAPS, toFillGaps);
  }, [toFillGaps]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.CUSTOM_HABITS, habits);
  }, [habits]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }, [achievements]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData(STORAGE_KEYS.TICKER_SETTINGS, tickerSettings);
  }, [tickerSettings]);

  useEffect(() => {
    if (!shouldPersist()) return;
    void writeLocalData<PersistedAppState>(STORAGE_KEYS.APP_STATE, {
      activeSession,
      activeDate,
      lastRolloverDate,
      rolledOverDates,
      reconciledDates,
      isDeskLoggedIn,
      deskLoginTimestamp,
      isDeskTimerPaused,
      deskPausedAt,
      deskAccumulatedPausedMs,
      studyDeficitCarryForwardMinutes,
      bankedCarryForwardMinutes,
      carriedDates,
    });
  }, [
    activeSession,
    activeDate,
    lastRolloverDate,
    rolledOverDates,
    reconciledDates,
    isDeskLoggedIn,
    deskLoginTimestamp,
    isDeskTimerPaused,
    deskPausedAt,
    deskAccumulatedPausedMs,
    studyDeficitCarryForwardMinutes,
    bankedCarryForwardMinutes,
    carriedDates,
  ]);

  // Mark initial mount pass complete AFTER the first render's persistence effects have run
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Active Desk Elapsed timer (respects pause/resume and survives reload)
  useEffect(() => {
    if (!isDeskLoggedIn || !deskLoginTimestamp) {
      setDeskElapsedSeconds(0);
      return;
    }
    const loginMs = new Date(deskLoginTimestamp).getTime();
    if (isNaN(loginMs)) {
      setDeskElapsedSeconds(0);
      return;
    }
    const computeDeskSecs = () => {
      const endMs = isDeskTimerPaused && deskPausedAt ? new Date(deskPausedAt).getTime() : Date.now();
      return Math.max(0, Math.floor((endMs - loginMs - deskAccumulatedPausedMs) / 1000));
    };
    setDeskElapsedSeconds(computeDeskSecs());
    if (isDeskTimerPaused) return;
    const interval = setInterval(() => setDeskElapsedSeconds(computeDeskSecs()), 1000);
    return () => clearInterval(interval);
  }, [isDeskLoggedIn, deskLoginTimestamp, isDeskTimerPaused, deskPausedAt, deskAccumulatedPausedMs]);

  // Active session timer ticker based on real timestamp delta minus paused duration
  useEffect(() => {
    if (!activeSession) {
      setActiveSeconds(0);
      return;
    }
    const updateTick = () => {
      setActiveSeconds(Math.floor(getSessionElapsedMs(activeSession) / 1000));
    };
    updateTick();
    if (activeSession.isPaused) return;
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Selected date's aggregated study, break, and sleep minutes (respecting session assignedDate)
  const { studyMinutesToday, breakMinutesToday, sleepMinutesToday } = useMemo(() => {
    let study = 0;
    let brk = 0;
    let sleep = 0;
    entries.forEach((e) => {
      if (isEntryOnLocalDate(e, selectedDate)) {
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
  const BASE_STUDY_TARGET = BASE_STUDY_TARGET_MINUTES; // 6h (360m)
  const BASE_BREAK_QUOTA = BASE_BREAK_QUOTA_MINUTES; // 2h (120m)
  const effectiveStudyTarget = BASE_STUDY_TARGET + studyDeficitCarryForwardMinutes;
  const studyDeficitMinutes = Math.max(0, effectiveStudyTarget - studyMinutesToday);
  const breakSurplusMinutes = Math.max(0, BASE_BREAK_QUOTA - breakMinutesToday);

  // Track current system local calendar date (00:00 detection & window focus)
  useEffect(() => {
    const syncSystemDate = () => {
      const ymd = formatLocalYMD(new Date());
      setCurrentSystemDate((prev) => (prev === ymd ? prev : ymd));
    };
    const interval = window.setInterval(syncSystemDate, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncSystemDate();
    };
    window.addEventListener('focus', syncSystemDate);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncSystemDate);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Session-aware Daily Rollover:
  // Only rolls over past activeDate -> currentSystemDate when NO active session is running.
  // If a study, break, sleep, or other session is active across midnight, rollover waits until stop.
  useEffect(() => {
    if (!isHydrated) return;
    if (activeSession) return;
    if (!activeDate || activeDate >= currentSystemDate) return;

    const rollover = processDailyRollover({
      fromDate: activeDate,
      toDate: currentSystemDate,
      entries,
      vaultEntries,
      carriedDates,
      rolledOverDates,
      reconciledDates,
      studyDeficitCarryForwardMinutes,
      bankedCarryForwardMinutes,
      activeSession: null,
      isDeskLoggedIn,
      deskLoginTimestamp,
      isDeskTimerPaused,
      deskPausedAt,
      deskAccumulatedPausedMs,
    });

    if (!rollover.didRollover) return;

    if (rollover.nextEntries !== entries) {
      setEntries(rollover.nextEntries);
    }
    if (rollover.nextDeskLoginTimestamp !== deskLoginTimestamp) {
      setDeskLoginTimestamp(rollover.nextDeskLoginTimestamp);
    }
    if (rollover.nextDeskPausedAt !== deskPausedAt) {
      setDeskPausedAt(rollover.nextDeskPausedAt);
    }
    if (rollover.nextDeskAccumulatedPausedMs !== deskAccumulatedPausedMs) {
      setDeskAccumulatedPausedMs(rollover.nextDeskAccumulatedPausedMs);
    }
    setStudyDeficitCarryForwardMinutes(rollover.nextStudyDeficitCarryForwardMinutes);
    setBankedCarryForwardMinutes(rollover.nextBankedCarryForwardMinutes);
    setCarriedDates(rollover.nextCarriedDates);
    setRolledOverDates(rollover.nextRolledOverDates);
    setLastRolloverDate(rollover.nextLastRolloverDate);
    setActiveDate(rollover.nextActiveDate);
    setSelectedDate((prev) => (prev === activeDate ? rollover.nextActiveDate : prev));
  }, [
    isHydrated,
    activeSession,
    activeDate,
    currentSystemDate,
    entries,
    vaultEntries,
    carriedDates,
    rolledOverDates,
    reconciledDates,
    studyDeficitCarryForwardMinutes,
    bankedCarryForwardMinutes,
    isDeskLoggedIn,
    deskLoginTimestamp,
    isDeskTimerPaused,
    deskPausedAt,
    deskAccumulatedPausedMs,
  ]);

  // Check if Riyaz is ticked on selectedDate
  const todayRiyazEntry = useMemo(() => {
    return entries.find(
      (e) => e.type === 'music' && isEntryOnLocalDate(e, selectedDate)
    );
  }, [entries, selectedDate]);

  // Check latest Sleep entry logged on selectedDate
  const todaySleepEntry = useMemo(() => {
    const matches = entries.filter(
      (e) => e.type === 'sleep' && isEntryOnLocalDate(e, selectedDate)
    );
    return matches.length > 0 ? matches[matches.length - 1] : undefined;
  }, [entries, selectedDate]);

  // Last logged entry for selectedDate (used for quick undo)
  const lastLoggedEntry = useMemo(() => {
    const todayList = entries.filter((e) => isEntryOnLocalDate(e, selectedDate));
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
          if (isEntryOnLocalDate(e, item.date)) {
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
          isEntryOnLocalDate(e, selectedDate) &&
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

  // Shared synchronous finalizer so Stop / Switch / Logout never lose or misdate entries or double-rollover
  const awardXpForSession = (session: ActiveSession, elapsedMins: number) => {
    if (session.type === 'study') {
      const earnedXp = Math.min(60, Math.round(elapsedMins * 0.5));
      addXp(earnedXp);
    } else if (session.type === 'sleep') {
      addXp(30);
    }
  };

  // Start Session (safely finalizes any previous running session & processes pending rollover first)
  const handleStartSession = (type: EntryType, topic?: string) => {
    const now = new Date();
    const todayYmd = formatLocalYMD(now);
    let workingEntries = entries;
    let workingStudyDeficit = studyDeficitCarryForwardMinutes;
    let workingBankedCarry = bankedCarryForwardMinutes;
    let workingCarriedDates = carriedDates;
    let workingRolledOverDates = rolledOverDates;
    let workingDeskLoginTs = deskLoginTimestamp;
    let workingDeskPausedAt = deskPausedAt;
    let workingDeskPausedMs = deskAccumulatedPausedMs;
    let workingActiveDate = activeDate;

    if (activeSession) {
      const completedEntry = buildCompletedEntryFromSession(activeSession, now);
      workingEntries = [...workingEntries, completedEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      awardXpForSession(activeSession, completedEntry.durationMinutes || 0);
      workingActiveDate = getSessionAssignedDate(activeSession);
    }

    if (workingActiveDate < todayYmd) {
      const rollover = processDailyRollover({
        fromDate: workingActiveDate,
        toDate: todayYmd,
        entries: workingEntries,
        vaultEntries,
        carriedDates: workingCarriedDates,
        rolledOverDates: workingRolledOverDates,
        reconciledDates,
        studyDeficitCarryForwardMinutes: workingStudyDeficit,
        bankedCarryForwardMinutes: workingBankedCarry,
        activeSession: null,
        isDeskLoggedIn,
        deskLoginTimestamp: workingDeskLoginTs,
        isDeskTimerPaused,
        deskPausedAt: workingDeskPausedAt,
        deskAccumulatedPausedMs: workingDeskPausedMs,
        now,
      });

      workingEntries = rollover.nextEntries;
      workingStudyDeficit = rollover.nextStudyDeficitCarryForwardMinutes;
      workingBankedCarry = rollover.nextBankedCarryForwardMinutes;
      workingCarriedDates = rollover.nextCarriedDates;
      workingRolledOverDates = rollover.nextRolledOverDates;
      workingDeskLoginTs = rollover.nextDeskLoginTimestamp;
      workingDeskPausedAt = rollover.nextDeskPausedAt;
      workingDeskPausedMs = rollover.nextDeskAccumulatedPausedMs;
      workingActiveDate = rollover.nextActiveDate;

      setStudyDeficitCarryForwardMinutes(workingStudyDeficit);
      setBankedCarryForwardMinutes(workingBankedCarry);
      setCarriedDates(workingCarriedDates);
      setRolledOverDates(workingRolledOverDates);
      setLastRolloverDate(rollover.nextLastRolloverDate);
      setDeskLoginTimestamp(workingDeskLoginTs);
      setDeskPausedAt(workingDeskPausedAt);
      setDeskAccumulatedPausedMs(workingDeskPausedMs);
      setActiveDate(workingActiveDate);
      setSelectedDate(workingActiveDate);
    }

    if (workingEntries !== entries) {
      setEntries(workingEntries);
    }

    const sessionAssignedDate = workingActiveDate || todayYmd;
    setActiveSession({
      type,
      topic: topic || (type === 'study' ? 'General Study' : type === 'life' ? 'Life Activity' : 'Break'),
      startTime: now.toISOString(),
      assignedDate: sessionAssignedDate,
      notes: [],
      isPaused: false,
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    setActiveSeconds(0);
  };

  // Add a note to the active session strictly anchored to the session's original assignedDate
  const handleAddSessionNote = (noteText: string) => {
    setActiveSession((prev) => (prev ? addNoteToActiveSession(prev, noteText, new Date()) : prev));
  };

  // Pause / Resume Active Activity Session Timer
  const handlePauseSession = () => {
    setActiveSession((prev) => {
      if (!prev || prev.isPaused) return prev;
      return {
        ...prev,
        isPaused: true,
        pausedAt: new Date().toISOString(),
      };
    });
  };

  const handleResumeSession = () => {
    setActiveSession((prev) => {
      if (!prev || !prev.isPaused) return prev;
      const pausedDelta = prev.pausedAt ? Math.max(0, Date.now() - new Date(prev.pausedAt).getTime()) : 0;
      return {
        ...prev,
        isPaused: false,
        pausedAt: null,
        accumulatedPausedMs: (prev.accumulatedPausedMs || 0) + pausedDelta,
      };
    });
  };

  // Pause / Resume Active Desk Elapsed Timer
  const handleToggleDeskTimerPause = () => {
    if (!isDeskLoggedIn) return;
    if (isDeskTimerPaused) {
      const pausedDelta = deskPausedAt ? Math.max(0, Date.now() - new Date(deskPausedAt).getTime()) : 0;
      setDeskAccumulatedPausedMs((prev) => prev + pausedDelta);
      setIsDeskTimerPaused(false);
      setDeskPausedAt(null);
    } else {
      setIsDeskTimerPaused(true);
      setDeskPausedAt(new Date().toISOString());
    }
  };

  // Retroactively log non-study Life / Leisure activity ("I already watched TV for 1.5h")
  const handleLogLifeActivity = (options: { topic: string; durationMinutes: number }) => {
    const mins = Math.max(1, options.durationMinutes);
    const now = new Date();
    const writeDate = getEffectiveWriteDate(activeSession, selectedDate);
    const isCurrentCalendarWrite = writeDate === formatLocalYMD(now);

    const endD = isCurrentCalendarWrite || activeSession ? now : new Date(`${writeDate}T20:00:00`);
    const startD = new Date(endD.getTime() - mins * 60000);

    const newEntry: TimeEntry = {
      id: `local_life_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: 'local_desktop_user',
      type: 'life',
      action: 'stop',
      topic: options.topic,
      startTime: startD.toISOString(),
      endTime: endD.toISOString(),
      durationMinutes: mins,
      assignedDate: writeDate,
      source: 'shortcode',
      createdAt: now.toISOString(),
    };

    setEntries((prev) =>
      [...prev, newEntry].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );
  };

  // Stop Session: saves complete duration & notes against original assignedDate, then processes daily rollover if past midnight
  const handleStopSession = () => {
    if (!activeSession) return;
    const now = new Date();
    const todayYmd = formatLocalYMD(now);
    const sessionAssignedDate = getSessionAssignedDate(activeSession);
    const completedEntry = buildCompletedEntryFromSession(activeSession, now);

    const updatedEntries = [...entries, completedEntry].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    awardXpForSession(activeSession, completedEntry.durationMinutes || 0);
    setActiveSession(null);
    setActiveSeconds(0);

    const rolloverFromDate =
      sessionAssignedDate < todayYmd
        ? sessionAssignedDate
        : activeDate < todayYmd
        ? activeDate
        : null;

    if (rolloverFromDate) {
      const rollover = processDailyRollover({
        fromDate: rolloverFromDate,
        toDate: todayYmd,
        entries: updatedEntries,
        vaultEntries,
        carriedDates,
        rolledOverDates,
        reconciledDates,
        studyDeficitCarryForwardMinutes,
        bankedCarryForwardMinutes,
        activeSession: null,
        isDeskLoggedIn,
        deskLoginTimestamp,
        isDeskTimerPaused,
        deskPausedAt,
        deskAccumulatedPausedMs,
        now,
      });

      setEntries(rollover.nextEntries);
      setDeskLoginTimestamp(rollover.nextDeskLoginTimestamp);
      setDeskPausedAt(rollover.nextDeskPausedAt);
      setDeskAccumulatedPausedMs(rollover.nextDeskAccumulatedPausedMs);
      setStudyDeficitCarryForwardMinutes(rollover.nextStudyDeficitCarryForwardMinutes);
      setBankedCarryForwardMinutes(rollover.nextBankedCarryForwardMinutes);
      setCarriedDates(rollover.nextCarriedDates);
      setRolledOverDates(rollover.nextRolledOverDates);
      setLastRolloverDate(rollover.nextLastRolloverDate);
      setActiveDate(rollover.nextActiveDate);
      setSelectedDate(rollover.nextActiveDate);
    } else {
      setEntries(updatedEntries);
    }
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

  // Log Custom Sleep Window (Bedtime -> Wake up) strictly anchored to active writeDate
  const handleLogCustomSleep = (options: {
    startTimeIso: string;
    endTimeIso: string;
    durationMinutes: number;
    replaceExisting?: boolean;
  }) => {
    const writeDate = getEffectiveWriteDate(activeSession, selectedDate);
    const replaceId = options.replaceExisting && todaySleepEntry ? todaySleepEntry.id : null;
    if (replaceId) {
      addXp(-30);
    }

    const newEntry: TimeEntry = {
      id: `local_sleep_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId: 'local_desktop_user',
      type: 'sleep',
      action: 'stop',
      topic: 'Restorative Sleep',
      startTime: options.startTimeIso,
      endTime: options.endTimeIso,
      durationMinutes: options.durationMinutes,
      assignedDate: writeDate,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) =>
      [...(replaceId ? prev.filter((e) => e.id !== replaceId) : prev), newEntry].sort(
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
    const writeDate = getEffectiveWriteDate(activeSession, selectedDate);
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
      assignedDate: writeDate,
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

  // Generic Habit Toggle (respects active session's assignedDate)
  const handleToggleHabit = (
    habit: CustomHabit,
    options?: {
      startTimeIso?: string;
      endTimeIso?: string;
      durationMinutes?: number;
    }
  ) => {
    const writeDate = getEffectiveWriteDate(activeSession, selectedDate);
    const existing = entries.find(
      (e) =>
        (e.habitId === habit.id ||
          e.type === habit.entryType ||
          (e.topic && e.topic.toLowerCase().includes(habit.shortcode.toLowerCase()))) &&
        isEntryOnLocalDate(e, writeDate)
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
      assignedDate: writeDate,
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

  // Day Boundary (Login / Shady Logout Auto-Check + Active Desk Time Recording)
  const handleDayBoundary = (action: 'start' | 'stop') => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayYmd = formatLocalYMD(now);
    const writeDate = getEffectiveWriteDate(activeSession, selectedDate);

    const newEntry: TimeEntry = {
      id: `local_boundary_${Date.now()}`,
      userId: 'local_desktop_user',
      type: 'day_boundary',
      action,
      topic: action === 'start' ? 'Desk Login' : 'Desk Logout',
      startTime: nowIso,
      endTime: nowIso,
      durationMinutes: 0,
      assignedDate: writeDate,
      source: 'manual',
      createdAt: nowIso,
    };

    if (action === 'start') {
      setEntries((prev) => [...prev, newEntry]);
      setIsDeskLoggedIn(true);
      setDeskLoginTimestamp(nowIso);
      setIsDeskTimerPaused(false);
      setDeskPausedAt(null);
      setDeskAccumulatedPausedMs(0);
      if (!activeSession) {
        setActiveDate(todayYmd);
        setSelectedDate(todayYmd);
      }
      setMotivationModalState({
        isOpen: true,
        type: 'login',
        timestamp: nowIso,
      });
    } else {
      const additions: TimeEntry[] = [];

      // Synchronously finalize active session cleanly if running on logout
      if (activeSession) {
        const completedEntry = buildCompletedEntryFromSession(activeSession, now);
        additions.push(completedEntry);
        awardXpForSession(activeSession, completedEntry.durationMinutes || 0);
        setActiveSession(null);
        setActiveSeconds(0);
      }

      // Persist completed Active Desk Time entry so Desk Attendance stays tracked accurately
      if (isDeskLoggedIn && deskLoginTimestamp) {
        const loginDate = new Date(deskLoginTimestamp);
        const effectiveEndMs =
          isDeskTimerPaused && deskPausedAt ? new Date(deskPausedAt).getTime() : now.getTime();
        const elapsedMs = !isNaN(loginDate.getTime())
          ? Math.max(0, effectiveEndMs - loginDate.getTime() - deskAccumulatedPausedMs)
          : 0;
        const deskMins = Math.max(1, Math.round(elapsedMs / 60000));
        const deskAssignedDate =
          !isNaN(loginDate.getTime()) ? formatLocalYMD(loginDate) : writeDate;

        additions.push({
          id: `local_desk_${Date.now()}`,
          userId: 'local_desktop_user',
          type: 'desk',
          action: 'stop',
          topic: 'Active Desk Time',
          startTime: deskLoginTimestamp,
          endTime: nowIso,
          durationMinutes: deskMins,
          assignedDate: deskAssignedDate,
          source: 'manual',
          createdAt: nowIso,
        });
      }

      additions.push(newEntry);

      setEntries((prev) =>
        [...prev, ...additions].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      );

      setIsDeskLoggedIn(false);
      setIsDeskTimerPaused(false);
      setDeskPausedAt(null);
      setDeskAccumulatedPausedMs(0);
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
      setCarriedDates((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));
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

    setReconciledDates((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));
    setRolledOverDates((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));

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

    if (cmd === 'pause') {
      handlePauseSession();
    } else if (cmd === 'resume') {
      handleResumeSession();
    } else if (cmd.startsWith('s on ') || cmd.startsWith('study on ')) {
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
      const writeDate = getEffectiveWriteDate(activeSession, selectedDate);
      const [y, m, d] = writeDate.split('-').map(Number);
      const startDate = new Date(y, m - 1, d, 1, 0, 0, 0);
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

  const activeDeskTelemetry: ActiveDeskTelemetry = useMemo(
    () => ({
      isDeskLoggedIn,
      deskLoginTimestamp,
      isDeskTimerPaused,
      deskPausedAt,
      deskAccumulatedPausedMs,
    }),
    [isDeskLoggedIn, deskLoginTimestamp, isDeskTimerPaused, deskPausedAt, deskAccumulatedPausedMs]
  );

  // Intro + Version Update Changelog + Robot Teacher Tutorial Bundle Handlers
  const handleIntroComplete = () => {
    setForceShowIntro(false);
    if (pendingWhatsNewAfterIntroRef.current) {
      pendingWhatsNewAfterIntroRef.current = false;
      setIsWhatsNewOpen(true);
      return;
    }
    if (pendingTutorialAfterIntroRef.current) {
      pendingTutorialAfterIntroRef.current = false;
      setIsTutorialOpen(true);
    }
  };

  const handleCloseWhatsNew = () => {
    setIsWhatsNewOpen(false);
    try {
      localStorage.setItem(SEEN_VERSION_STORAGE_KEY, CURRENT_APP_VERSION);
    } catch {
      // ignore storage write failure
    }
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
      data-studio-font={effectiveStudioFont}
      className="min-h-screen studio-root-canvas text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-100 relative overflow-x-clip"
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
        autoShowOnMount={true}
        onComplete={handleIntroComplete}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* 3-Zone Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as typeof currentTab)}
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
            {/* Quick Step Navigation Strip + Interactive Studio Design & Personality Switcher */}
            <div className="sticky top-[56px] lg:top-[58px] z-30 py-2.5 px-4 bg-[#101014]/90 backdrop-blur-md border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xl shadow-black/50">
              <div className="flex items-center gap-3 min-w-0 flex-1 overflow-x-auto scrollbar-none">
                <span className="label-scandi text-emerald-400 shrink-0">
                  Desk Flow
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
                    <span className="font-medium">Progress</span>
                  </a>
                </div>
              </div>

              {/* Multi-Personality Studio Design, Background & Text Style Picker */}
              <StudioDesignPicker
                currentTheme={studioTheme}
                onSelectTheme={handleSelectStudioTheme}
                currentTextStyle={studioTextStyle}
                onSelectTextStyle={handleSelectStudioTextStyle}
              />
            </div>

            {/* Step 01: Desk Command Center & Active Elapsed Login Timer */}
            <section id="section-command" className="scroll-mt-28 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/25">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-sm font-mono font-bold text-emerald-400">01.</span>
                  <h2 className="font-display text-2xl sm:text-[1.7rem] font-bold tracking-tight text-white">
                    Desk Command &amp; Session Controls
                  </h2>
                </div>
                <span className="label-scandi text-emerald-400/80 hidden sm:inline">Elapsed Login Monitor</span>
              </div>
              <DeskQuickLogger
                activeSession={activeSession}
                activeSessionSeconds={activeSeconds}
                onPauseSession={handlePauseSession}
                onResumeSession={handleResumeSession}
                onStopSession={handleStopSession}
                onAddSessionNote={handleAddSessionNote}
                onDayBoundary={handleDayBoundary}
                isDeskLoggedIn={isDeskLoggedIn}
                deskLoginTimestamp={deskLoginTimestamp}
                deskElapsedSeconds={deskElapsedSeconds}
                isDeskTimerPaused={isDeskTimerPaused}
                onToggleDeskTimerPause={handleToggleDeskTimerPause}
                onOpenDeskProgress={() => setProgressModalActivity('desk')}
                lastLoggedEntry={lastLoggedEntry}
                onUndoEntry={handleDeleteEntry}
              />
            </section>

            {/* Step 02, 03, 04: The Core Quota Triad */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Step 02: 6-Hour Study Quota Card + S on + Quick Shortcode Bar */}
              <section id="section-focus" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-2 border-b border-emerald-500/25">
                  <span className="text-sm font-mono font-bold text-emerald-400">02.</span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-emerald-50">
                    Focus Quota (6h Target)
                  </h2>
                </div>
                <StudyQuotaCard
                  completedStudyMinutesToday={studyMinutesToday}
                  isStudyActive={activeSession?.type === 'study'}
                  isSessionPaused={!!activeSession?.isPaused}
                  activeStudyDurationSeconds={activeSession?.type === 'study' ? activeSeconds : 0}
                  studyDeficitCarryForwardMinutes={studyDeficitCarryForwardMinutes}
                  currentStreak={profile.currentStreak || 1}
                  level={profile.level || 1}
                  onStartStudy={(topic) => handleStartSession('study', topic)}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onStopSession={handleStopSession}
                  onShortcodeSubmit={handleShortcodeCommand}
                  onOpenProgress={() => setProgressModalActivity('study')}
                />
              </section>

              {/* Step 03: 2-Hour Decrementing Break Bank Card + Break (bon) Button */}
              <section id="section-break" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-2 border-b border-amber-500/25">
                  <span className="text-sm font-mono font-bold text-amber-400">03.</span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-amber-50">
                    Break Bank &amp; Alerts
                  </h2>
                </div>
                <BreakBankCard
                  usedBreakMinutesToday={breakMinutesToday}
                  isBreakActive={activeSession?.type === 'break'}
                  isSessionPaused={!!activeSession?.isPaused}
                  activeBreakDurationSeconds={activeSession?.type === 'break' ? activeSeconds : 0}
                  bankedCarryForwardMinutes={bankedCarryForwardMinutes}
                  onStartBreak={() => handleStartSession('break', 'Break')}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onStopBreak={handleStopSession}
                  onOpenProgress={() => setProgressModalActivity('break')}
                />
              </section>

              {/* Step 04: 8-Hour Restorative Sleep Tracker Card */}
              <section id="section-sleep" className="scroll-mt-28 space-y-3">
                <div className="flex items-baseline gap-2 pb-2 border-b border-indigo-500/25">
                  <span className="text-sm font-mono font-bold text-indigo-400">04.</span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-indigo-50">
                    Restorative Sleep
                  </h2>
                </div>
                <SleepTrackerCard
                  sleepMinutesToday={sleepMinutesToday}
                  isSleepActive={activeSession?.type === 'sleep'}
                  isSessionPaused={!!activeSession?.isPaused}
                  activeSleepDurationSeconds={activeSession?.type === 'sleep' ? activeSeconds : 0}
                  todaySleepEntry={todaySleepEntry}
                  onStartSleep={() => handleStartSession('sleep', 'Restorative Sleep')}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onStopSleep={handleStopSession}
                  onLogCustomSleep={handleLogCustomSleep}
                  onUndoSleep={handleDeleteEntry}
                  onOpenProgress={() => setProgressModalActivity('sleep')}
                  selectedDate={selectedDate}
                />
              </section>
            </div>

            {/* Step 05: Practice & Habits Hub (Riyaz, Gym, Reading, Custom Routines) */}
            <section id="section-habits" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/25">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-sm font-mono font-bold text-purple-400">05.</span>
                  <h2 className="font-display text-2xl sm:text-[1.7rem] font-bold tracking-tight text-purple-50">
                    Practice &amp; Habits Hub
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
                    onOpenProgress={(h) => setProgressModalActivity(`habit:${h.id}`)}
                    selectedDate={selectedDate}
                  />
                ))}
              </div>
            </section>

            {/* Step 06: Simple Activity Progress Studio (Hours, Weeks, Months, Years) */}
            <section id="section-timeline" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/25">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-sm font-mono font-bold text-cyan-400">06.</span>
                  <h2 className="font-display text-2xl sm:text-[1.7rem] font-bold tracking-tight text-cyan-50">
                    Activity Progress &amp; Hourly Flow
                  </h2>
                </div>
                <span className="label-scandi text-cyan-400/80 hidden sm:inline">
                  Hours · Weeks · Months · Years
                </span>
              </div>
              <ActivityProgressStudio
                entries={entries}
                habits={habits}
                selectedDate={selectedDate}
                activeActivityFilter={progressActivityFilter}
                onChangeActivityFilter={setProgressActivityFilter}
                template={progressTemplate}
                onChangeTemplate={handleChangeProgressTemplate}
                onDeleteEntry={handleDeleteEntry}
                activeDesk={activeDeskTelemetry}
                vaultEntries={vaultEntries}
                achievementsCount={achievements.length}
                profile={profile}
              />
            </section>

            {/* Step 07: Study Science & Insights */}
            <section id="section-insights" className="scroll-mt-28 space-y-3 pt-2">
              <div className="flex items-baseline gap-2.5 pb-2.5 border-b border-emerald-500/25">
                <span className="text-sm font-mono font-bold text-emerald-400">07.</span>
                <h2 className="font-display text-2xl sm:text-[1.7rem] font-bold tracking-tight text-emerald-50">
                  Accountability &amp; Focus Principles
                </h2>
              </div>
              <InsightsTips entries={entries} />
            </section>
          </div>
        )}

        {/* Tab 2: Simple Activity Progress & Graphs */}
        {currentTab === 'timeline' && (
          <ActivityProgressStudio
            entries={entries}
            habits={habits}
            selectedDate={selectedDate}
            activeActivityFilter={progressActivityFilter}
            onChangeActivityFilter={setProgressActivityFilter}
            template={progressTemplate}
            onChangeTemplate={handleChangeProgressTemplate}
            onDeleteEntry={handleDeleteEntry}
            activeDesk={activeDeskTelemetry}
            vaultEntries={vaultEntries}
            achievementsCount={achievements.length}
            profile={profile}
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

        {/* Tab 4: Vault of Lost Time */}
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
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
        selectedDate={selectedDate}
      />

      {/* First-Open After Software Update Changelog */}
      <WhatsNewModal isOpen={isWhatsNewOpen} onClose={handleCloseWhatsNew} />

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

      {/* Left-Edge Hover / Mobile Swipe-Left Quick Life Activity Shortcode Drawer */}
      <LifeShortcodeDrawer
        activeSession={activeSession}
        todayEntries={entries}
        selectedDate={selectedDate}
        onStartLifeTimer={(topic) => handleStartSession('life', topic)}
        onPauseSession={handlePauseSession}
        onResumeSession={handleResumeSession}
        onStopSession={handleStopSession}
        onLogPastLifeActivity={handleLogLifeActivity}
        onUndoEntry={handleDeleteEntry}
      />

      {/* Per-Activity Interactive Progress Modal (Triggered from Homepage Cards) */}
      <ActivityProgressModal
        activityFilter={progressModalActivity}
        onClose={() => setProgressModalActivity(null)}
        entries={entries}
        habits={habits}
        selectedDate={selectedDate}
        template={progressTemplate}
        onChangeTemplate={handleChangeProgressTemplate}
        onOpenFullSection={handleOpenFullProgressSection}
        activeDesk={activeDeskTelemetry}
      />
    </div>
  );
}
