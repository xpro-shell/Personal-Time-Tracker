import { Check, Clock, Edit2, HardDrive, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useLocalProfile } from '../context/LocalProfileContext';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  reviewCount?: number;
  vaultCount?: number;
  achievementsCount?: number;
  onOpenResetInfo?: () => void;
  onReplayIntro?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  reviewCount = 0,
  vaultCount = 0,
  achievementsCount = 0,
  onOpenResetInfo,
  onReplayIntro,
}) => {
  const { profile, updateDisplayName } = useLocalProfile();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName || 'Focus Pilot');

  const navLinks = [
    { id: 'desk', label: 'Desk Tracker' },
    { id: 'timeline', label: 'Timeline & Heatmap' },
    { id: 'achievements', label: `Achievements${achievementsCount > 0 ? ` (${achievementsCount})` : ''}` },
    { id: 'importer', label: 'WhatsApp Importer' },
    { id: 'vault', label: `Vault of Lost Time${vaultCount > 0 ? ` (${vaultCount})` : ''}` },
    { id: 'review', label: `Review Queue${reviewCount > 0 ? ` (${reviewCount})` : ''}` },
  ];

  const handleSaveName = () => {
    if (draftName.trim()) {
      updateDisplayName(draftName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="flex items-center justify-between gap-3 lg:gap-6 px-4 sm:px-6 py-3">
        {/* Zone 1: Editorial Luxury Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-2 h-2 bg-emerald-400 rounded-xs" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              onSelectTab('desk');
              onReplayIntro?.();
            }}
            className="font-display text-base sm:text-lg font-semibold tracking-tight text-zinc-100 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
            title="Personal Time Tracker · Click to replay intro"
          >
            Personal Time Tracker
          </button>
        </div>

        {/* Zone 2: Desktop Scandinavian Minimal Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[11px] font-sans uppercase tracking-[0.12em] font-medium text-zinc-400">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelectTab(link.id)}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b cursor-pointer ${
                currentTab === link.id
                  ? 'text-white border-emerald-400 font-semibold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Offline Local Pilot Profile + Reset + Install */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenResetInfo && (
            <button
              type="button"
              onClick={onOpenResetInfo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-[#121215] border border-zinc-800 hover:border-emerald-500/50 rounded-lg transition-colors cursor-pointer"
              title="When does tracker reset? Midnight 00:00 & Day Logout info"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Reset:</span>
              <span className="text-emerald-400 font-semibold">00:00</span>
            </button>
          )}

          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-[#121215] border border-zinc-800 hover:border-emerald-500/50 rounded-lg transition-colors cursor-pointer"
              title="Play intro animation & guided tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}

          <PWAInstallButton />

          {/* Local Offline Profile Summary */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800/80 text-xs font-mono tabular-nums text-zinc-400">
            <span title="Offline Local Vault" className="hidden sm:inline-flex items-center shrink-0">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  maxLength={24}
                  className="w-24 px-1.5 py-0.5 text-xs bg-zinc-950 border border-emerald-400 rounded text-zinc-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  title="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftName(profile.displayName);
                  setIsEditingName(true);
                }}
                className="hidden sm:flex items-center gap-1 text-zinc-200 hover:text-emerald-300 font-medium cursor-pointer"
                title="Click to rename local profile"
              >
                <span>{profile.displayName}</span>
                <Edit2 className="w-3 h-3 text-zinc-500" />
              </button>
            )}
            <span aria-hidden="true" className="hidden sm:inline text-zinc-700">·</span>
            <span className="text-emerald-400 font-semibold">Lv {profile.level}</span>
            <span aria-hidden="true" className="hidden md:inline text-zinc-700">·</span>
            <span className="hidden md:inline text-zinc-300">{profile.totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Compact Mobile & Tablet Tab Strip */}
      <nav className="flex lg:hidden items-center gap-4 px-4 py-2 border-t border-zinc-800/60 overflow-x-auto scrollbar-none text-[10px] font-sans uppercase tracking-[0.12em] font-medium text-zinc-400">
        {navLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onSelectTab(link.id)}
            className={`whitespace-nowrap shrink-0 py-0.5 border-b transition-colors cursor-pointer ${
              currentTab === link.id
                ? 'text-white border-emerald-400 font-semibold'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
