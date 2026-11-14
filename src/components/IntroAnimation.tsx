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
      {/* Subtle Single Emerald Ambient Studio Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_65%)] pointer-events-none" />

      <div className="text-center px-6 max-w-xl relative select-none">
        {/* Geometric Monogram */}
        <div className="mx-auto mb-7 w-12 h-12 rounded-xl bg-[#111114] border border-zinc-800 flex items-center justify-center shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-4 h-4 border-2 border-emerald-400 rotate-45 rounded-xs" />
        </div>

        {/* Editorial Luxury Wordmark */}
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-white animate-in fade-in slide-in-from-bottom-2 duration-700">
          Personal Time Tracker
        </h1>

        {/* Fine single emerald hairline divider */}
        <div className="my-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-in zoom-in-x duration-700" />

        {/* Scandinavian Minimal Subtitle */}
        <p className="label-scandi text-emerald-400 animate-in fade-in slide-in-from-bottom-3 duration-1000">
          The Honest Desk Accounting System
        </p>

        <p className="mt-3 text-xs font-sans text-zinc-400 tracking-wide">
          Focus · Habits · Sleep · Achievements · Accountability
        </p>

        <span className="block mt-10 label-scandi text-zinc-600">
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
};
