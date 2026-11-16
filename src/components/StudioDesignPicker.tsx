import { Check, Palette, Sparkles, Type } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { StudioTextStyleId, StudioThemeId } from '../types/tracker';

export interface StudioTextStyleDefinition {
  id: Exclude<StudioTextStyleId, 'auto'>;
  name: string;
  vibe: string;
  previewFont: string;
  previewStyle?: React.CSSProperties;
}

export const STUDIO_TEXT_STYLES: StudioTextStyleDefinition[] = [
  {
    id: 'minimal',
    name: 'Neo-Minimal',
    vibe: 'Playfair + Jakarta',
    previewFont: "'Playfair Display', Georgia, serif",
  },
  {
    id: 'luxury',
    name: 'Imperial Serif',
    vibe: 'Cormorant + Outfit',
    previewFont: "'Cormorant Garamond', Georgia, serif",
    previewStyle: { fontStyle: 'italic', fontWeight: 700 },
  },
  {
    id: 'aurora',
    name: 'Studio Futura',
    vibe: 'Syne + Space Grotesk',
    previewFont: "'Syne', sans-serif",
    previewStyle: { fontWeight: 700 },
  },
  {
    id: 'blueprint',
    name: 'Technical HUD',
    vibe: 'IBM Plex Mono',
    previewFont: "'IBM Plex Mono', monospace",
    previewStyle: { textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  },
  {
    id: 'zen',
    name: 'Sakura Serif',
    vibe: 'Fraunces + Nunito',
    previewFont: "'Fraunces', Georgia, serif",
    previewStyle: { fontWeight: 600 },
  },
  {
    id: 'neopop',
    name: 'Bold Neo-Pop',
    vibe: 'Syne Heavy + Grotesk',
    previewFont: "'Syne', sans-serif",
    previewStyle: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em' },
  },
];

export const THEME_DEFAULT_TEXT_STYLE: Record<StudioThemeId, Exclude<StudioTextStyleId, 'auto'>> = {
  emerald: 'minimal',
  gold: 'luxury',
  violet: 'aurora',
  cyan: 'blueprint',
  rose: 'zen',
  solar: 'neopop',
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
      {/* Quick 6 Color + Font Personality Swatches */}
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
              className={`interactive-press w-4 h-4 rounded-full transition-all cursor-pointer ${theme.dotClass} ${
                currentTheme === theme.id
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#101014] scale-110 opacity-100'
                  : 'opacity-55 hover:opacity-95 hover:scale-110'
              }`}
            />
          );
        })}
      </div>

      {/* Bundled Studio Light / Design & Text Style Gallery Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="interactive-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-[11px] font-sans text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
        title={`Design: ${activeDef.name} · Text: ${activeTextDef.name}`}
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

      {/* Rich Theme, Background & Bundled Text Style Gallery Popover */}
      {isOpen && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-[118px] sm:top-full sm:mt-3 w-[calc(100vw-24px)] sm:w-[410px] max-h-[78vh] overflow-y-auto z-50 p-4 rounded-2xl bg-[#111116]/98 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/90 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="font-display text-sm font-semibold text-white">
                  Studio Designs & Text Styles
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Each design pairs its own colors, background, and signature typography — or mix & match below.
              </p>
            </div>
          </div>

          {/* 1. Studio Color + Background + Paired Typography Designs */}
          <div className="grid grid-cols-1 gap-2">
            {STUDIO_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              const pairedText = STUDIO_TEXT_STYLES.find((s) => s.id === theme.pairedTextStyle);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id);
                  }}
                  className={`interactive-press w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
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

          {/* 2. Bundled Text Style Selector (Inside the Same Studio Light Popover) */}
          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                  Text Style Option
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {STUDIO_TEXT_STYLES.map((style) => {
                const isExplicitSelected = currentTextStyle === style.id;
                const isActive = resolvedStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onSelectTextStyle(style.id)}
                    className={`interactive-press p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isExplicitSelected
                        ? 'bg-zinc-800 border-white/60 text-white'
                        : isActive
                        ? 'bg-zinc-900/90 border-emerald-500/40 text-zinc-100'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-sm leading-tight text-zinc-100"
                        style={{ fontFamily: style.previewFont, ...style.previewStyle }}
                      >
                        Aa
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono text-emerald-400">
                          {isExplicitSelected ? 'SET' : 'AUTO'}
                        </span>
                      )}
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
