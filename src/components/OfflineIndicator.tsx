import { CheckCircle2, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => setShowReconnectedBanner(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnectedBanner) {
    return (
      <div className="w-full bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-1.5 text-xs font-mono text-emerald-200 flex items-center justify-center gap-2 animate-in fade-in duration-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Network active · All desk records stored safely in local IndexedDB</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="w-full bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 text-xs font-mono text-amber-200 flex items-center justify-center gap-2 animate-in fade-in duration-200">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Offline Desktop Mode:</strong> Zero internet required. All timers, habits, achievements, and quotas save directly to local IndexedDB.
        </span>
      </div>
    );
  }

  return null;
};
