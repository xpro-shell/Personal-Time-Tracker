import { Award, CheckCircle, Clock, Sparkles, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playDeskLoginBeep, playDeskLogoutBeep } from '../lib/audioAlert';

interface MotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'logout';
  timestamp: string; // ISO string or formatted
}

const MOTIVATIONAL_LOGIN_QUOTES = [
  {
    quote: "Consistency is what transforms average into excellence. Today, every single minute counts.",
    author: "Desk Creed",
  },
  {
    quote: "You don't need more time, you need ruthless focus. Step into the arena.",
    author: "Mastery Principle",
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Deep Work Law",
  },
  {
    quote: "The magic you're looking for is in the honest hours you've been avoiding.",
    author: "Productivity Rule",
  },
  {
    quote: "Show up when nobody is clapping. That's when empires are quietly constructed.",
    author: "High-Performance Code",
  },
];

const MOTIVATIONAL_LOGOUT_QUOTES = [
  {
    quote: "Day complete. You showed up, logged honestly, and held the line.",
    author: "Desk Wrap",
  },
  {
    quote: "Rest is not a reward for work; it is a prerequisite for greatness. Recharge fully.",
    author: "Recovery Science",
  },
  {
    quote: "Accountability is the difference between a dreamer and an achiever. Rest with zero guilt.",
    author: "Audit Rule",
  },
  {
    quote: "Another brick laid in your future. Sleep deeply, return with hunger.",
    author: "Night Protocol",
  },
];

export const MotivationModal: React.FC<MotivationModalProps> = ({
  isOpen,
  onClose,
  type,
  timestamp,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Pick random quote
      const quotes = type === 'login' ? MOTIVATIONAL_LOGIN_QUOTES : MOTIVATIONAL_LOGOUT_QUOTES;
      setQuoteIndex(Math.floor(Math.random() * quotes.length));

      // Play audio beep
      if (type === 'login') {
        playDeskLoginBeep();
      } else {
        playDeskLogoutBeep();
      }

      // Auto close after 3.5s
      const timer = setTimeout(() => {
        onClose();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const eventDate = new Date(timestamp || Date.now());
  const dateFormatted = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const activeQuote =
    type === 'login'
      ? MOTIVATIONAL_LOGIN_QUOTES[quoteIndex]
      : MOTIVATIONAL_LOGOUT_QUOTES[quoteIndex];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#121215] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-amber-950/30 relative text-center animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Icon Badge */}
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
          {type === 'login' ? <Sparkles className="w-6 h-6" /> : <Award className="w-6 h-6" />}
        </div>

        {/* Status Tag */}
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-semibold text-amber-400 block mb-1">
          {type === 'login' ? '• DESK SESSION ACTIVATED •' : '• DAY LOGOUT RECONCILED •'}
        </span>

        {/* Bold Date & Time Display */}
        <div className="my-3.5 p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-xl">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Official System Timestamp
          </span>
          <div className="text-sm font-bold tracking-tight text-zinc-200 uppercase">
            {dateFormatted}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono mt-0.5 tabular-nums">
            {timeFormatted}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="my-4 px-2">
          <blockquote className="text-xs sm:text-sm text-zinc-300 font-sans italic leading-relaxed">
            "{activeQuote?.quote}"
          </blockquote>
          <span className="block mt-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
            — {activeQuote?.author}
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 px-4 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-md font-mono uppercase tracking-wider"
        >
          {type === 'login' ? 'Enter Focus Mode' : 'Complete Wrap-Up'}
        </button>
      </div>
    </div>
  );
};
