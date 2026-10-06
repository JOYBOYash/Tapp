/**
 * Tapp — Progressive Web App main shell
 */

import { useState, useEffect, useRef } from 'react';
import { useTimer } from './hooks/useTimer';
import { VisualPreset } from './types/timer';
import PWAInstallButton from './components/PWAInstallButton';
import OfflineIndicator from './components/OfflineIndicator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  X, 
  Volume2, 
  VolumeX, 
  History, 
  Trash2, 
  Sparkles, 
  Check, 
  Sun, 
  Moon, 
  Monitor,
  Fingerprint
} from 'lucide-react';

export default function App() {
  const timer = useTimer();
  const {
    state,
    config,
    remaining,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setDuration,
    setVisualPreset,
    clearHistory,
    updateConfig,
    playClickSound,
  } = timer;

  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(config.defaultDuration || 25);

  // Sync customMinutes with config.defaultDuration on first load
  useEffect(() => {
    if (config.defaultDuration) {
      setCustomMinutes(config.defaultDuration);
    }
  }, [config.defaultDuration]);

  // Handle Dark / Light / System Theme classes on document element
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      root.classList.remove('dark');

      if (config.theme === 'dark') {
        root.classList.add('dark');
      } else if (config.theme === 'light') {
        // Light mode is default
      } else if (config.theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        }
      }
    };

    applyTheme();

    if (config.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [config.theme]);

  // Format Helper
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressRatio = Math.min(1, Math.max(0, (state.duration - remaining) / state.duration));
  const percentProgress = progressRatio * 100;

  return (
    <div className="min-h-screen w-full bg-[#0f0f12] text-slate-100 flex flex-col items-center justify-between p-4 md:p-8 select-none font-sans overflow-x-hidden safe-area-padding">
      
      {/* Background Calm Ambient Gradients */}
      <div className="absolute inset-0 z-0 bg-[#0c0c0f] pointer-events-none">
        <div className="absolute inset-0 opacity-15 mix-blend-color-dodge filter blur-[100px] scale-110">
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-blue-600 rounded-full animate-pulse transition-all duration-[8000ms]" />
          <div className="absolute bottom-1/3 right-1/4 w-[35vw] h-[35vh] bg-indigo-500 rounded-full transition-all duration-[6000ms]" />
        </div>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* Main Core View Area */}
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col justify-between py-6">
        
        {/* Top Header - App Title and Settings Icon */}
        <header className="flex items-center justify-between w-full shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <span className="text-[10px] font-bold">T</span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Tapp</span>
          </div>
          
          <button
            onClick={() => { playClickSound(); setShowSettings(true); }}
            className="p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-slate-400 hover:text-white"
            title="Open Preferences"
          >
            <Settings size={18} />
          </button>
        </header>

        {/* Dynamic Center Space - Timer Visual Face */}
        <main className="flex-1 flex flex-col items-center justify-center py-8">
          {state.status === 'completed' ? (
            /* COMPLETION VIEW */
            <div className="flex flex-col items-center justify-center text-center space-y-5 animate-fade-in py-6">
              <div className="w-18 h-18 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative animate-bounce">
                <Sparkles size={24} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                <Check size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Focus Session Complete</h3>
                <p className="text-xs text-slate-400 max-w-[240px]">Outstanding physical focus. Time well crafted.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Session Streak</span>
                <span className="text-xl font-bold font-mono tracking-tight text-white">{state.sessionCount} Completed</span>
              </div>
              <button
                onClick={resetTimer}
                className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                Start Fresh Session
              </button>
            </div>
          ) : (
            /* ACTIVE COUNTDOWN OR SETUP VIEW */
            <div className="w-full flex flex-col items-center gap-10">
              
              {/* Core Visual Presets */}
              <div className="relative flex items-center justify-center w-52 h-52">
                
                {/* 1. RING PRESET */}
                {state.selectedVisual === 'ring' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="104"
                        cy="104"
                        r="90"
                        className="stroke-white/5 dark:stroke-white/3"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <circle
                        cx="104"
                        cy="104"
                        r="90"
                        className="stroke-blue-500 transition-all duration-300"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 90}
                        strokeDashoffset={2 * Math.PI * 90 * progressRatio}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold tracking-tight font-mono tabular-nums text-white">
                        {formatTime(remaining)}
                      </span>
                      {state.status !== 'idle' && (
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                          {state.status}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. AMBIENT GLOW PRESET */}
                {state.selectedVisual === 'ambient-glow' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div 
                      style={{
                        opacity: state.status === 'running' ? 0.35 + (1 - progressRatio) * 0.45 : 0.2,
                        transform: `scale(${1.0 + (1 - progressRatio) * 0.2})`
                      }}
                      className="absolute w-40 h-40 rounded-full bg-blue-500/50 filter blur-3xl transition-all duration-700 animate-pulse"
                    />
                    <div className="relative w-36 h-36 rounded-full bg-black/10 dark:bg-white/2 border border-white/10 flex flex-col items-center justify-center z-10 shadow-inner">
                      <span className="text-3xl font-bold tracking-tight font-mono tabular-nums text-white">
                        {formatTime(remaining)}
                      </span>
                      {state.status === 'running' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 animate-ping" />
                      )}
                    </div>
                  </div>
                )}

                {/* 3. PHYSICAL SAND (HOURGLASS) PRESET */}
                {state.selectedVisual === 'physical-sand' && (
                  <div className="relative flex flex-col items-center gap-1.5 w-32 h-48 justify-center">
                    {/* Top Bulb */}
                    <div className="w-16 h-14 bg-white/5 border border-white/10 rounded-t-2xl rounded-b-sm overflow-hidden relative flex items-end justify-center">
                      <div 
                        style={{ height: `${(1 - progressRatio) * 100}%` }}
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-600/40 transition-all duration-1000 origin-bottom"
                      />
                    </div>
                    {/* Trickling neck */}
                    <div className="w-4 h-2 flex justify-center items-center relative overflow-visible z-10">
                      {state.status === 'running' && (
                        <div className="w-0.5 h-16 bg-blue-400 absolute top-0 -bottom-12 animate-pulse shadow-md" />
                      )}
                      <div className="w-2 h-1 bg-neutral-600 rounded-sm" />
                    </div>
                    {/* Bottom Bulb */}
                    <div className="w-16 h-14 bg-white/5 border border-white/10 rounded-b-2xl rounded-t-sm overflow-hidden relative flex items-end justify-center">
                      <div 
                        style={{ height: `${progressRatio * 100}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-500 transition-all duration-1000 origin-bottom"
                      />
                      {state.status === 'running' && (
                        <div className="absolute bottom-0 w-3 h-3 bg-blue-300 rounded-full filter blur-sm animate-ping" />
                      )}
                    </div>
                    {/* Floating Numeric Time Badge */}
                    <div className="absolute bg-[#16161a]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs font-mono tabular-nums text-white z-20">
                      {formatTime(remaining)}
                    </div>
                  </div>
                )}

                {/* 4. PIE SLICE PRESET */}
                {state.selectedVisual === 'pie-slice' && (
                  <div className="relative w-full h-full flex items-center justify-center p-3">
                    <div className="absolute inset-0 rounded-full border border-white/5 p-1 bg-black/10">
                      <div 
                        style={{
                          background: `conic-gradient(var(--color-accent) ${progressRatio * 360}deg, transparent ${progressRatio * 360}deg)`
                        }}
                        className="w-full h-full rounded-full transition-all duration-300 rotate-180 opacity-70"
                      />
                    </div>
                    <div className="z-10 bg-[#0f0f12]/95 px-3 py-1.5 rounded-full border border-white/10 text-sm font-semibold font-mono tabular-nums text-white">
                      {formatTime(remaining)}
                    </div>
                  </div>
                )}

              </div>

              {/* Core Controller Buttons (Start / Pause / Reset) */}
              <div className="w-full flex flex-col items-center gap-6 shrink-0 px-2">
                
                {/* Visual Timer Controls */}
                {state.status === 'idle' || state.status === 'stopped' ? (
                  <button
                    onClick={() => startTimer(customMinutes * 60 * 1000)}
                    className="w-full max-w-[260px] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={14} fill="currentColor" /> Start Focus Session
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full max-w-[260px]">
                    {state.status === 'running' ? (
                      <button
                        onClick={pauseTimer}
                        className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                      >
                        <Pause size={12} fill="currentColor" /> Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeTimer}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                      >
                        <Play size={12} fill="currentColor" /> Resume
                      </button>
                    )}
                    <button
                      onClick={stopTimer}
                      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                    >
                      <RotateCcw size={12} /> Stop
                    </button>
                  </div>
                )}

                {/* Duration Picker slider / Presets (only in setup state) */}
                {(state.status === 'idle' || state.status === 'stopped') && (
                  <div className="w-full space-y-4 animate-fade-in max-w-[280px]">
                    
                    {/* Quick minute pill presets */}
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
                      {[5, 15, 25, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            setCustomMinutes(mins);
                            setDuration(mins);
                          }}
                          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer border ${
                            customMinutes === mins
                              ? 'tapp-accent-tint border-blue-500/20 font-bold'
                              : 'bg-white/5 border-transparent hover:bg-white/10'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    {/* Fluid manual slider */}
                    <div className="flex flex-col gap-1.5 px-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-mono">
                        <span>Duration</span>
                        <span>{customMinutes} minutes</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="120"
                        value={customMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setCustomMinutes(val);
                          setDuration(val);
                        }}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}
        </main>

        {/* Quiet Footer Metadata - Zero pills, unboxed, minimal layout */}
        <footer className="w-full flex justify-center items-center gap-2 text-xs text-slate-500 mt-auto pt-4 shrink-0 font-sans">
          <span>Tapp Focus</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span>Offline Capable</span>
          {state.sessionCount > 0 && (
            <>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span>{state.sessionCount} Completed</span>
            </>
          )}
        </footer>

      </div>

      {/* SIDEBAR PREFERENCES MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#16161a] border border-white/10 p-5 shadow-2xl flex flex-col gap-4 text-left relative max-h-[85vh] overflow-y-auto">
            
            {/* Close Settings */}
            <button
              onClick={() => { playClickSound(); setShowSettings(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-white tracking-tight">Tapp Preferences</h3>

            {/* PWA Direct Installation Banner */}
            <div className="py-1">
              <PWAInstallButton />
            </div>

            {/* Option 1: Visual Preset selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Visual Representation</label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                {(['ring', 'ambient-glow', 'physical-sand', 'pie-slice'] as VisualPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setVisualPreset(p)}
                    className={`py-1.5 px-2.5 font-semibold capitalize rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                      state.selectedVisual === p
                        ? 'bg-blue-600 text-white font-bold'
                        : 'opacity-60 hover:opacity-100 hover:bg-white/5'
                    }`}
                  >
                    {p.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Option 2: Themes */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Appearance theme</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                {(['system', 'light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateConfig({ theme: t })}
                    className={`py-1.5 rounded-lg font-semibold capitalize flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      config.theme === t
                        ? 'bg-blue-600 text-white font-bold'
                        : 'opacity-60 hover:opacity-100 hover:bg-white/5'
                    }`}
                  >
                    {t === 'light' && <Sun size={11} />}
                    {t === 'dark' && <Moon size={11} />}
                    {t === 'system' && <Monitor size={11} />}
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Option 3: Sound preferences */}
            <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-xl border border-white/5 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-200">Audio Chimes</span>
                <span className="text-[10px] text-slate-500">Play tranquil chimes when timer completes</span>
              </div>
              <button
                onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${config.soundEnabled ? 'bg-blue-600' : 'bg-neutral-600'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${config.soundEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Option 4: Session History logs */}
            <div className="flex-1 flex flex-col border-t border-white/5 pt-3 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs shrink-0">
                <span className="font-bold text-slate-400">Activity History</span>
                {state.history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer border border-red-500/25 px-2 py-0.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[160px] pr-1 space-y-1.5">
                {state.history.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-1 opacity-50 shrink-0">
                    <History size={16} />
                    <span className="text-[10px]">No recorded focus sessions yet</span>
                  </div>
                ) : (
                  <div className="space-y-1 shrink-0">
                    {state.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-[10px]"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">
                            {Math.round(entry.duration / 60000)}m Focus session
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(entry.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                            entry.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                              : 'bg-red-500/10 text-red-400 border-red-500/15'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Offline Alert Badge */}
      <OfflineIndicator />

    </div>
  );
}
