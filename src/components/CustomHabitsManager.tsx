import {
  Book,
  Code,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Music,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import { CustomHabit, EntryType } from '../types/tracker';

export const DEFAULT_HABITS: CustomHabit[] = [
  {
    id: 'music',
    name: 'Riyaz (Music Practice)',
    shortcode: 'riyaz',
    defaultDurationHours: 3,
    dailyTargetMinutes: 180,
    colorTheme: 'purple',
    iconType: 'music',
    entryType: 'music',
    isDefault: true,
  },
];

interface CustomHabitsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  habits: CustomHabit[];
  onSaveHabits: (habits: CustomHabit[]) => void;
}

export const CustomHabitsManager: React.FC<CustomHabitsManagerProps> = ({
  isOpen,
  onClose,
  habits,
  onSaveHabits,
}) => {
  const [editingHabit, setEditingHabit] = useState<CustomHabit | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formShortcode, setFormShortcode] = useState('');
  const [formDurationHours, setFormDurationHours] = useState(3);
  const [formTargetHours, setFormTargetHours] = useState(3);
  const [formColorTheme, setFormColorTheme] = useState<CustomHabit['colorTheme']>('purple');
  const [formIconType, setFormIconType] = useState<CustomHabit['iconType']>('music');

  if (!isOpen) return null;

  const handleStartEdit = (habit: CustomHabit) => {
    playDeskClick();
    setEditingHabit(habit);
    setIsAddingNew(false);
    setFormName(habit.name);
    setFormShortcode(habit.shortcode);
    setFormDurationHours(habit.defaultDurationHours);
    setFormTargetHours(Math.round((habit.dailyTargetMinutes / 60) * 10) / 10);
    setFormColorTheme(habit.colorTheme);
    setFormIconType(habit.iconType);
  };

  const handleStartAdd = () => {
    playDeskClick();
    setIsAddingNew(true);
    setEditingHabit(null);
    setFormName('Gym & Fitness');
    setFormShortcode('gym');
    setFormDurationHours(1.5);
    setFormTargetHours(1.5);
    setFormColorTheme('bronze');
    setFormIconType('dumbbell');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isAddingNew) {
      const newHabit: CustomHabit = {
        id: `habit_${Date.now()}`,
        name: formName.trim(),
        shortcode: formShortcode.trim().toLowerCase() || 'habit',
        defaultDurationHours: formDurationHours || 1,
        dailyTargetMinutes: Math.round((formTargetHours || 1) * 60),
        colorTheme: formColorTheme,
        iconType: formIconType,
        entryType: 'habit',
        isDefault: false,
      };
      onSaveHabits([...habits, newHabit]);
    } else if (editingHabit) {
      const updated = habits.map((h) => {
        if (h.id === editingHabit.id) {
          return {
            ...h,
            name: formName.trim(),
            shortcode: formShortcode.trim().toLowerCase() || h.shortcode,
            defaultDurationHours: formDurationHours || 1,
            dailyTargetMinutes: Math.round((formTargetHours || 1) * 60),
            colorTheme: formColorTheme,
            iconType: formIconType,
          };
        }
        return h;
      });
      onSaveHabits(updated);
    }

    setEditingHabit(null);
    setIsAddingNew(false);
  };

  const handleDeleteHabit = (id: string) => {
    playDeskClick();
    onSaveHabits(habits.filter((h) => h.id !== id));
    if (editingHabit?.id === id) {
      setEditingHabit(null);
    }
  };

  const handleResetDefaults = () => {
    playDeskClick();
    onSaveHabits(DEFAULT_HABITS);
    setEditingHabit(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h2 className="font-display text-lg font-semibold text-white tracking-tight">
            Customize Habits & Practice Trackers
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Rename Riyaz or add your own daily habits (Gym, Reading, Meditation, Deep Work) with custom durations, auto-extensions, and desk shortcodes.
        </p>

        {/* Existing Habits List */}
        {!editingHabit && !isAddingNew && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="label-scandi text-zinc-400">
                Active Habits ({habits.length})
              </span>
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Habit</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400">
                      {habit.iconType === 'music' && <Music className="w-4 h-4" />}
                      {habit.iconType === 'dumbbell' && <Dumbbell className="w-4 h-4" />}
                      {habit.iconType === 'book' && <Book className="w-4 h-4" />}
                      {habit.iconType === 'flame' && <Flame className="w-4 h-4" />}
                      {habit.iconType === 'sparkles' && <Sparkles className="w-4 h-4" />}
                      {habit.iconType === 'code' && <Code className="w-4 h-4" />}
                      {habit.iconType === 'heart' && <Heart className="w-4 h-4" />}
                      {habit.iconType === 'moon' && <Moon className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <span>{habit.name}</span>
                        {habit.isDefault && (
                          <span className="label-scandi text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Target: {Math.round(habit.dailyTargetMinutes / 60)}h · Auto-extend: +{habit.defaultDurationHours}h · Shortcode: <code className="text-emerald-400">{habit.shortcode}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(habit)}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    {!habit.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default (Riyaz)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Edit or Add Habit Form */}
        {(editingHabit || isAddingNew) && (
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-4">
              <h3 className="label-scandi text-zinc-200 mb-1">
                {isAddingNew ? 'Create New Habit' : `Edit: ${editingHabit?.name}`}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure habit name, auto-extension window, and daily quota.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="col-span-1 sm:col-span-2">
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Habit / Activity Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Guitar Practice, Gym Workout, Book Reading"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Shortcode */}
              <div>
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Desk Shortcode
                </label>
                <input
                  type="text"
                  value={formShortcode}
                  onChange={(e) => setFormShortcode(e.target.value)}
                  placeholder="e.g. gym, read, guitar"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Icon Type */}
              <div>
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Icon
                </label>
                <select
                  value={formIconType}
                  onChange={(e) => setFormIconType(e.target.value as CustomHabit['iconType'])}
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                >
                  <option value="music">Music / Riyaz</option>
                  <option value="dumbbell">Dumbbell / Gym</option>
                  <option value="book">Book / Reading</option>
                  <option value="flame">Flame / High Energy</option>
                  <option value="sparkles">Sparkles / Creative</option>
                  <option value="code">Code / Development</option>
                  <option value="heart">Heart / Health</option>
                  <option value="moon">Moon / Night</option>
                </select>
              </div>

              {/* Default Duration (Auto Extension) */}
              <div>
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Auto-Extend Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={formDurationHours}
                  onChange={(e) => setFormDurationHours(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Daily Target Hours */}
              <div>
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Daily Quota Target (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={formTargetHours}
                  onChange={(e) => setFormTargetHours(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Color Theme */}
              <div className="col-span-1 sm:col-span-2">
                <label className="label-scandi block text-zinc-400 mb-1.5">
                  Card Tag Metadata
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {(['purple', 'bronze', 'amber', 'emerald', 'blue', 'rose', 'indigo'] as const).map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setFormColorTheme(color)}
                      className={`p-2 rounded-lg border text-xs capitalize transition-all cursor-pointer ${
                        formColorTheme === color
                          ? 'border-emerald-400 bg-zinc-800 font-semibold text-white shadow-sm'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setEditingHabit(null);
                  setIsAddingNew(false);
                }}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                {isAddingNew ? 'Create Habit' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
