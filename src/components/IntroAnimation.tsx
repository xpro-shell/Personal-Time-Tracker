import React, { useEffect, useRef, useState } from 'react';

interface IntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
  autoShowOnMount?: boolean;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  forceShow = false,
  autoShowOnMount = true,
}) => {
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true;
    if (!autoShowOnMount) return false;
    return true;
  });
  const [fading, setFading] = useState(false);

  // Keep latest onComplete in ref so timer isn't reset by parent re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Replay whenever forceShow turns true
  useEffect(() => {
    if (forceShow) {
      setFading(false);
      setVisible(true);
    }
  }, [forceShow]);

  useEffect(() => {
    if (!visible) return;

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1500);

    const closeTimer = setTimeout(() => {
      setVisible(false);
      setFading(false);
      sessionStorage.setItem('hasSeenDeskIntro', 'true');
      onCompleteRef.current?.();
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [visible]);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      setFading(false);
      sessionStorage.setItem('hasSeenDeskIntro', 'true');
      onCompleteRef.current?.();
    }, 220);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] cursor-pointer transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Emerald & Gold Radial Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,rgba(212,175,55,0.05)_35%,transparent_72%)] pointer-events-none" />

      <div className="text-center px-6 max-w-lg relative select-none">
        {/* Geometric Monogram */}
        <div className="mx-auto mb-6 w-12 h-12 rounded-xl bg-zinc-900/90 border border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-950/30 animate-in zoom-in-95 duration-500">
          <div className="w-5 h-5 border-2 border-emerald-400 rotate-45 rounded-sm" />
        </div>

        {/* Wordmark with tracking expansion */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[0.22em] uppercase text-zinc-100 animate-in fade-in slide-in-from-bottom-2 duration-700">
          Personal Time Tracker
        </h1>

        {/* Fine emerald-gold gradient divider line */}
        <div className="my-3.5 mx-auto w-20 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-in zoom-in-x duration-700" />

        {/* Editorial Subtitle */}
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.18em] text-emerald-300/90 animate-in fade-in slide-in-from-bottom-3 duration-1000">
          The Honest Desk Accounting System
        </p>

        <p className="mt-2 text-[10px] font-mono text-zinc-500">
          Focus · Habits · Sleep · Achievements · Accountability
        </p>

        <span className="block mt-8 text-[9px] font-mono text-zinc-600 tracking-wider">
          TAP ANYWHERE TO CONTINUE
        </span>
      </div>
    </div>
  );
};
