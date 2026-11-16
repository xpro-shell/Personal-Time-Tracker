import React, { useEffect, useRef, useState } from 'react';
import { playDeskClick } from '../lib/audioAlert';

interface IntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
  autoShowOnMount?: boolean;
}

const SAKURA_SERIF_FONT = "'Fraunces', 'Playfair Display', Georgia, serif";
const SAKURA_BODY_FONT = "'Nunito', 'Plus Jakarta Sans', sans-serif";

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  forceShow = false,
  autoShowOnMount = true,
}) => {
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true;
    return autoShowOnMount;
  });
  const [fading, setFading] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Replay whenever forceShow turns true
  useEffect(() => {
    if (forceShow) {
      setFading(false);
      setVisible(true);
    }
  }, [forceShow]);

  const handleDismiss = () => {
    if (fading) return;
    playDeskClick();
    setFading(true);
    window.setTimeout(() => {
      setVisible(false);
      setFading(false);
      sessionStorage.setItem('hasSeenDeskIntro', 'true');
      onCompleteRef.current?.();
    }, 260);
  };

  // Allow Enter or Space to continue as well as tapping/clicking anywhere
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fading]);

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      role="button"
      tabIndex={0}
      aria-label="Tap anywhere to enter Personal Time Tracker"
      style={{ fontFamily: SAKURA_BODY_FONT }}
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-[#09090b] cursor-pointer transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Ambient Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_65%)] pointer-events-none" />

      <div className="text-center px-6 max-w-xl relative select-none">
        {/* Geometric Monogram */}
        <div className="mx-auto mb-7 w-12 h-12 rounded-xl bg-[#111114] border border-zinc-800 flex items-center justify-center shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-4 h-4 border-2 border-emerald-400 rotate-45 rounded-xs" />
        </div>

        {/* Fixed Sakura Serif Wordmark */}
        <h1
          style={{ fontFamily: SAKURA_SERIF_FONT, letterSpacing: '-0.015em' }}
          className="text-3xl sm:text-5xl font-semibold text-white animate-in fade-in slide-in-from-bottom-2 duration-700"
        >
          Personal Time Tracker
        </h1>

        {/* Fine single emerald hairline divider */}
        <div className="my-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-in zoom-in-x duration-700" />

        {/* Fixed Sakura Serif Subtitle */}
        <p
          style={{ fontFamily: SAKURA_SERIF_FONT, letterSpacing: '0.06em' }}
          className="text-sm sm:text-base font-medium text-emerald-400 animate-in fade-in slide-in-from-bottom-3 duration-700"
        >
          The Honest Desk Accounting System
        </p>

        <p
          style={{ fontFamily: SAKURA_BODY_FONT }}
          className="mt-3 text-xs text-zinc-400 tracking-wide"
        >
          Focus · Habits · Sleep · Achievements · Accountability
        </p>

        <span
          style={{ fontFamily: SAKURA_SERIF_FONT, letterSpacing: '0.08em' }}
          className="inline-block mt-10 px-5 py-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 text-xs font-medium uppercase text-emerald-300 animate-pulse"
        >
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
};
