import confetti from 'canvas-confetti';
import {
  Award,
  Check,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  Plus,
  Radio,
  Sparkles,
  TimerOff,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { AchievementItem, TickerSettings } from '../types/tracker';

interface AchievementsTabProps {
  achievements: AchievementItem[];
  onAddAchievement: (item: Omit<AchievementItem, 'id' | 'createdAt'>) => void;
  onUpdateAchievement: (id: string, updates: Partial<AchievementItem>) => void;
  onDeleteAchievement: (id: string) => void;
  tickerSettings: TickerSettings;
  onUpdateTickerSettings: (settings: TickerSettings) => void;
  onFlashTickerNow?: () => void;
}

const EMOJI_PALETTE = ['🔥', '🏆', '⚡', '🚀', '🎯', '💪', '🎸', '📚', '👑', '✨'];

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  achievements,
  onAddAchievement,
  onUpdateAchievement,
  onDeleteAchievement,
  tickerSettings,
  onUpdateTickerSettings,
  onFlashTickerNow,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [categoryInput, setCategoryInput] = useState('');
  const [showInTicker, setShowInTicker] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEmoji, setEditEmoji] = useState('🔥');
  const [editCategory, setEditCategory] = useState('');

  const effectiveInterval = Math.max(5, tickerSettings.intervalSeconds || 120);
  const effectiveFade =
    typeof tickerSettings.fadeAfterSeconds === 'number'
      ? Math.max(0, tickerSettings.fadeAfterSeconds)
      : 20;
  const effectiveSpeed = tickerSettings.scrollSpeed || 'normal';

  const [intervalUnit, setIntervalUnit] = useState<'s' | 'm'>(() =>
    effectiveInterval >= 60 && effectiveInterval % 60 === 0 ? 'm' : 's'
  );
  const [customIntervalVal, setCustomIntervalVal] = useState<string>(() =>
    effectiveInterval >= 60 && effectiveInterval % 60 === 0
      ? String(effectiveInterval / 60)
      : String(effectiveInterval)
  );

  const [fadeUnit, setFadeUnit] = useState<'s' | 'm'>(() =>
    effectiveFade >= 60 && effectiveFade % 60 === 0 ? 'm' : 's'
  );
  const [customFadeVal, setCustomFadeVal] = useState<string>(() =>
    effectiveFade >= 60 && effectiveFade % 60 === 0
      ? String(effectiveFade / 60)
      : String(effectiveFade)
  );

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Sync custom input fields when settings hydrate from IndexedDB or presets are clicked
  useEffect(() => {
    if (effectiveInterval >= 60 && effectiveInterval % 60 === 0) {
      setIntervalUnit('m');
      setCustomIntervalVal(String(effectiveInterval / 60));
    } else {
      setIntervalUnit('s');
      setCustomIntervalVal(String(effectiveInterval));
    }
  }, [effectiveInterval]);

  useEffect(() => {
    if (effectiveFade === 0) {
      setFadeUnit('s');
      setCustomFadeVal('0');
    } else if (effectiveFade >= 60 && effectiveFade % 60 === 0) {
      setFadeUnit('m');
      setCustomFadeVal(String(effectiveFade / 60));
    } else {
      setFadeUnit('s');
      setCustomFadeVal(String(effectiveFade));
    }
  }, [effectiveFade]);

  const showNotice = (msg: string) => {
    setSavedFeedback(msg);
    window.setTimeout(() => {
      setSavedFeedback((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    playEarnedChime();
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.72 },
        colors: ['#34d399', '#fbbf24', '#22d3ee', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore if canvas fails
    }

    onAddAchievement({
      title: titleInput.trim(),
      emoji: selectedEmoji,
      category: categoryInput.trim() || undefined,
      showInTicker,
    });

    setTitleInput('');
    setCategoryInput('');
    setShowInTicker(true);
    if (showInTicker) {
      showNotice('Added & flashing live!');
    }
  };

  const handleStartEdit = (item: AchievementItem) => {
    playDeskClick();
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditEmoji(item.emoji);
    setEditCategory(item.category || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    playDeskClick();
    onUpdateAchievement(id, {
      title: editTitle.trim(),
      emoji: editEmoji,
      category: editCategory.trim() || undefined,
    });
    setEditingId(null);
    onFlashTickerNow?.();
  };

  const handlePresetInterval = (seconds: number) => {
    playDeskClick();
    onUpdateTickerSettings({
      ...tickerSettings,
      intervalSeconds: seconds,
    });
    showNotice(`Repeats every ${seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}`);
  };

  const handleApplyCustomInterval = () => {
    const val = parseFloat(customIntervalVal);
    if (isNaN(val) || val <= 0) return;
    playDeskClick();
    const secs = Math.max(5, Math.round(intervalUnit === 'm' ? val * 60 : val));
    onUpdateTickerSettings({
      ...tickerSettings,
      intervalSeconds: secs,
    });
    onFlashTickerNow?.();
    showNotice(`Repeats every ${secs < 60 ? `${secs}s` : `${Math.round((secs / 60) * 10) / 10}m`}`);
  };

  const handlePresetFade = (seconds: number) => {
    playDeskClick();
    onUpdateTickerSettings({
      ...tickerSettings,
      fadeAfterSeconds: seconds,
    });
    onFlashTickerNow?.();
    showNotice(seconds === 0 ? 'Set to Always On' : `Fades after ${seconds}s`);
  };

  const handleApplyCustomFade = () => {
    const val = parseFloat(customFadeVal);
    if (isNaN(val) || val < 0) return;
    playDeskClick();
    const secs = val === 0 ? 0 : Math.max(3, Math.round(fadeUnit === 'm' ? val * 60 : val));
    onUpdateTickerSettings({
      ...tickerSettings,
      fadeAfterSeconds: secs,
    });
    onFlashTickerNow?.();
    showNotice(secs === 0 ? 'Set to Always On' : `Fades after ${secs}s`);
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    playDeskClick();
    onUpdateTickerSettings({
      ...tickerSettings,
      scrollSpeed: speed,
    });
    showNotice(`News speed: ${speed}`);
  };

  const pinnedCount = achievements.filter((a) => a.showInTicker).length;

  return (
    <div className="space-y-6">
      {/* Header & News-Channel Broadcast Controls */}
      <div className="studio-card p-6 rounded-2xl bg-gradient-to-br from-[#0e1b16] via-[#121216] to-[#17131a] border border-emerald-500/25 shadow-xl shadow-black/40 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_-4px_rgba(52,211,153,0.4)] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white">
                Achievements & Live News Studio
              </h2>
              <p className="text-xs font-sans text-zinc-400 mt-0.5">
                Write wins & motivation lines. They glide across the top news ticker continuously and auto-fade after your custom timer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {savedFeedback && (
              <span className="px-2.5 py-1 text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/40 rounded-lg">
                ✓ {savedFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                if (!tickerSettings.enabled) {
                  onUpdateTickerSettings({ ...tickerSettings, enabled: true });
                }
                onFlashTickerNow?.();
                showNotice('Flashed on top bar!');
              }}
              className="interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 rounded-lg transition-all cursor-pointer shadow-[0_0_16px_-4px_rgba(52,211,153,0.55)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flash Live Now</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onUpdateTickerSettings({ ...tickerSettings, enabled: !tickerSettings.enabled });
              }}
              className={`interactive-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                tickerSettings.enabled
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/45'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{tickerSettings.enabled ? 'Ticker Active' : 'Ticker Muted'}</span>
            </button>
          </div>
        </div>

        {/* 3-Column News Broadcast Timing & Speed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-800/70">
          {/* 1. Repeat / Flash Frequency */}
          <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="label-scandi text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Show Every
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {effectiveInterval < 60
                  ? `${effectiveInterval}s`
                  : `${Math.round((effectiveInterval / 60) * 10) / 10}m`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              {[
                { label: '30s', secs: 30 },
                { label: '1m', secs: 60 },
                { label: '2m', secs: 120 },
                { label: '5m', secs: 300 },
                { label: '10m', secs: 600 },
              ].map((preset) => (
                <button
                  key={preset.secs}
                  type="button"
                  onClick={() => handlePresetInterval(preset.secs)}
                  className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                    effectiveInterval === preset.secs
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <input
                type="number"
                step="1"
                min="1"
                max="1440"
                value={customIntervalVal}
                onChange={(e) => setCustomIntervalVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyCustomInterval();
                }}
                className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-400"
                title="Custom show interval"
              />
              <select
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value as 's' | 'm')}
                className="px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="s">sec</option>
                <option value="m">min</option>
              </select>
              <button
                type="button"
                onClick={handleApplyCustomInterval}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-200 text-zinc-200 rounded border border-zinc-700 cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* 2. Auto-Fade Out Timer */}
          <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="label-scandi text-amber-400 flex items-center gap-1.5">
                <TimerOff className="w-3.5 h-3.5" /> Fade After
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {effectiveFade === 0
                  ? 'Always On'
                  : effectiveFade < 60
                    ? `${effectiveFade}s`
                    : `${Math.round((effectiveFade / 60) * 10) / 10}m`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              {[
                { label: '10s', secs: 10 },
                { label: '15s', secs: 15 },
                { label: '25s', secs: 25 },
                { label: '45s', secs: 45 },
                { label: '60s', secs: 60 },
                { label: 'Always', secs: 0 },
              ].map((preset) => (
                <button
                  key={preset.secs}
                  type="button"
                  onClick={() => handlePresetFade(preset.secs)}
                  className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                    effectiveFade === preset.secs
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <input
                type="number"
                step="1"
                min="0"
                max="3600"
                value={customFadeVal}
                onChange={(e) => setCustomFadeVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyCustomFade();
                }}
                className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
                title="Custom fade out duration (0 = Always On)"
              />
              <select
                value={fadeUnit}
                onChange={(e) => setFadeUnit(e.target.value as 's' | 'm')}
                className="px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="s">sec</option>
                <option value="m">min</option>
              </select>
              <button
                type="button"
                onClick={handleApplyCustomFade}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-200 text-zinc-200 rounded border border-zinc-700 cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* 3. News Marquee Crawl Speed */}
          <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-zinc-800/90 space-y-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="label-scandi text-cyan-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> News Crawl Speed
              </span>
              <span className="text-[11px] font-mono text-zinc-400 capitalize">
                {effectiveSpeed}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`py-1.5 rounded-md border capitalize transition-colors cursor-pointer ${
                    effectiveSpeed === speed
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-sans text-zinc-500 leading-snug">
              Glides continuously from right to left like live TV breaking news. Hover on the bar anytime to pause & read.
            </p>
          </div>
        </div>
      </div>

      {/* Write New Achievement Card */}
      <form
        onSubmit={handleSubmitNew}
        className="studio-card p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#121318] via-[#121215] to-[#101614] border border-zinc-800/80 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="label-scandi text-emerald-400">
            Write a New Achievement or Motivation Line
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            {pinnedCount} live in moving news bar
          </span>
        </div>

        {/* Emoji Picker Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-scandi text-zinc-500 mr-1">Badge Emoji:</span>
          {EMOJI_PALETTE.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                playDeskClick();
                setSelectedEmoji(emoji);
              }}
              className={`interactive-press w-9 h-9 rounded-lg border text-base flex items-center justify-center transition-all cursor-pointer ${
                selectedEmoji === emoji
                  ? 'bg-emerald-500/20 border-emerald-400 scale-110 shadow-[0_0_12px_-2px_rgba(52,211,153,0.45)]'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Headline + Tag + Submit */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <input
              type="text"
              required
              maxLength={140}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. Completed 14 days 6h focus streak without missing a single session!"
              className="w-full px-3.5 py-2.5 text-sm font-sans bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              maxLength={40}
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Tag (e.g. Deep Work, Riyaz)"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="interactive-press w-full h-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 rounded-xl transition-all cursor-pointer shadow-[0_0_18px_-4px_rgba(52,211,153,0.5)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Win</span>
            </button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-sans text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInTicker}
            onChange={(e) => setShowInTicker(e.target.checked)}
            className="accent-emerald-400 w-3.5 h-3.5 rounded"
          />
          <span>Broadcast on moving homepage breaking-news ticker line</span>
        </label>
      </form>

      {/* Achievements Wall */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="label-scandi text-zinc-400">
            Your Achievement Ledger ({achievements.length})
          </h3>
        </div>

        {achievements.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#121215] border border-dashed border-zinc-800 text-center space-y-2">
            <Flame className="w-8 h-8 text-emerald-400/70 mx-auto" />
            <p className="font-display text-lg font-medium text-zinc-200">
              No achievements written yet.
            </p>
            <p className="text-xs font-sans text-zinc-500 max-w-md mx-auto">
              Add your breakthroughs, completed sprints, or motivational lines above. They will glide across the top news ticker bar every{' '}
              {effectiveInterval < 60
                ? `${effectiveInterval} seconds`
                : `${Math.round((effectiveInterval / 60) * 10) / 10} minutes`}{' '}
              {effectiveFade > 0 ? `and fade out cleanly after ${effectiveFade}s.` : 'continuously.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`studio-card p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    item.showInTicker
                      ? 'bg-gradient-to-br from-[#0f1c17] via-[#121216] to-[#111216] border-emerald-500/35 shadow-md shadow-black/40'
                      : 'bg-[#111114] border-zinc-800/80 opacity-80'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_PALETTE.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setEditEmoji(em)}
                            className={`w-7 h-7 rounded border text-sm flex items-center justify-center cursor-pointer ${
                              editEmoji === em ? 'bg-emerald-500/20 border-emerald-400' : 'bg-zinc-900 border-zinc-800'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Optional tag"
                        className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl leading-none shrink-0 mt-0.5">{item.emoji}</span>
                          <div>
                            <h4 className="font-display text-base font-semibold text-zinc-100 leading-snug">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-1">
                              {item.category && (
                                <>
                                  <span className="text-emerald-400">{item.category}</span>
                                  <span aria-hidden="true">·</span>
                                </>
                              )}
                              <span>
                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/70">
                        <button
                          type="button"
                          onClick={() => {
                            playDeskClick();
                            const nextShow = !item.showInTicker;
                            onUpdateAchievement(item.id, { showInTicker: nextShow });
                            if (nextShow) onFlashTickerNow?.();
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors cursor-pointer ${
                            item.showInTicker
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {item.showInTicker ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{item.showInTicker ? 'On News Ticker' : 'Hidden from Ticker'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit achievement"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playDeskClick();
                              onDeleteAchievement(item.id);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Remove achievement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
