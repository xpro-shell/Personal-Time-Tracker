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

const LocalProfileContext = createContext<LocalProfileContextType>({
  profile: createDefaultProfile(),
  loading: false,
  updateDisplayName: () => {},
  addXp: () => {},
  updateStreak: () => {},
});

export const useLocalProfile = () => useContext(LocalProfileContext);

export const LocalProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() =>
    readLocalSync<UserProfile>(STORAGE_KEYS.PROFILE, createDefaultProfile())
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    readLocalAsync<UserProfile>(STORAGE_KEYS.PROFILE, createDefaultProfile()).then((loaded) => {
      if (active) {
        setProfile(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persistProfile = (updated: UserProfile) => {
    setProfile(updated);
    writeLocalData(STORAGE_KEYS.PROFILE, updated);
  };

  const updateDisplayName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    persistProfile({
      ...profile,
      displayName: trimmed,
      updatedAt: new Date().toISOString(),
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
      writeLocalData(STORAGE_KEYS.PROFILE, updated);
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
      writeLocalData(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  };

  return (
    <LocalProfileContext.Provider value={{ profile, loading, updateDisplayName, addXp, updateStreak }}>
      {children}
    </LocalProfileContext.Provider>
  );
};
