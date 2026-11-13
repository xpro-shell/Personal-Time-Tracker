import { Award, Check, Clock, Edit3, Eye, EyeOff, Flame, Plus, Radio, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { AchievementItem, TickerSettings } from '../types/tracker';

interface AchievementsTabProps {
  achievements: AchievementItem[];
  onAddAchievement: (item: Omit<AchievementItem, 'id' | 'createdAt'>) => void;
  onUpdateAchievement: (id: string, updates: Partial<AchievementItem>) => void;
  onDeleteAchievement: (id: string) => void;
  tickerSettings: TickerSettings;
  onUpdateTickerSettings: (settings: TickerSettings) => void;
}

const EMOJI_PALETTE = ['🔥', '🏆', '⚡', '🚀', '🎯', '💪', '🎸', '📚', '👑', '✨'];

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  achievements,
  onAddAchievement,
  onUpdateAchievement,
  onDeleteAchievement,
  tickerSettings,
  onUpdateTickerSettings,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [categoryInput, setCategoryInput] = useState('');
  const [showInTicker, setShowInTicker] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEmoji, setEditEmoji] = useState('🔥');
  const [editCategory, setEditCategory] = useState('');

  const [customMinutesInput, setCustomMinutesInput] = useState<string>(() =>
    String(Math.round((tickerSettings.intervalSeconds / 60) * 10) / 10)
  );

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    playEarnedChime();
    onAddAchievement({
      title: titleInput.trim(),
      emoji: selectedEmoji,
      category: categoryInput.trim() || undefined,
      showInTicker,
    });

    setTitleInput('');
    setCategoryInput('');
    setShowInTicker(true);
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
  };

  const handlePresetInterval = (seconds: number) => {
    playDeskClick();
    setCustomMinutesInput(String(Math.round((seconds / 60) * 10) / 10));
    onUpdateTickerSettings({
      ...tickerSettings,
      intervalSeconds: seconds,
    });
  };

  const handleApplyCustomMinutes = () => {
    const mins = parseFloat(customMinutesInput);
    if (isNaN(mins) || mins <= 0) return;
    playDeskClick();
    const secs = Math.max(5, Math.round(mins * 60));
    onUpdateTickerSettings({
      ...tickerSettings,
      intervalSeconds: secs,
    });
  };

  const pinnedCount = achievements.filter((a) => a.showInTicker).length;

  return (
    <div className="space-y-6">
      {/* Header & Ticker Broadcast Frequency Controls */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-amber-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                Achievements & Motivation Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Write your personal wins and milestones. Active items flash across the homepage news ticker bar.
              </p>
            </div>
          </div>
        </div>

        {/* Ticker Settings Panel */}
        <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <Radio className={`w-3.5 h-3.5 ${tickerSettings.enabled ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>Homepage News Ticker</span>
            </div>
            <button
              type="button"
              onClick={() => {
                playDeskClick();
                onUpdateTickerSettings({ ...tickerSettings, enabled: !tickerSettings.enabled });
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                tickerSettings.enabled
                  ? 'bg-amber-400 text-zinc-950 border-amber-300'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              {tickerSettings.enabled ? 'Active' : 'Muted'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-zinc-500 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Flash every:
            </span>
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
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  tickerSettings.intervalSeconds === preset.secs
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {/* Custom interval in minutes */}
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="120"
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-[11px] bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
                title="Custom minutes"
              />
              <button
                type="button"
                onClick={handleApplyCustomMinutes}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 cursor-pointer"
              >
                Set m
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Write New Achievement Card */}
      <form
        onSubmit={handleSubmitNew}
        className="p-5 sm:p-6 rounded-2xl bg-[#161519] border border-zinc-800/80 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-400">
            Write a New Achievement or Motivation Line
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            {pinnedCount} pinned to live news bar
          </span>
        </div>

        {/* Emoji Picker Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 mr-1">Badge Emoji:</span>
          {EMOJI_PALETTE.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                playDeskClick();
                setSelectedEmoji(emoji);
              }}
              className={`w-9 h-9 rounded-lg border text-base flex items-center justify-center transition-all cursor-pointer ${
                selectedEmoji === emoji
                  ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-md'
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
              className="w-full px-3.5 py-2.5 text-sm font-sans bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              maxLength={40}
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Tag (e.g. Deep Work, Riyaz)"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Win</span>
            </button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInTicker}
            onChange={(e) => setShowInTicker(e.target.checked)}
            className="accent-amber-400 w-3.5 h-3.5 rounded"
          />
          <span>Broadcast on homepage breaking-news ticker line</span>
        </label>
      </form>

      {/* Achievements Wall */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Your Achievement Ledger ({achievements.length})
          </h3>
        </div>

        {achievements.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#121215] border border-dashed border-zinc-800 text-center space-y-2">
            <Flame className="w-8 h-8 text-amber-400/60 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">
              No achievements written yet.
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Add your breakthroughs, completed sprints, or personal motivational reminders above. They will flash across the top news ticker bar every {Math.round((tickerSettings.intervalSeconds / 60) * 10) / 10} minutes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    item.showInTicker
                      ? 'bg-[#171512] border-amber-500/35 shadow-md shadow-black/40'
                      : 'bg-[#131316] border-zinc-800/80 opacity-80'
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
                              editEmoji === em ? 'bg-amber-500/30 border-amber-400' : 'bg-zinc-900 border-zinc-800'
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
                        className="w-full px-3 py-1.5 text-sm bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Optional tag"
                        className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-md flex items-center gap-1 cursor-pointer"
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
                            <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-1">
                              {item.category && (
                                <>
                                  <span className="text-amber-400">{item.category}</span>
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
                            onUpdateAchievement(item.id, { showInTicker: !item.showInTicker });
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors cursor-pointer ${
                            item.showInTicker
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
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
