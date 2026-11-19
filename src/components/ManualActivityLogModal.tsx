import {
  BookOpen,
  Calendar,
  Clock,
  Coffee,
  Flame,
  Laptop,
  Moon,
  Plus,
  Sparkles,
  Tv,
  Video,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { playDeskClick, playEarnedChime } from '../lib/audioAlert';
import { shiftYmd } from '../lib/sessionRollover';
import { CustomHabit, EntryType } from '../types/tracker';

export interface ManualLogPayload {
  type: EntryType;
  topic: string;
  startTimeIso: string;
  endTimeIso: string;
  durationMinutes: number;
  assignedDate: string;
  note?: string;
  habitId?: string;
}

interface ManualActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD
  currentSystemDate: string; // YYYY-MM-DD
  habits: CustomHabit[];
  initialCategory?: string;
  onSaveLog: (payload: ManualLogPayload) => void;
}

function formatHHMM(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function subtractMinsFromHHMM(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const totalMins = (((h * 60 + m - mins) % 1440) + 1440) % 1440;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function addMinsToHHMM(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const totalMins = (h * 60 + m + mins) % 1440;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function diffMinsBetweenHHMM(startStr: string, endStr: string): number {
  const [h1, m1] = startStr.split(':').map((v) => parseInt(v, 10) || 0);
  const [h2, m2] = endStr.split(':').map((v) => parseInt(v, 10) || 0);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff <= 0) diff += 1440;
  return diff;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export const ManualActivityLogModal: React.FC<ManualActivityLogModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  currentSystemDate,
  habits,
  initialCategory = 'study',
  onSaveLog,
}) => {
  interface CategoryOption {
    id: string;
    label: string;
    type: EntryType;
    habitId?: string;
    defaultTopic: string;
    defaultMins: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }

  const categories = useMemo<CategoryOption[]>(() => {
    const core: CategoryOption[] = [
      { id: 'study', label: 'Study Focus', type: 'study', defaultTopic: 'Deep Work', defaultMins: 60, icon: BookOpen, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15' },
      { id: 'break', label: 'Break Bank', type: 'break', defaultTopic: 'Break', defaultMins: 20, icon: Coffee, color: 'text-amber-400 border-amber-500/40 bg-amber-500/15' },
      { id: 'content', label: 'Content Creation', type: 'content', defaultTopic: 'Content Creation', defaultMins: 60, icon: Video, color: 'text-violet-400 border-violet-500/40 bg-violet-500/15' },
      { id: 'desk', label: 'Active Desk Time', type: 'desk', defaultTopic: 'Active Desk Time', defaultMins: 120, icon: Laptop, color: 'text-teal-400 border-teal-500/40 bg-teal-500/15' },
      { id: 'sleep', label: 'Restorative Sleep', type: 'sleep', defaultTopic: 'Restorative Sleep', defaultMins: 480, icon: Moon, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/15' },
      { id: 'life', label: 'Life / Leisure', type: 'life', defaultTopic: 'Life Activity', defaultMins: 45, icon: Tv, color: 'text-pink-400 border-pink-500/40 bg-pink-500/15' },
    ];
    const habitItems: CategoryOption[] = habits.map((h) => ({
      id: `habit:${h.id}`,
      label: h.name,
      type: h.entryType,
      habitId: h.id,
      defaultTopic: h.name,
      defaultMins: Math.round((h.defaultDurationHours || 1) * 60),
      icon: Flame,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/15',
    }));
    return [...core, ...habitItems];
  }, [habits]);

  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategory);
  const [assignedDate, setAssignedDate] = useState<string>(defaultDate);
  const [topic, setTopic] = useState<string>('Deep Work');
  const [note, setNote] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [endTime, setEndTime] = useState<string>(() => formatHHMM(new Date()));
  const [startTime, setStartTime] = useState<string>(() =>
    subtractMinsFromHHMM(formatHHMM(new Date()), 60)
  );

  useEffect(() => {
    if (!isOpen) return;
    const nowStr = formatHHMM(new Date());
    const cat = categories.find((c) => c.id === initialCategory) || categories[0];
    setSelectedCatId(cat.id);
    setAssignedDate(defaultDate);
    setTopic(cat.defaultTopic);
    setNote('');
    setDurationMinutes(cat.defaultMins);
    setEndTime(nowStr);
    setStartTime(subtractMinsFromHHMM(nowStr, cat.defaultMins));
  }, [isOpen, defaultDate, initialCategory, categories]);

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const yesterdayYmd = shiftYmd(currentSystemDate, -1);

  const handleSelectCategory = (catId: string) => {
    playDeskClick();
    setSelectedCatId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setTopic(cat.defaultTopic);
      setDurationMinutes(cat.defaultMins);
      setStartTime(subtractMinsFromHHMM(endTime, cat.defaultMins));
    }
  };

  const handleStartChange = (newStart: string) => {
    if (!newStart) return;
    setStartTime(newStart);
    setEndTime(addMinsToHHMM(newStart, durationMinutes));
  };

  const handleDurationChange = (mins: number) => {
    const valid = Math.max(1, Math.min(960, Math.round(mins)));
    setDurationMinutes(valid);
    setEndTime(addMinsToHHMM(startTime, valid));
  };

  const handleEndChange = (newEnd: string) => {
    if (!newEnd) return;
    setEndTime(newEnd);
    setDurationMinutes(diffMinsBetweenHHMM(startTime, newEnd));
  };

  const formatDurationLabel = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const [y, m, d] = assignedDate.split('-').map(Number);
    const [sH, sM] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
    const startDate = new Date(y, m - 1, d, sH, sM, 0, 0);
    const safeMins = Math.max(1, durationMinutes);
    const endDate = new Date(startDate.getTime() + safeMins * 60000);

    playEarnedChime();
    onSaveLog({
      type: activeCategory.type,
      topic: topic.trim() || activeCategory.defaultTopic,
      startTimeIso: startDate.toISOString(),
      endTimeIso: endDate.toISOString(),
      durationMinutes: safeMins,
      assignedDate,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(activeCategory.habitId ? { habitId: activeCategory.habitId } : {}),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-log-modal-title"
    >
      <form
        onSubmit={handleSave}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#111216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-4"
      >
        <button
          type="button"
          onClick={() => {
            playDeskClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Close manual activity logger"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Forgot to Start Timer?</span>
          </div>
          <h2
            id="manual-log-modal-title"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white"
          >
            Log Any Activity Anytime
          </h2>
          <p className="text-xs font-sans text-zinc-400">
            Retroactively log Study, Break, Content Creation, Active Desk, Sleep, Life, or any Habit for today or a past day.
          </p>
        </div>

        {/* 1. Activity Selector */}
        <div className="space-y-2">
          <label className="label-scandi text-zinc-400 block">1. Select Activity</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = cat.id === activeCategory.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`interactive-press flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? `${cat.color} font-semibold shadow-sm`
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Target Date + Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label-scandi text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> 2. Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAssignedDate(yesterdayYmd)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                    assignedDate === yesterdayYmd
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedDate(currentSystemDate)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                    assignedDate === currentSystemDate
                      ? 'bg-emerald-400/20 border-emerald-400 text-emerald-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
            <input
              type="date"
              value={assignedDate}
              onChange={(e) => e.target.value && setAssignedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="label-scandi text-zinc-400 block">Topic / Label</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. DSA Graphs, Coffee Break, Morning Desk"
              className="w-full px-3 py-2 text-xs font-sans bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 3. Time Window & Quick Duration */}
        <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              3. Time Window
            </span>
            <span className="text-emerald-400 font-bold">
              {startTime} → {endTime} ({formatDurationLabel(durationMinutes)})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">Minutes</label>
              <input
                type="number"
                min={1}
                max={960}
                value={durationMinutes}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 15)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block label-scandi text-zinc-500 mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {DURATION_PRESETS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  playDeskClick();
                  handleDurationChange(mins);
                }}
                className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                  durationMinutes === mins
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {formatDurationLabel(mins)}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Optional Note */}
        <div className="space-y-1.5">
          <label className="label-scandi text-zinc-400 block">Optional Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Forgot to start timer during morning revision..."
            className="w-full px-3 py-2 text-xs font-sans bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="interactive-press flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Save {formatDurationLabel(durationMinutes)} to {assignedDate}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
