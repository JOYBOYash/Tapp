import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, LoaderCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  const handleInstall = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    setInstallMessage(null);
    try {
      const accepted = await install();
      setInstallMessage(accepted ? 'Tapp is ready to install.' : 'Installation was dismissed. You can try again.');
    } catch {
      setInstallMessage('Could not open the install prompt. Please use your browser menu to install Tapp.');
    } finally {
      setIsInstalling(false);
    }
  };

  // If already running as installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          aria-busy={isInstalling}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-75 disabled:cursor-wait py-2 px-4 text-xs font-semibold text-white shadow-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
        >
          {isInstalling ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
          <span>{isInstalling ? 'Opening install prompt…' : 'Install Tapp Utility'}</span>
        </button>
        {installMessage && (
          <p role="status" className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            {installMessage.startsWith('Could not') ? <AlertCircle size={13} className="mt-0.5 shrink-0" /> : installMessage.startsWith('Tapp') ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" /> : null}
            <span>{installMessage}</span>
          </p>
        )}
      </div>
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
