import React, { createContext, useContext, useEffect, useState } from 'react';
import { readLocalAsync, readLocalSync, STORAGE_KEYS, writeLocalData } from '../lib/localDb';
import { UserProfile } from '../types/tracker';

interface LocalProfileContextType {
  profile: UserProfile;
  loading: boolean;
  updateDisplayName: (newName: string) => void;
  addXp: (amount: number) => void;
  updateStreak: (newStreak: number) => void;
}

const createDefaultProfile = (): UserProfile => {
  const nowIso = new Date().toISOString();
  return {
    email: 'local@desktop.app',
    displayName: 'Focus Pilot',
    totalXp: 0,
    level: 1,
    currentStreak: 1,
    lastActiveDate: nowIso.slice(0, 10),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

function parseIsoMs(iso?: string): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

const LocalProfileContext = createContext<LocalProfileContextType>({
  profile: createDefaultProfile(),
  loading: false,
  updateDisplayName: () => {},
  addXp: () => {},
  updateStreak: () => {},
});

export const useLocalProfile = () => useContext(LocalProfileContext);

export const LocalProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...createDefaultProfile(),
    ...readLocalSync<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, {}),
  }));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const hydrateProfile = (forceOverwrite = false) => {
      readLocalAsync<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, createDefaultProfile()).then(
        (loaded) => {
          if (!active) return;
          const normalized: UserProfile = {
            ...createDefaultProfile(),
            ...loaded,
          };
          setProfile((prev) => {
            if (forceOverwrite) return normalized;
            const prevUpdated = parseIsoMs(prev.updatedAt);
            const loadedUpdated = parseIsoMs(normalized.updatedAt);
            // Keep whichever version is newer, or prefer the one with recorded XP if same/fresh mount
            if (prevUpdated > loadedUpdated && prev.totalXp > 0) {
              return prev;
            }
            if (loaded.totalXp === undefined && prev.totalXp > 0) {
              return prev;
            }
            return normalized;
          });
          setLoading(false);
        }
      );
    };

    hydrateProfile(false);

    const handleImported = () => hydrateProfile(true);
    window.addEventListener('ptt-data-imported', handleImported);
    return () => {
      active = false;
      window.removeEventListener('ptt-data-imported', handleImported);
    };
  }, []);

  const updateDisplayName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProfile((prev) => {
      const updated: UserProfile = {
        ...prev,
        displayName: trimmed,
        updatedAt: new Date().toISOString(),
      };
      void writeLocalData(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  };

  const addXp = (amount: number) => {
    setProfile((prev) => {
      const newXp = Math.max(0, (prev.totalXp || 0) + amount);
      const newLevel = Math.max(1, Math.floor(newXp / 300) + 1);
      const updated: UserProfile = {
        ...prev,
        totalXp: newXp,
        level: newLevel,
        updatedAt: new Date().toISOString(),
      };
      void writeLocalData(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  };

  const updateStreak = (newStreak: number) => {
    setProfile((prev) => {
      const updated: UserProfile = {
        ...prev,
        currentStreak: Math.max(0, newStreak),
        lastActiveDate: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };
      void writeLocalData(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  };

  return (
    <LocalProfileContext.Provider value={{ profile, loading, updateDisplayName, addXp, updateStreak }}>
      {children}
    </LocalProfileContext.Provider>
  );
};
