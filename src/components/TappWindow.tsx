import React, { useState, useEffect, useRef } from 'react';
import { TimerStatus, VisualPreset, TappConfig, TimerState } from '../types/timer';
import { Play, Pause, Square, RotateCcw, Settings, History, Clock, Sliders, Volume2, VolumeX, Shield, Minimize2, Maximize2, Sparkles, Check, Trash2, Moon, Sun, Monitor } from 'lucide-react';

interface TappWindowProps {
  timer: ReturnType<typeof import('../hooks/useTimer').useTimer>;
  onClose?: () => void;
  isWidgetMode?: boolean;
}

export default function TappWindow({ timer, isWidgetMode = false }: TappWindowProps) {
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

  const [activeTab, setActiveTab] = useState<'timer' | 'history' | 'settings'>('timer');
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  
  // Ref for mouse dragging
  const windowRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 100, y: 120 }); // initial coordinates
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });

  // Handle free dragging on the simulated desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking buttons or input controls
    if ((e.target as HTMLElement).closest('button, input, select, a')) {
      return;
    }
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    windowStartPos.current = { x: dragOffset.x, y: dragOffset.y };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      // Calculate new position
      const newX = windowStartPos.current.x + dx;
      const newY = windowStartPos.current.y + dy;
      
      // Boundaries check to keep inside simulated desktop
      const boundedX = Math.max(10, Math.min(window.innerWidth - 300, newX));
      const boundedY = Math.max(50, Math.min(window.innerHeight - 300, newY));

      setDragOffset({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Positioning based on config
  useEffect(() => {
    if (typeof config.windowPosition === 'string') {
      const padding = 24;
      const rect = windowRef.current?.getBoundingClientRect();
      const winW = rect?.width || 320;
      const winH = rect?.height || 420;

      if (config.windowPosition === 'top-right') {
        setDragOffset({ x: window.innerWidth - winW - padding, y: 64 });
      } else if (config.windowPosition === 'top-left') {
        setDragOffset({ x: padding, y: 64 });
      } else if (config.windowPosition === 'bottom-right') {
        setDragOffset({ x: window.innerWidth - winW - padding, y: window.innerHeight - winH - 90 });
      } else if (config.windowPosition === 'center') {
        setDragOffset({ x: (window.innerWidth - winW) / 2, y: (window.innerHeight - winH) / 2 });
      }
    }
  }, [config.windowPosition]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (state.status === 'running') {
            pauseTimer();
          } else if (state.status === 'paused') {
            resumeTimer();
          } else if (state.status === 'idle' || state.status === 'stopped') {
            startTimer();
          }
          break;
        case 'KeyR':
          if (e.shiftKey) {
            resetTimer();
          } else {
            stopTimer();
          }
          break;
        case 'KeyV':
          // Cycle visual presets
          const presets: VisualPreset[] = ['ring', 'ambient-glow', 'physical-sand', 'pie-slice'];
          const currentIndex = presets.indexOf(state.selectedVisual);
          const nextIndex = (currentIndex + 1) % presets.length;
          setVisualPreset(presets[nextIndex]);
          break;
        case 'Escape':
          if (state.status === 'completed') {
            resetTimer();
          }
          break;
        case 'KeyF':
          updateConfig({ frameless: !config.frameless });
          break;
        case 'Digit1':
          updateConfig({ windowSize: 'mini' });
          break;
        case 'Digit2':
          updateConfig({ windowSize: 'compact' });
          break;
        case 'Digit3':
          updateConfig({ windowSize: 'standard' });
          break;
        case 'Digit4':
          updateConfig({ windowSize: 'wide' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, state.selectedVisual, config.frameless, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer, setVisualPreset, updateConfig]);

  // Format Helper
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentProgress = ((state.duration - remaining) / state.duration) * 100;
  const progressRatio = Math.min(1, Math.max(0, (state.duration - remaining) / state.duration));

  // Determine App Width/Height based on window size presets
  const sizeClasses = {
    mini: 'w-[200px] h-[200px]',
    compact: 'w-[260px] h-[340px]',
    standard: 'w-[320px] h-[450px]',
    wide: 'w-[420px] h-[450px]',
  };

  return (
    <div
      ref={windowRef}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        zIndex: config.alwaysOnTop ? 999 : 50,
        opacity: state.status === 'completed' ? 1 : Math.max(0.4, config.translucency),
      }}
      className={`absolute select-none overflow-hidden transition-all duration-200 ease-out ${
        sizeClasses[config.windowSize]
      } tapp-canvas border-2 border-white/10 dark:border-white/5 shadow-2xl flex flex-col`}
    >
      {/* Title Bar (with Apple Traffic Lights) */}
      {!config.frameless && (
        <div
          onMouseDown={handleMouseDown}
          className="h-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0"
        >
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 group">
            <button
              onClick={() => {
                playClickSound();
                resetTimer();
                stopTimer();
              }}
              title="Reset"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] relative flex items-center justify-center text-[8px] font-bold text-red-900/0 hover:text-red-950 transition-colors"
            >
              ×
            </button>
            <button
              onClick={() => {
                playClickSound();
                updateConfig({ windowSize: config.windowSize === 'mini' ? 'standard' : 'mini' });
              }}
              title="Minimize to Widget"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] relative flex items-center justify-center text-[8px] font-bold text-yellow-900/0 hover:text-yellow-950 transition-colors"
            >
              -
            </button>
            <button
              onClick={() => {
                playClickSound();
                updateConfig({ frameless: !config.frameless });
              }}
              title="Toggle Frameless"
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] relative flex items-center justify-center text-[8px] font-bold text-green-900/0 hover:text-green-950 transition-colors"
            >
              +
            </button>
          </div>

          {/* Window Title / Context */}
          <span className="text-[11px] font-medium tracking-tight opacity-70">
            {state.status === 'running' ? `Tapp · ${formatTime(remaining)}` : 'Tapp'}
          </span>

          {/* Action Buttons for Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { playClickSound(); setActiveTab('timer'); }}
              className={`p-1 rounded-md transition-colors ${activeTab === 'timer' ? 'bg-black/10 dark:bg-white/10 text-white' : 'opacity-50 hover:opacity-100 text-slate-400'}`}
              title="Timer Home"
            >
              <Clock size={12} />
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('history'); }}
              className={`p-1 rounded-md transition-colors ${activeTab === 'history' ? 'bg-black/10 dark:bg-white/10 text-white' : 'opacity-50 hover:opacity-100 text-slate-400'}`}
              title="Session History"
            >
              <History size={12} />
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('settings'); }}
              className={`p-1 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-black/10 dark:bg-white/10 text-white' : 'opacity-50 hover:opacity-100 text-slate-400'}`}
              title="Tapp Preferences"
            >
              <Settings size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Frame Escape Button for Frameless Window on Hover */}
      {config.frameless && (
        <div className="absolute top-2 left-2 z-50 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => {
              playClickSound();
              updateConfig({ frameless: false });
            }}
            className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
            title="Show window controls"
          >
            <Minimize2 size={10} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-4 relative justify-center">
        {/* TAB 1: TIMER INTERFACE */}
        {activeTab === 'timer' && (
          <div className="flex-1 flex flex-col justify-between items-center py-2 h-full gap-4">
            {state.status === 'completed' ? (
              /* Timer Completed View */
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-2 py-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 relative animate-bounce">
                  <Sparkles size={28} className="absolute -top-1 -right-1 text-yellow-400" />
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Focus Session Complete</h3>
                  <p className="text-xs text-slate-400 mt-1">Outstanding physical focus. Time well crafted.</p>
                </div>
                <div className="bg-black/10 dark:bg-white/5 rounded-lg py-2 px-4 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Total Completed</span>
                  <span className="text-xl font-bold font-mono tracking-tight text-white">{state.sessionCount} Sessions</span>
                </div>
                <button
                  onClick={resetTimer}
                  className="px-4 py-1.5 text-xs font-semibold tapp-accent-bg rounded-md tapp-accent-hover transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Start Fresh Session
                </button>
              </div>
            ) : state.status === 'idle' || state.status === 'stopped' ? (
              /* Timer Setup View */
              <div className="flex-1 flex flex-col justify-between items-center w-full gap-4 py-2">
                {/* Visual Preset Pill Selector (Unboxed Buttons / Tabs Allowed as dynamic controllers) */}
                {config.windowSize !== 'mini' && (
                  <div className="flex items-center gap-0.5 p-1 bg-black/15 dark:bg-white/5 border border-white/5 rounded-lg text-[10px] shrink-0">
                    {(['ring', 'ambient-glow', 'physical-sand', 'pie-slice'] as VisualPreset[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setVisualPreset(p)}
                        className={`px-2 py-1 font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          state.selectedVisual === p
                            ? 'bg-white text-slate-900 shadow-sm font-semibold'
                            : 'opacity-50 hover:opacity-100 text-slate-400'
                        }`}
                      >
                        {p.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Big Ambient Setup Ring or Selection Face */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full border border-dashed border-white/10 flex flex-col items-center justify-center bg-black/5 dark:bg-white/2">
                    <span className="text-3xl font-bold tracking-tight font-mono tabular-nums text-white">
                      {customMinutes}m
                    </span>
                    <span className="text-[10px] opacity-40 mt-1">Ready</span>

                    {/* Ring decoration */}
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-90" />
                  </div>
                </div>

                {/* Custom Quick Minute Selectors */}
                <div className="w-full flex flex-col gap-3">
                  {config.windowSize !== 'mini' && (
                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {[5, 15, 25, 50].map(mins => (
                        <button
                          key={mins}
                          onClick={() => {
                            setCustomMinutes(mins);
                            setDuration(mins);
                          }}
                          className={`py-1 rounded text-xs transition-colors cursor-pointer border ${
                            customMinutes === mins
                              ? 'tapp-accent-tint border-blue-500/20'
                              : 'bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 border-transparent text-slate-300'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual Duration Slider */}
                  {config.windowSize !== 'mini' && (
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
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
                        className="w-full h-1 bg-black/20 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  )}

                  {/* Start CTA */}
                  <button
                    onClick={() => startTimer(customMinutes * 60 * 1000)}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Play size={12} fill="currentColor" /> Start Focus Session
                  </button>
                </div>
              </div>
            ) : (
              /* Active Timer Countdown View */
              <div className="flex-1 flex flex-col justify-between items-center w-full gap-4">
                {/* Physical/Ambient Timer Presentation Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                  
                  {/* PRESET 1: PHYSICAL RING */}
                  {state.selectedVisual === 'ring' && (
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background track */}
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          className="stroke-black/15 dark:stroke-white/5"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          className="stroke-blue-500 transition-all duration-300"
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 68}
                          strokeDashoffset={2 * Math.PI * 68 * progressRatio}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Timer Face */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold tracking-tight font-mono tabular-nums text-white">
                          {formatTime(remaining)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                          {state.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PRESET 2: AMBIENT GLOW */}
                  {state.selectedVisual === 'ambient-glow' && (
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      {/* Ambient Blur Backdrops */}
                      <div 
                        style={{
                          opacity: state.status === 'running' ? 0.3 + (1 - progressRatio) * 0.4 : 0.2,
                          transform: `scale(${1 + (1 - progressRatio) * 0.15})`
                        }}
                        className="absolute w-32 h-32 rounded-full bg-blue-500/50 filter blur-3xl transition-all duration-500 animate-pulse"
                      />
                      <div 
                        style={{
                          opacity: 0.25,
                          transform: `scale(${0.9 + progressRatio * 0.2})`
                        }}
                        className="absolute w-36 h-36 rounded-full bg-indigo-500/40 filter blur-2xl transition-all duration-500"
                      />
                      
                      {/* Core Glowing Orb */}
                      <div className="relative w-28 h-28 rounded-full bg-black/10 dark:bg-white/2 border border-white/10 shadow-inner flex flex-col items-center justify-center z-10">
                        <span className="text-xl font-bold tracking-tight font-mono tabular-nums text-white">
                          {formatTime(remaining)}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 animate-ping" />
                      </div>
                    </div>
                  )}

                  {/* PRESET 3: PHYSICAL SANDGLASS (HOURGLASS) */}
                  {state.selectedVisual === 'physical-sand' && (
                    <div className="relative flex flex-col items-center gap-1 w-24 h-40 justify-center">
                      {/* Upper bulb */}
                      <div className="w-14 h-12 bg-black/20 dark:bg-white/5 border border-white/10 rounded-t-2xl rounded-b-sm overflow-hidden relative flex items-end justify-center">
                        <div 
                          style={{ height: `${(1 - progressRatio) * 100}%` }}
                          className="w-full bg-gradient-to-t from-blue-500/70 to-blue-600/30 transition-all duration-1000 origin-bottom"
                        />
                      </div>
                      
                      {/* Joining neck with sand trickle */}
                      <div className="w-4 h-2 flex justify-center items-center relative overflow-visible z-10">
                        {state.status === 'running' && (
                          <div className="w-0.5 h-12 bg-blue-400 absolute top-0 -bottom-8 animate-pulse shadow-md" />
                        )}
                        <div className="w-2 h-1 bg-neutral-600 rounded-sm" />
                      </div>

                      {/* Lower bulb */}
                      <div className="w-14 h-12 bg-black/20 dark:bg-white/5 border border-white/10 rounded-b-2xl rounded-t-sm overflow-hidden relative flex items-end justify-center">
                        <div 
                          style={{ height: `${progressRatio * 100}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-500/80 transition-all duration-1000 origin-bottom"
                        />
                        {/* Sand piling dust effect */}
                        {state.status === 'running' && (
                          <div className="absolute bottom-0 w-3 h-3 bg-blue-300 rounded-full filter blur-sm animate-ping origin-center" />
                        )}
                      </div>

                      {/* Numeric Time Indicator Overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[11px] font-mono tabular-nums text-white z-20">
                        {formatTime(remaining)}
                      </div>
                    </div>
                  )}

                  {/* PRESET 4: PIE SLICE */}
                  {state.selectedVisual === 'pie-slice' && (
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-white/10 p-1 bg-black/5">
                        <div 
                          style={{
                            background: `conic-gradient(var(--color-accent) ${progressRatio * 360}deg, transparent ${progressRatio * 360}deg)`
                          }}
                          className="w-full h-full rounded-full transition-all duration-300 rotate-180"
                        />
                      </div>
                      {/* Tiny elegant floating badge overlay for time */}
                      <div className="z-10 bg-slate-900/95 dark:bg-black/90 px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold font-mono tabular-nums text-white">
                        {formatTime(remaining)}
                      </div>
                    </div>
                  )}

                </div>

                {/* Sub-label showing progress */}
                {config.windowSize !== 'mini' && (
                  <div className="flex flex-col items-center gap-1 w-full text-center shrink-0">
                    <span className="text-[11px] font-medium opacity-60">Focus Session</span>
                    <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {Math.floor(percentProgress)}% Completed · {formatTime(remaining)} Left
                    </span>
                  </div>
                )}

                {/* Micro Action Buttons */}
                <div className="flex items-center justify-center gap-2 w-full shrink-0">
                  {state.status === 'running' ? (
                    <button
                      onClick={pauseTimer}
                      className="flex-1 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow"
                    >
                      <Pause size={10} fill="currentColor" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeTimer}
                      className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow"
                    >
                      <Play size={10} fill="currentColor" /> Resume
                    </button>
                  )}

                  <button
                    onClick={stopTimer}
                    className="flex-1 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow"
                  >
                    <Square size={10} fill="currentColor" /> Stop
                  </button>

                  {config.windowSize !== 'mini' && (
                    <button
                      onClick={resetTimer}
                      className="p-1.5 rounded bg-black/20 dark:bg-white/5 hover:bg-black/30 dark:hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                      title="Reset completely"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SESSION HISTORY LOG */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col h-full justify-between animate-fade-in text-left">
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-2.5 max-h-[350px]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 shrink-0">
                <span className="text-xs font-semibold text-white">Activity Log</span>
                {state.history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer border border-red-500/20 px-1.5 py-0.5 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>

              {state.history.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-3 bg-black/10 dark:bg-white/2 border border-white/5 rounded-full text-slate-500">
                    <History size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300">No completed sessions</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Your physical time logs will gather here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {state.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded bg-black/15 dark:bg-white/2 border border-white/5 text-[11px]"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200">
                          {Math.round(entry.duration / 60000)}m Session
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(entry.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                          entry.status === 'completed'
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15'
                            : 'bg-red-500/5 text-red-400 border-red-500/15'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/10 dark:bg-white/5 p-2 rounded-lg border border-white/5 flex justify-between items-center mt-3 text-[11px] shrink-0">
              <span className="text-slate-400">Streak Session Count:</span>
              <span className="font-bold font-mono text-white">{state.sessionCount} Completed</span>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM SETTINGS AND CONFIG */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col h-full space-y-3.5 text-left animate-fade-in max-h-[350px] overflow-y-auto">
            <h4 className="text-xs font-semibold text-white border-b border-white/5 pb-1 shrink-0">Preferences</h4>

            {/* Config Block 1: Appearance Mode */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Theme Profile</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/20 dark:bg-white/5 rounded-md border border-white/5">
                {(['system', 'light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateConfig({ theme: t })}
                    className={`py-1 rounded text-[10px] font-medium capitalize flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      config.theme === t
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'light' && <Sun size={8} />}
                    {t === 'dark' && <Moon size={8} />}
                    {t === 'system' && <Monitor size={8} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Config Block 2: App Sizing */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Window Size Preset</label>
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-black/20 dark:bg-white/5 rounded-md border border-white/5">
                {(['mini', 'compact', 'standard', 'wide'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateConfig({ windowSize: size })}
                    className={`py-1 rounded text-[10px] font-medium capitalize cursor-pointer transition-colors ${
                      config.windowSize === size
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Config Block 3: Sliders and Toggles */}
            <div className="space-y-2.5">
              {/* Transparency Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Window Translucency</span>
                  <span className="font-mono text-white">{Math.round(config.translucency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={config.translucency}
                  onChange={(e) => updateConfig({ translucency: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-black/20 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Toggles List */}
              <div className="space-y-2">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-1.5 bg-black/10 dark:bg-white/2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-200">Audio Feedback Chimes</span>
                    <span className="text-[9px] text-slate-500">Play tone on ticks and finish</span>
                  </div>
                  <button
                    onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.soundEnabled ? 'bg-blue-600' : 'bg-neutral-600'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[1px] transition-transform ${config.soundEnabled ? 'right-[1px]' : 'left-[1px]'}`} />
                  </button>
                </div>

                {/* Always on Top */}
                <div className="flex items-center justify-between p-1.5 bg-black/10 dark:bg-white/2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-200">Keep Floating Overlay</span>
                    <span className="text-[9px] text-slate-500">Simulate always-on-top window</span>
                  </div>
                  <button
                    onClick={() => updateConfig({ alwaysOnTop: !config.alwaysOnTop })}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.alwaysOnTop ? 'bg-blue-600' : 'bg-neutral-600'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[1px] transition-transform ${config.alwaysOnTop ? 'right-[1px]' : 'left-[1px]'}`} />
                  </button>
                </div>

                {/* Frameless toggle */}
                <div className="flex items-center justify-between p-1.5 bg-black/10 dark:bg-white/2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-200">Frameless Aesthetic Mode</span>
                    <span className="text-[9px] text-slate-500">Remove native-style titlebar</span>
                  </div>
                  <button
                    onClick={() => updateConfig({ frameless: !config.frameless })}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.frameless ? 'bg-blue-600' : 'bg-neutral-600'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[1px] transition-transform ${config.frameless ? 'right-[1px]' : 'left-[1px]'}`} />
                  </button>
                </div>

                {/* Desktop Position Preset Select */}
                <div className="flex items-center justify-between p-1.5 bg-black/10 dark:bg-white/2 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-200">Dock Snap Position</span>
                    <span className="text-[9px] text-slate-500">Quick positioning presets</span>
                  </div>
                  <select
                    value={typeof config.windowPosition === 'string' ? config.windowPosition : 'custom'}
                    onChange={(e) => updateConfig({ windowPosition: e.target.value })}
                    className="text-[10px] bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-white"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center Space</option>
                    <option value="custom">Custom Drag</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Indicator - Clean Action bar rather than noisy engine tags */}
      {!config.frameless && (
        <div className="h-6 border-t border-black/5 dark:border-white/5 px-4 flex items-center justify-between text-[9px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${state.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
            Status: <span className="capitalize text-slate-400">{state.status}</span>
          </span>
          <span className="opacity-70">
            Sessions: <span className="text-white font-mono">{state.sessionCount}</span>
          </span>
        </div>
      )}
    </div>
  );
}
