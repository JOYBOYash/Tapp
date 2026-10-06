import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-semibold text-white shadow-xl border border-amber-500/25 animate-fade-in">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <WifiOff size={11} />
      <span>Offline Mode — Cached data is in use</span>
    </div>
  );
}
