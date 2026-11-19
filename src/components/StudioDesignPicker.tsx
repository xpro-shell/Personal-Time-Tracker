import { Check, Crown, Palette, Sparkles, Type } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { StudioTextStyleId, StudioThemeId } from '../types/tracker';

export interface StudioTextStyleDefinition {
  id: Exclude<StudioTextStyleId, 'auto'>;
  name: string;
  vibe: string;
  category?: 'classic' | 'royal' | 'crazy';
  previewFont: string;
  previewStyle?: React.CSSProperties;
}

export const STUDIO_TEXT_STYLES: StudioTextStyleDefinition[] = [
  {
    id: 'observatory',
    name: 'Observatory Sans',
    vibe: 'System Clean + Mono',
    category: 'classic',
    previewFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  {
    id: 'minimal',
    name: 'Neo-Minimal',
    vibe: 'Playfair + Jakarta',
    category: 'classic',
    previewFont: "'Playfair Display', Georgia, serif",
  },
  {
    id: 'luxury',
    name: 'Imperial Serif',
    vibe: 'Cormorant + Outfit',
    category: 'classic',
    previewFont: "'Cormorant Garamond', Georgia, serif",
    previewStyle: { fontStyle: 'italic', fontWeight: 700 },
  },
  {
    id: 'aurora',
    name: 'Studio Futura',
    vibe: 'Syne + Space Grotesk',
    category: 'classic',
    previewFont: "'Syne', sans-serif",
    previewStyle: { fontWeight: 700 },
  },
  {
    id: 'blueprint',
    name: 'Technical HUD',
    vibe: 'IBM Plex Mono',
    category: 'classic',
    previewFont: "'IBM Plex Mono', monospace",
    previewStyle: { textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  },
  {
    id: 'zen',
    name: 'Sakura Serif',
    vibe: 'Fraunces + Nunito',
    category: 'classic',
    previewFont: "'Fraunces', Georgia, serif",
    previewStyle: { fontWeight: 600 },
  },
  {
    id: 'neopop',
    name: 'Bold Neo-Pop',
    vibe: 'Syne Heavy + Grotesk',
    category: 'crazy',
    previewFont: "'Syne', sans-serif",
    previewStyle: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em' },
  },
  {
    id: 'royal',
    name: 'Royal Crown',
    vibe: 'Cinzel Decorative + Lora',
    category: 'royal',
    previewFont: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
    previewStyle: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' },
  },
  {
    id: 'monarch',
    name: 'Monarch Velvet',
    vibe: 'Cinzel + Outfit',
    category: 'royal',
    previewFont: "'Cinzel', Georgia, serif",
    previewStyle: { fontWeight: 700, letterSpacing: '0.06em' },
  },
  {
    id: 'orbit',
    name: 'Cyber Orbit',
    vibe: 'Orbitron + Fira Code',
    category: 'crazy',
    previewFont: "'Orbitron', sans-serif",
    previewStyle: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  },
  {
    id: 'crazy',
    name: 'Crazy Poster',
    vibe: 'Bungee + Righteous',
    category: 'crazy',
    previewFont: "'Bungee', 'Righteous', sans-serif",
    previewStyle: { fontWeight: 400 },
  },
];

export const THEME_DEFAULT_TEXT_STYLE: Record<StudioThemeId, Exclude<StudioTextStyleId, 'auto'>> = {
  emerald: 'minimal',
  gold: 'luxury',
  violet: 'aurora',
  cyan: 'blueprint',
  rose: 'zen',
  solar: 'neopop',
  royal: 'royal',
  synth: 'orbit',
  cosmic: 'observatory',
};

interface StudioThemeDefinition {
  id: StudioThemeId;
  name: string;
  personality: string;
  description: string;
  dotClass: string;
  previewBg: string;
  previewStyle?: React.CSSProperties;
  accentText: string;
  pairedTextStyle: Exclude<StudioTextStyleId, 'auto'>;
}

export const STUDIO_THEMES: StudioThemeDefinition[] = [
  {
    id: 'emerald',
    name: 'Minimalist Void',
    personality: 'Deep Focus & Calm',
    description: 'Clean obsidian canvas, quiet hairlines, Neo-Minimal editorial type.',
    dotClass: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
    previewBg: '#09090b',
    accentText: 'text-emerald-300',
    pairedTextStyle: 'minimal',
  },
  {
    id: 'gold',
    name: 'Executive Luxury',
    personality: 'Warm Pinstripe & Gold',
    description: 'Espresso charcoal with gold pinstripes & italic Imperial Serif.',
    dotClass: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
    previewBg: '#0b0907',
    previewStyle: {
      backgroundImage:
        'repeating-linear-gradient(-45deg, rgba(251, 191, 36, 0.14) 0px, rgba(251, 191, 36, 0.14) 1px, transparent 1px, transparent 10px)',
    },
    accentText: 'text-amber-300',
    pairedTextStyle: 'luxury',
  },
  {
    id: 'royal',
    name: 'Royal Sovereign',
    personality: 'Burgundy Crown & Gold',
    description: 'Velvet burgundy diamond lattice with engraved Royal Crown serif.',
    dotClass: 'bg-yellow-300 shadow-[0_0_12px_#fcd34d]',
    previewBg: '#12070e',
    previewStyle: {
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(252, 211, 77, 0.12) 0px, rgba(252, 211, 77, 0.12) 1px, transparent 1px, transparent 11px), repeating-linear-gradient(-45deg, rgba(252, 211, 77, 0.12) 0px, rgba(252, 211, 77, 0.12) 1px, transparent 1px, transparent 11px)',
    },
    accentText: 'text-amber-200',
    pairedTextStyle: 'royal',
  },
  {
    id: 'violet',
    name: 'Aurora Glass',
    personality: 'Frosted Creative Flow',
    description: 'Glassmorphic panels over velvet aurora & Studio Futura display.',
    dotClass: 'bg-purple-400 shadow-[0_0_10px_#c084fc]',
    previewBg: '#0b0714',
    previewStyle: {
      backgroundImage:
        'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.45), transparent 65%), radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.35), transparent 60%)',
    },
    accentText: 'text-purple-300',
    pairedTextStyle: 'aurora',
  },
  {
    id: 'cyan',
    name: 'Cyber Blueprint',
    personality: 'Precision Systems Grid',
    description: 'Cobalt coordinate grid paired with uppercase Technical HUD mono.',
    dotClass: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
    previewBg: '#060d14',
    previewStyle: {
      backgroundImage:
        'linear-gradient(to right, rgba(34, 211, 238, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.18) 1px, transparent 1px)',
      backgroundSize: '12px 12px',
    },
    accentText: 'text-cyan-300',
    pairedTextStyle: 'blueprint',
  },
  {
    id: 'synth',
    name: 'Hyper Synthwave',
    personality: 'Crazy Neon Arcade',
    description: 'Electric magenta-cyan grid with sci-fi Cyber Orbit display type.',
    dotClass: 'bg-pink-400 shadow-[0_0_12px_#f472b6]',
    previewBg: '#070514',
    previewStyle: {
      backgroundImage:
        'linear-gradient(to bottom, rgba(236, 72, 153, 0.22) 1px, transparent 1px), linear-gradient(to right, rgba(34, 211, 238, 0.2) 1px, transparent 1px)',
      backgroundSize: '14px 10px',
    },
    accentText: 'text-pink-300',
    pairedTextStyle: 'orbit',
  },
  {
    id: 'rose',
    name: 'Sakura Zen',
    personality: 'Soft Warm Mindfulness',
    description: 'Plum-rose canvas with zen dot matrix & soft rounded Sakura Serif.',
    dotClass: 'bg-rose-400 shadow-[0_0_10px_#fb7185]',
    previewBg: '#12090e',
    previewStyle: {
      backgroundImage: 'radial-gradient(rgba(251, 113, 133, 0.35) 1px, transparent 1px)',
      backgroundSize: '10px 10px',
    },
    accentText: 'text-rose-300',
    pairedTextStyle: 'zen',
  },
  {
    id: 'solar',
    name: 'Solar Neo-Pop',
    personality: 'Bold Non-Minimalist',
    description: 'High-contrast dot matrix, offset shadows & Bold Neo-Pop display.',
    dotClass: 'bg-yellow-400 shadow-[0_0_10px_#facc15]',
    previewBg: '#0c1017',
    previewStyle: {
      backgroundImage: 'radial-gradient(rgba(250, 204, 21, 0.42) 1.2px, transparent 1.2px)',
      backgroundSize: '9px 9px',
    },
    accentText: 'text-yellow-300',
    pairedTextStyle: 'neopop',
  },
  {
    id: 'cosmic',
    name: 'COSMIC — Beyond Time',
    personality: 'Deep Space Observatory',
    description: 'A personal productivity universe with 3D black hole hero & orbital timer.',
    dotClass: 'bg-violet-400 shadow-[0_0_12px_#a78bfa]',
    previewBg: '#03040a',
    previewStyle: {
      backgroundImage:
        'radial-gradient(circle at 65% 45%, rgba(139, 92, 246, 0.42), transparent 55%), radial-gradient(circle at 25% 75%, rgba(34, 211, 238, 0.28), transparent 55%)',
    },
    accentText: 'text-violet-300',
    pairedTextStyle: 'observatory',
  },
];

interface StudioDesignPickerProps {
  currentTheme: StudioThemeId;
  onSelectTheme: (theme: StudioThemeId) => void;
  currentTextStyle: StudioTextStyleId;
  onSelectTextStyle: (style: StudioTextStyleId) => void;
}

export const StudioDesignPicker: React.FC<StudioDesignPickerProps> = ({
  currentTheme,
  onSelectTheme,
  currentTextStyle,
  onSelectTextStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeDef = STUDIO_THEMES.find((t) => t.id === currentTheme) || STUDIO_THEMES[0];
  const resolvedStyleId =
    currentTextStyle === 'auto' ? THEME_DEFAULT_TEXT_STYLE[currentTheme] : currentTextStyle;
  const activeTextDef =
    STUDIO_TEXT_STYLES.find((s) => s.id === resolvedStyleId) || STUDIO_TEXT_STYLES[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 pl-3 border-l border-zinc-800 shrink-0">
      {/* Quick Studio Light Swatches (Smooth Colour Shifting) */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Studio Design Theme">
        {STUDIO_THEMES.map((theme) => {
          const pairedFont = STUDIO_TEXT_STYLES.find((s) => s.id === theme.pairedTextStyle);
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              title={`${theme.name} — ${theme.personality} (${pairedFont?.name || ''})`}
              aria-label={`Switch theme: ${theme.name}`}
              className={`interactive-press w-3.5 h-3.5 rounded-full transition-all duration-500 cursor-pointer ${theme.dotClass} ${
                currentTheme === theme.id
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#101014] scale-115 opacity-100'
                  : 'opacity-55 hover:opacity-95 hover:scale-110'
              }`}
            />
          );
        })}
      </div>

      {/* Bundled Studio Light / Design & Royal+Crazy Text Style Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-[11px] font-sans text-zinc-200 transition-all duration-300 cursor-pointer whitespace-nowrap"
        title={`Studio Light & Fonts — ${activeDef.name} · ${activeTextDef.name}`}
      >
        <Palette className="w-3.5 h-3.5 text-zinc-300" />
        <span className="hidden md:inline font-medium">{activeDef.name}</span>
        <span className="hidden xl:inline text-zinc-500">·</span>
        <span
          className="hidden xl:inline text-[11px] text-zinc-300"
          style={{ fontFamily: activeTextDef.previewFont, ...activeTextDef.previewStyle }}
        >
          {activeTextDef.name}
        </span>
        <span className="md:hidden font-medium">Designs</span>
      </button>

      {/* Rich Theme, Background & Bundled Royal/Crazy Font Gallery Popover */}
      {isOpen && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-[118px] sm:top-full sm:mt-3 w-[calc(100vw-24px)] sm:w-[440px] max-h-[80vh] overflow-y-auto z-50 p-4 rounded-2xl bg-[#111116]/98 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/90 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="font-display text-sm font-semibold text-white">
                  Studio Light, Designs & Royal Fonts
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Smooth ambient colour shifting with minimalist, royal, and bold crazy typography styles.
              </p>
            </div>
          </div>

          {/* Featured COSMIC — Beyond Time Observatory Preview + Use Template */}
          <div
            className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 ${
              currentTheme === 'cosmic'
                ? 'border-violet-400/75 bg-[#050816] shadow-[0_0_28px_-8px_rgba(139,92,246,0.55)]'
                : 'border-violet-500/35 bg-[#040610] hover:border-violet-400/60'
            }`}
          >
            {/* Visual Space + Mini 3D Black Hole Preview */}
            <div
              className="relative h-24 w-full rounded-lg border border-indigo-500/20 overflow-hidden mb-3 flex items-center justify-between px-3.5"
              style={{
                background:
                  'radial-gradient(circle at 74% 50%, rgba(139, 92, 246, 0.24), transparent 52%), radial-gradient(circle at 22% 28%, rgba(56, 189, 248, 0.14), transparent 55%), linear-gradient(135deg, #03040a 0%, #070b1d 55%, #0c071b 100%)',
              }}
            >
              {/* Tiny Fine Stars */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-75"
                style={{
                  backgroundImage:
                    'radial-gradient(1px 1px at 14% 22%, #e0e7ff, transparent), radial-gradient(1px 1px at 28% 72%, #c4b5fd, transparent), radial-gradient(1.2px 1.2px at 44% 18%, #ffffff, transparent), radial-gradient(1px 1px at 56% 80%, #a5f3fc, transparent), radial-gradient(1px 1px at 88% 24%, #ffffff, transparent), radial-gradient(1px 1px at 92% 78%, #ddd6fe, transparent)',
                }}
              />
              <div className="relative z-10 space-y-1 max-w-[60%]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                  Featured Observatory Experience
                </div>
                <div className="text-sm font-bold text-white leading-tight">
                  Your Universe. Your Time.
                </div>
                <div className="text-[10px] font-sans text-slate-300/90 truncate">
                  Every moment creates your next chapter.
                </div>
              </div>

              {/* Miniature 3D Black Hole Preview */}
              <div className="relative z-10 w-20 h-20 shrink-0 flex items-center justify-center" aria-hidden="true">
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-70"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(139,92,246,0.5) 28%, rgba(56,189,248,0.22) 60%, transparent 75%)',
                  }}
                />
                <div
                  className="absolute w-16 h-5 rounded-full border border-violet-300/55 -rotate-12"
                  style={{
                    boxShadow: '0 0 12px rgba(139, 92, 246, 0.45), inset 0 0 8px rgba(34, 211, 238, 0.3)',
                  }}
                />
                <div
                  className="relative w-8 h-8 rounded-full bg-black border border-cyan-300/60"
                  style={{
                    boxShadow: '0 0 14px rgba(139, 92, 246, 0.65)',
                  }}
                />
                <div className="absolute w-14 h-4 rounded-full border-b-2 border-indigo-200/75 -rotate-12" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                  <h5 className="text-xs font-bold text-white truncate">
                    COSMIC — Beyond Time
                  </h5>
                </div>
                <p className="text-[11px] text-slate-300/90 leading-snug mt-0.5">
                  A personal productivity universe. Track every moment, explore your progress and build your future.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTheme('cosmic');
                  setIsOpen(false);
                }}
                className={`interactive-press px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer shrink-0 ${
                  currentTheme === 'cosmic'
                    ? 'bg-violet-500/25 border-violet-300/75 text-violet-100'
                    : 'bg-violet-500 hover:bg-violet-400 border-violet-300 text-zinc-950 font-bold shadow-[0_0_16px_-4px_rgba(167,139,250,0.75)]'
                }`}
              >
                {currentTheme === 'cosmic' ? 'Active' : 'Use Template'}
              </button>
            </div>
          </div>

          {/* 1. Studio Color + Background + Paired Typography Designs */}
          <div className="grid grid-cols-1 gap-2">
            {STUDIO_THEMES.filter((t) => t.id !== 'cosmic').map((theme) => {
              const isSelected = currentTheme === theme.id;
              const pairedText = STUDIO_TEXT_STYLES.find((s) => s.id === theme.pairedTextStyle);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onSelectTheme(theme.id)}
                  className={`interactive-press w-full text-left p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-white/60 shadow-lg'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900/70'
                  }`}
                >
                  {/* Visual Background Texture + Live Typographic "Aa" Preview */}
                  <div
                    className="w-12 h-12 rounded-lg border border-zinc-700/80 shrink-0 flex flex-col items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: theme.previewBg, ...theme.previewStyle }}
                  >
                    <span
                      className={`text-base leading-none ${theme.accentText}`}
                      style={{
                        fontFamily: pairedText?.previewFont,
                        ...pairedText?.previewStyle,
                      }}
                    >
                      Aa
                    </span>
                    <span className={`w-2 h-2 rounded-full mt-1 ${theme.dotClass}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${theme.accentText}`}
                        style={{
                          fontFamily: pairedText?.previewFont,
                          ...pairedText?.previewStyle,
                        }}
                      >
                        {theme.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 truncate">
                        {pairedText?.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                      {theme.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. Bundled Text Style Selector (Classic + Royal + Crazy Fonts) */}
          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                  Text Styles (Classic, Royal & Crazy)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTextStyle('auto')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${
                  currentTextStyle === 'auto'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Auto · Match Design
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {STUDIO_TEXT_STYLES.map((style) => {
                const isExplicitSelected = currentTextStyle === style.id;
                const isActive = resolvedStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onSelectTextStyle(style.id)}
                    className={`interactive-press p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isExplicitSelected
                        ? 'bg-zinc-800 border-white/60 text-white'
                        : isActive
                        ? 'bg-zinc-900/90 border-emerald-500/40 text-zinc-100'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-sm leading-tight text-zinc-100 flex items-center gap-1"
                        style={{ fontFamily: style.previewFont, ...style.previewStyle }}
                      >
                        Aa
                        {style.category === 'royal' && (
                          <Crown className="w-3 h-3 text-amber-300 inline" />
                        )}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider">
                        {isActive ? (
                          <span className="text-emerald-400">
                            {isExplicitSelected ? 'SET' : 'AUTO'}
                          </span>
                        ) : style.category === 'royal' ? (
                          <span className="text-amber-300/80">Royal</span>
                        ) : style.category === 'crazy' ? (
                          <span className="text-pink-300/80">Crazy</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium truncate mt-1">{style.name}</div>
                    <div className="text-[9px] text-zinc-500 truncate">{style.vibe}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
