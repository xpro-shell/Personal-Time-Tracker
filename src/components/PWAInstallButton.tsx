import { Check, Download, Monitor, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isWindows, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
        <Check className="w-3.5 h-3.5" />
        <span>Desktop App Active</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-all shadow-sm hover:border-zinc-500 whitespace-nowrap cursor-pointer group"
        title="Install Personal Time Tracker on Windows (Chrome / Edge) for offline desk use"
      >
        <Monitor className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">Install App</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700/50 hidden md:inline">
          {isWindows ? 'Windows' : 'PWA'}
        </span>
      </button>

      {/* Windows Chrome & Edge Installation Guidance Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141416] border border-zinc-800 rounded-xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Install as Windows Desktop App
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Chrome & Edge • Works 100% Offline
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              You can install this tracker as a native standalone desktop app on Windows with full offline support and taskbar pinning:
            </p>

            <div className="space-y-2.5 text-xs font-mono mb-5">
              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-amber-400 font-semibold block mb-0.5">Google Chrome (Windows):</span>
                <span className="text-zinc-300">
                  1. Look for the <span className="text-white font-bold">[⊞ Install]</span> icon on the right side of the URL address bar.
                  <br />
                  2. Or click the top-right <span className="text-white font-bold">⋮ Menu</span> → <span className="text-white font-bold">"Cast, save, and share"</span> → <span className="text-white font-bold">"Install Personal Time Tracker"</span>.
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-blue-400 font-semibold block mb-0.5">Microsoft Edge (Windows):</span>
                <span className="text-zinc-300">
                  1. Look for the <span className="text-white font-bold">[App available]</span> icon in the address bar.
                  <br />
                  2. Or click <span className="text-white font-bold">··· Menu</span> → <span className="text-white font-bold">Apps</span> → <span className="text-white font-bold">"Install this site as an app"</span>.
                </span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-400 mb-4 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Offline-ready:</strong> All application code, fonts, audio cues, and local data are cached via Service Worker. You can launch and use the desk timer even when completely disconnected from the internet.
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
