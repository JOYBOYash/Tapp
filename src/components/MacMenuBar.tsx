import { useState, useEffect } from 'react';
import { TimerStatus, VisualPreset } from '../types/timer';
import { Wifi, Battery, Command, Info, RotateCcw, Power, Play, Pause, Square, ExternalLink } from 'lucide-react';

interface MacMenuBarProps {
  timer: ReturnType<typeof import('../hooks/useTimer').useTimer>;
  onToggleWindow: () => void;
  isWindowVisible: boolean;
}

export default function MacMenuBar({ timer, onToggleWindow, isWindowVisible }: MacMenuBarProps) {
  const { state, remaining, startTimer, pauseTimer, resumeTimer, stopTimer, setVisualPreset, playClickSound } = timer;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Keep digital system clock synced to actual local time
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatSystemTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatSystemDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMenuletClick = () => {
    playClickSound();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-6.5 bg-[#ffffff]/10 dark:bg-black/15 backdrop-blur-xl border-b border-white/10 dark:border-white/5 flex items-center justify-between px-4 z-[9999] text-white text-[12px] font-sans">
      {/* Left Menu Items */}
      <div className="flex items-center gap-4.5">
        {/* Apple icon */}
        <button 
          onClick={() => { playClickSound(); alert("Tapp — Simulating Apple macOS System Options."); }}
          className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-all active:scale-95"
        >
          
        </button>
        {/* Tapp menu entry and basic native apps menu */}
        <button 
          onClick={handleMenuletClick}
          className="font-bold hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-all text-slate-100"
        >
          Tapp
        </button>
        <span className="hidden sm:inline-block opacity-45 select-none font-light">|</span>
        <button className="hidden sm:inline-block opacity-85 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">File</button>
        <button className="hidden sm:inline-block opacity-85 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">Edit</button>
        <button className="hidden sm:inline-block opacity-85 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">Timer</button>
        <button className="hidden sm:inline-block opacity-85 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">View</button>
        <button className="hidden sm:inline-block opacity-85 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">Window</button>
      </div>

      {/* Right Menu Status Bar items */}
      <div className="flex items-center gap-3.5">
        <span className="hidden md:flex items-center gap-1 opacity-70">
          <Wifi size={12} />
        </span>
        <span className="hidden md:flex items-center gap-1 opacity-70">
          <span className="text-[10px] font-mono">100%</span>
          <Battery size={13} className="text-emerald-400 fill-emerald-400" />
        </span>

        {/* Tapp Dynamic Menulet Indicator */}
        <div className="relative">
          <button
            onClick={handleMenuletClick}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all ${
              state.status === 'running' 
                ? 'bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-sm' 
                : 'hover:bg-white/10 font-medium'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${state.status === 'running' ? 'bg-white animate-pulse' : 'bg-blue-400'}`} />
            <span>{state.status === 'running' ? formatTime(remaining) : 'Tapp'}</span>
          </button>

          {/* Interactive macOS Native-Feeling Menulet Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-7 w-60 bg-[#16161a]/95 backdrop-blur-2xl rounded-lg border border-white/10 shadow-2xl p-2 z-[99999] text-[11px] text-slate-300 flex flex-col gap-1 select-none font-sans animate-fade-in animate-duration-150">
              
              {/* Title section */}
              <div className="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between">
                <span className="font-bold text-white tracking-tight">Tapp Desktop System</span>
                <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
              </div>

              {/* Live Status indicator */}
              <div className="px-2.5 py-2 flex flex-col gap-0.5 bg-white/3 rounded-md m-1">
                <span className="text-slate-400 text-[10px]">Timer Status</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold font-mono tracking-tight text-white tabular-nums">
                    {formatTime(remaining)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    ({state.status})
                  </span>
                </div>
                {/* Micro Progress bar */}
                <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    style={{ width: `${((state.duration - remaining) / state.duration) * 100}%` }}
                    className="h-full bg-blue-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Menu Actions */}
              <div className="flex flex-col gap-0.5 py-1">
                {state.status === 'running' ? (
                  <button
                    onClick={() => { pauseTimer(); setIsMenuOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-600 hover:text-white rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Pause size={10} fill="currentColor" /> Pause Focus Timer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (state.status === 'paused') {
                        resumeTimer();
                      } else {
                        startTimer();
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-600 hover:text-white rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Play size={10} fill="currentColor" /> {state.status === 'paused' ? 'Resume Session' : 'Start Focus Timer'}
                  </button>
                )}

                {state.status !== 'idle' && (
                  <button
                    onClick={() => { stopTimer(); setIsMenuOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-red-600 hover:text-white rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Square size={10} fill="currentColor" /> Stop Focus Session
                  </button>
                )}

                <span className="h-[1px] bg-white/5 my-1" />

                <button
                  onClick={() => { playClickSound(); onToggleWindow(); setIsMenuOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-white/10 rounded flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Info size={11} />
                    {isWindowVisible ? 'Hide Tapp Interface' : 'Show Tapp Interface'}
                  </span>
                  <span className="text-slate-500 font-mono text-[9px]">⌘H</span>
                </button>

                {/* Sub-menu: Change Visual Presets */}
                <div className="px-2.5 py-1.5 text-slate-500 font-bold uppercase text-[9px] tracking-wider mt-1 shrink-0">
                  Visual Mode Style
                </div>
                {(['ring', 'ambient-glow', 'physical-sand', 'pie-slice'] as VisualPreset[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { setVisualPreset(p); setIsMenuOpen(false); }}
                    className={`w-full text-left px-4 py-1 hover:bg-white/10 rounded flex items-center gap-2 cursor-pointer capitalize ${state.selectedVisual === p ? 'text-blue-400 font-semibold' : ''}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${state.selectedVisual === p ? 'bg-blue-400' : 'bg-transparent'}`} />
                    {p.replace('-', ' ')}
                  </button>
                ))}

                <span className="h-[1px] bg-white/5 my-1" />

                <button
                  onClick={() => {
                    playClickSound();
                    setIsMenuOpen(false);
                    alert("Tapp physical timer client closed safely.");
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/80 hover:text-red-300 rounded flex items-center gap-2 cursor-pointer text-red-400"
                >
                  <Power size={11} />
                  Quit Tapp Utility
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Date and Time clocks */}
        <span className="font-medium hover:bg-white/10 px-1.5 py-0.5 rounded cursor-default">
          {formatSystemDate(currentTime)}
        </span>
        <span className="font-medium tracking-tight font-mono tabular-nums hover:bg-white/10 px-1.5 py-0.5 rounded cursor-default">
          {formatSystemTime(currentTime)}
        </span>
      </div>
    </div>
  );
}
