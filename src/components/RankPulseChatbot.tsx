import {
  Calculator,
  FlaskConical,
  Gamepad2,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';
import {
  answerGrowthQuestionLocally,
  buildGrowthAnalyticsSnapshot,
} from '../lib/growthChatbotEngine';
import { ActiveDeskTelemetry, formatMinutesHm } from '../lib/progressAnalytics';
import { CustomHabit, TimeEntry, UserProfile, VaultEntry } from '../types/tracker';

interface RankPulseChatbotProps {
  entries: TimeEntry[];
  habits: CustomHabit[];
  vaultEntries: VaultEntry[];
  achievementsCount: number;
  profile: UserProfile;
  selectedDate: string;
  activeDesk?: ActiveDeskTelemetry;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sourceLabel?: string;
}

const QUICK_PROMPTS = [
  'How much % did I grow in 1 week?',
  'Give me my all-time tracker stats',
  'How much Active Desk time did I log?',
  'How is today compared to yesterday?',
];

function renderFormattedReply(text: string): React.ReactNode {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-xs font-sans text-zinc-200 tabular-nums">
            {parts.map((part, idx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={idx} className="text-white font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <React.Fragment key={idx}>{part}</React.Fragment>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export const RankPulseChatbot: React.FC<RankPulseChatbotProps> = ({
  entries,
  habits,
  vaultEntries,
  achievementsCount,
  profile,
  selectedDate,
  activeDesk,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [useLocalEngine, setUseLocalEngine] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const snapshot = useMemo(
    () =>
      buildGrowthAnalyticsSnapshot({
        entries,
        habits,
        vaultEntries,
        achievementsCount,
        profile,
        selectedDate,
        activeDesk,
      }),
    [entries, habits, vaultEntries, achievementsCount, profile, selectedDate, activeDesk]
  );

  // Check whether Gemini API backend is active on first open
  useEffect(() => {
    if (!isOpen || aiAvailable !== null) return;
    let active = true;
    fetch('/api/growth-status')
      .then((r) => (r.ok ? r.json() : { aiAvailable: false }))
      .then((data: { aiAvailable?: boolean }) => {
        if (!active) return;
        const avail = Boolean(data.aiAvailable);
        setAiAvailable(avail);
        if (!avail) setUseLocalEngine(true);
      })
      .catch(() => {
        if (!active) return;
        setAiAvailable(false);
        setUseLocalEngine(true);
      });
    return () => {
      active = false;
    };
  }, [isOpen, aiAvailable]);

  // Seed initial welcome greeting when opened for the first time
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    const w = snapshot.rolling7Days.overall;
    const weekGrowthText =
      w.pctChange === null
        ? w.currentMinutes > 0
          ? `+100% baseline (${formatMinutesHm(w.currentMinutes)} logged this week)`
          : '0% (no sessions yet this week)'
        : `${w.pctChange >= 0 ? '+' : ''}${w.pctChange}%`;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        sourceLabel: 'RankPulse · In Beta',
        text: [
          `Welcome, **${snapshot.profile.displayName}** (Lv ${snapshot.profile.level} · ${snapshot.profile.totalXp} XP).`,
          `• 1-Week Growth: **${weekGrowthText}**`,
          `• Active Desk Today: **${formatMinutesHm(snapshot.today.activeDeskMinutes)}**`,
          `• All-Time Tracked: **${formatMinutesHm(snapshot.allTime.totalActivityMinutes)}**`,
          `\nAsk me anything about your weekly % growth, Active Desk hours, or all-time progress!`,
        ].join('\n'),
      },
    ]);
  }, [isOpen, messages.length, snapshot]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const question = (overrideText ?? input).trim();
    if (!question || isLoading) return;

    playDeskClick();
    if (!overrideText) setInput('');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: question,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    // Use Instant Local Exact Engine if Gemini isn't configured or user selected local calculator
    if (useLocalEngine || aiAvailable === false) {
      const localReply = answerGrowthQuestionLocally(question, snapshot);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          sourceLabel: 'Exact Stats Engine · Beta',
          text: localReply,
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/growth-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          snapshot,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === 'MISSING_API_KEY') {
          setAiAvailable(false);
          setUseLocalEngine(true);
          const localReply = answerGrowthQuestionLocally(question, snapshot);
          setMessages((prev) => [
            ...prev,
            {
              id: `a_${Date.now()}`,
              role: 'assistant',
              sourceLabel: 'Offline Stats Engine (No Server API Key)',
              text: localReply,
            },
          ]);
          return;
        }
        throw new Error(data.error || 'Could not reach RankPulse AI.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          sourceLabel: 'RankPulse AI · Gemini Beta',
          text: data.reply || 'No response received.',
        },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Request failed.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          sourceLabel: 'Beta Notice',
          text: `Could not reach live AI right now (${errMsg}). Switching to **Exact Stats Engine** below:\n\n${answerGrowthQuestionLocally(question, snapshot)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const w7 = snapshot.rolling7Days.overall;
  const w7Display =
    w7.pctChange === null
      ? w7.currentMinutes > 0
        ? '+100%'
        : '0%'
      : `${w7.pctChange >= 0 ? '+' : ''}${w7.pctChange}%`;

  return (
    <div className="relative flex justify-end items-center pt-1">
      {/* Compact Circular RankPulse AI Option + Highlighted "In Beta / In Testing" Tag */}
      {!isOpen && (
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-zinc-100">
              <span>RankPulse AI</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/45 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                In Beta · Testing
              </span>
            </div>
            <p className="text-[11px] font-sans text-zinc-400">
              Ask 1-week % growth, desk time &amp; all-time stats
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playDeskClick();
              setIsOpen(true);
            }}
            className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-300 text-zinc-950 flex items-center justify-center shadow-[0_6px_24px_-4px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-[#111216]"
            title="Open RankPulse AI Growth Coach (In Beta · Testing)"
            aria-label="Open RankPulse AI Growth Coach (In Beta · Testing)"
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded bg-amber-400 text-zinc-950 text-[8px] font-mono font-extrabold tracking-tight shadow">
              BETA
            </span>
          </button>
        </div>
      )}

      {/* Expandable RankPulse Chat Panel */}
      {isOpen && (
        <div className="w-full max-w-md rounded-2xl bg-[#0c0e13] border border-cyan-500/35 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Gaming Growth Name + Prominent In Beta Highlight */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0e1920] via-[#10141c] to-[#17131e] border-b border-zinc-800/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-zinc-950 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-display text-sm font-bold text-white truncate">
                    RankPulse AI
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-semibold">
                    <FlaskConical className="w-2.5 h-2.5" />
                    <span>In Beta · In Testing</span>
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                  Lv {snapshot.profile.level} · {snapshot.profile.totalXp} XP · Exact Tracker Copilot
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playDeskClick();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
              aria-label="Minimize RankPulse AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Highlighted Beta & Engine Switch Strip */}
          <div className="px-3.5 py-2 bg-amber-500/8 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-amber-200/90 font-sans">
              <strong>In Testing:</strong> Queries are grounded directly in your exact local history.
            </span>

            {aiAvailable && (
              <button
                type="button"
                onClick={() => {
                  playDeskClick();
                  setUseLocalEngine((v) => !v);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-cyan-400/60 font-mono text-[10px] cursor-pointer shrink-0"
                title="Switch between Live Gemini AI and Instant Local Stats Math"
              >
                {useLocalEngine ? (
                  <>
                    <Calculator className="w-3 h-3 text-emerald-400" />
                    <span>Exact Local</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>AI Beta</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Live Verified Snapshot Header */}
          <div className="grid grid-cols-3 divide-x divide-zinc-800/80 border-b border-zinc-800/80 bg-zinc-950/60 text-center py-2 px-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block">7d Growth</span>
              <span
                className={`text-xs font-mono font-bold tabular-nums inline-flex items-center gap-0.5 ${
                  w7.direction === 'down' ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                {w7Display}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block">Desk Today</span>
              <span className="text-xs font-mono font-bold text-teal-300 tabular-nums">
                {formatMinutesHm(snapshot.today.activeDeskMinutes)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block">All-Time</span>
              <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                {formatMinutesHm(snapshot.allTime.totalActivityMinutes)}
              </span>
            </div>
          </div>

          {/* Chat Feed */}
          <div
            ref={scrollRef}
            className="p-3.5 space-y-3 max-h-72 overflow-y-auto bg-[#0a0b10]"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.sourceLabel && m.role === 'assistant' && (
                  <span className="text-[10px] font-mono text-zinc-500 mb-1 px-1">
                    {m.sourceLabel}
                  </span>
                )}
                <div
                  className={`max-w-[92%] rounded-xl px-3 py-2.5 ${
                    m.role === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-xs text-white font-sans'
                      : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200'
                  }`}
                >
                  {m.role === 'user' ? m.text : renderFormattedReply(m.text)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-xl px-3 py-2 bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-cyan-300">
                  Calculating growth telemetry...
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-950/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => handleSend(qp)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-400/50 text-[11px] font-sans text-zinc-300 hover:text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-2.5 bg-[#0e1015] border-t border-zinc-800/90 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask e.g. '1 week growth %' or 'all time stats'..."
              className="flex-1 px-3 py-2 text-xs font-sans bg-zinc-950 border border-zinc-800 focus:border-cyan-400/70 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold transition-colors cursor-pointer shrink-0"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
