import { useState } from 'react';
import { TimerStatus } from '../types/timer';
import { AppWindow, Compass, Terminal, Sliders, Calendar, Play, Pause, Square } from 'lucide-react';

interface MacDockProps {
  status: TimerStatus;
  sessionCount: number;
  remainingTimeFormatted: string;
  onTappClick: () => void;
  isWindowVisible: boolean;
  playClickSound: () => void;
}

export default function MacDock({
  status,
  sessionCount,
  remainingTimeFormatted,
  onTappClick,
  isWindowVisible,
  playClickSound,
}: MacDockProps) {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const todayDay = new Date().getDate();

  const dockApps = [
    {
      id: 'finder',
      name: 'Finder',
      icon: <AppWindow size={24} className="text-blue-400" />,
      action: () => alert('Finder: Exploring mock system directories.'),
    },
    {
      id: 'safari',
      name: 'Safari',
      icon: <Compass size={24} className="text-blue-500" />,
      action: () => alert('Safari: Browsing the physical web.'),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: (
        <div className="relative flex flex-col items-center justify-center w-8 h-8 rounded bg-white text-slate-900 border border-slate-300">
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-sm flex items-center justify-center text-[5px] text-white font-bold uppercase">
            {new Date().toLocaleDateString([], { month: 'short' })}
          </div>
          <span className="text-[12px] font-bold mt-1.5 font-sans leading-none">{todayDay}</span>
        </div>
      ),
      action: () => alert('Calendar: Focus schedule is clean.'),
    },
    {
      id: 'terminal',
      name: 'Terminal',
      icon: <Terminal size={24} className="text-slate-200" />,
      action: () => alert('Terminal: Type "help" or focus with Tapp.'),
    },
    {
      id: 'preferences',
      name: 'System Preferences',
      icon: <Sliders size={24} className="text-slate-400" />,
      action: () => alert('System Preferences: All metrics nominal.'),
    },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-14 px-4 bg-white/10 dark:bg-black/15 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl flex items-end gap-3.5 pb-1.5 z-[999] shadow-2xl">
      {/* Native App Icons */}
      {dockApps.map((app) => (
        <div
          key={app.id}
          className="relative group flex flex-col items-center select-none"
          onMouseEnter={() => setHoveredApp(app.id)}
          onMouseLeave={() => setHoveredApp(null)}
        >
          {/* Tooltip Label */}
          {hoveredApp === app.id && (
            <div className="absolute -top-9 px-2 py-0.5 bg-black/85 text-[10px] text-white rounded border border-white/10 font-sans tracking-tight whitespace-nowrap shadow-md animate-fade-in animate-duration-100">
              {app.name}
            </div>
          )}

          {/* Icon frame */}
          <button
            onClick={() => {
              playClickSound();
              app.action();
            }}
            className="w-10 h-10 rounded-xl bg-[#2a2a30]/35 hover:bg-[#3e3e46]/60 border border-white/5 flex items-center justify-center transition-all duration-150 hover:-translate-y-1.5 active:scale-90 cursor-pointer"
          >
            {app.icon}
          </button>
        </div>
      ))}

      {/* Separator Line */}
      <div className="w-[1px] h-10 bg-white/10 dark:bg-white/5 mb-1 shrink-0 self-center" />

      {/* Tapp Main App Dock Entry */}
      <div
        className="relative group flex flex-col items-center select-none"
        onMouseEnter={() => setHoveredApp('tapp')}
        onMouseLeave={() => setHoveredApp(null)}
      >
        {/* Tooltip with timer preview */}
        {hoveredApp === 'tapp' && (
          <div className="absolute -top-9 px-2 py-0.5 bg-black/85 text-[10px] text-white rounded border border-white/10 font-sans tracking-tight whitespace-nowrap shadow-md">
            Tapp {status === 'running' ? `(${remainingTimeFormatted})` : `(${status})`}
          </div>
        )}

        {/* The beautiful tactile Tapp Icon */}
        <button
          onClick={() => {
            playClickSound();
            onTappClick();
          }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
            isWindowVisible 
              ? 'bg-blue-600 border border-blue-500 hover:bg-blue-500 shadow-md shadow-blue-500/10' 
              : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'
          } hover:-translate-y-1.5 active:scale-95`}
        >
          {/* Beautiful circular minimalist watch indicator inside the icon */}
          <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center relative bg-black/20">
            {status === 'running' ? (
              <div className="w-1 h-2 bg-blue-300 rounded-full animate-bounce" />
            ) : status === 'paused' ? (
              <Pause size={8} fill="currentColor" className="text-amber-400" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            )}
            
            {/* Spinning active ring inside the icon */}
            {status === 'running' && (
              <div className="absolute inset-0 rounded-full border border-blue-400/80 animate-spin border-t-transparent border-r-transparent" />
            )}
          </div>

          {/* Session Count active notification badge */}
          {sessionCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-[#ff3b30] border border-white/20 text-white text-[9px] font-bold font-mono h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-md animate-bounce">
              {sessionCount}
            </div>
          )}
        </button>

        {/* Small Active indicator dot under the dock icon, matching macOS */}
        <div className={`w-1 h-1 rounded-full transition-all mt-1 ${isWindowVisible ? 'bg-white' : 'bg-white/20 scale-75'}`} />
      </div>
    </div>
  );
}
