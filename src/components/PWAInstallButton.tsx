import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2 px-4 text-xs font-semibold text-white shadow-md transition-colors cursor-pointer"
      >
        <Download size={13} />
        Install Tapp Utility
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 py-2 px-4 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        >
          <Download size={13} />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-neutral-900 border border-white/10 p-5 shadow-2xl flex flex-col relative text-left">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
              
              <h3 className="text-sm font-bold text-white mb-2">Install Tapp on iOS</h3>
              <p className="text-xs text-slate-300 leading-relaxed space-y-2">
                1. Tap the <strong className="text-blue-400">Share</strong> button in the Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-blue-400">Add to Home Screen</strong>.
              </p>
              
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15 text-white py-1.5 text-xs font-semibold transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
