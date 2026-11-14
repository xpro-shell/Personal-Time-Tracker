import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  unreconciledCount?: number;
}

export function formatLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const parseDate = (dStr: string) => {
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const currentDateObj = parseDate(selectedDate);
  const dayOfWeek = currentDateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedDate = `${dayNames[dayOfWeek]}, ${currentDateObj.getDate()} ${monthNames[currentDateObj.getMonth()]} ${currentDateObj.getFullYear()}`;

  const shiftDate = (offsetDays: number) => {
    const newD = new Date(currentDateObj);
    newD.setDate(newD.getDate() + offsetDays);
    onSelectDate(formatLocalYMD(newD));
  };

  // Dynamic real-time local Today and Yesterday
  const todayObj = new Date();
  const todayIso = formatLocalYMD(todayObj);
  const todayShortLabel = `Today (${shortDayNames[todayObj.getDay()]} ${todayObj.getDate()} ${monthNames[todayObj.getMonth()]})`;

  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayIso = formatLocalYMD(yesterdayObj);
  const yesterdayShortLabel = `Yesterday (${shortDayNames[yesterdayObj.getDay()]} ${yesterdayObj.getDate()} ${monthNames[yesterdayObj.getMonth()]})`;

  return (
    <div className="p-3.5 rounded-2xl bg-[#121215] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
      {/* Date Title & Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => shiftDate(-1)}
          className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-display text-sm sm:text-base font-semibold text-white tracking-tight">
            {formattedDate}
          </span>
          {isWeekend ? (
            <span className="label-scandi px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              Weekend Off
            </span>
          ) : (
            <span className="label-scandi px-1.5 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-zinc-800">
              6h Quota
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => shiftDate(1)}
          className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Next Day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Jump Buttons: Dynamic Yesterday / Today & Date Picker */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onSelectDate(yesterdayIso)}
          className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
            selectedDate === yesterdayIso
              ? 'bg-emerald-400 text-zinc-950 border-emerald-300 font-semibold'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
          }`}
        >
          {yesterdayShortLabel}
        </button>

        <button
          type="button"
          onClick={() => onSelectDate(todayIso)}
          className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
            selectedDate === todayIso
              ? 'bg-emerald-400 text-zinc-950 border-emerald-300 font-semibold'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
          }`}
        >
          {todayShortLabel}
        </button>

        <label className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer">
          <span className="text-[11px] mr-1.5">Pick Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
          />
          <Calendar className="w-3.5 h-3.5" />
        </label>
      </div>
    </div>
  );
};
