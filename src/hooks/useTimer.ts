import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState, TimerStatus, VisualPreset, TimerHistoryEntry, TappConfig } from '../types/timer';

const DEFAULT_DURATION = 25 * 60 * 1000; // 25 minutes in ms

const INITIAL_TIMER_STATE: TimerState = {
  status: 'idle',
  duration: DEFAULT_DURATION,
  startedAt: null,
  pausedAt: null,
  elapsedBeforePause: 0,
  remaining: DEFAULT_DURATION,
  selectedVisual: 'ring',
  sessionCount: 0,
  history: [],
};

const INITIAL_CONFIG: TappConfig = {
  theme: 'system',
  windowSize: 'standard',
  windowPosition: 'top-right',
  alwaysOnTop: true,
  frameless: false,
  translucency: 0.85,
  soundEnabled: true,
  hapticEnabled: true,
  startupEnabled: false,
};

export function useTimer() {
  // Load initial states from localStorage if available
  const [state, setState] = useState<TimerState>(() => {
    try {
      const saved = localStorage.getItem('tapp_timer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean dynamic states to be safe on load (if loaded running, pause it or clean it)
        if (parsed.status === 'running') {
          // If it was running, convert it to paused at the time of reloading to prevent leaps
          return {
            ...parsed,
            status: 'paused',
            pausedAt: Date.now(),
            elapsedBeforePause: parsed.elapsedBeforePause,
            startedAt: null,
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading timer state', e);
    }
    return INITIAL_TIMER_STATE;
  });

  const [config, setConfig] = useState<TappConfig>(() => {
    try {
      const saved = localStorage.getItem('tapp_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading configuration', e);
    }
    return INITIAL_CONFIG;
  });

  // Keep a ref of state to avoid stale closure issues in intervals
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('tapp_timer_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('tapp_config', JSON.stringify(config));
  }, [config]);

  // Derived Values calculated in real-time
  const getDerivedRemaining = useCallback((currentState: TimerState): number => {
    const { status, duration, startedAt, elapsedBeforePause } = currentState;
    if (status === 'idle' || status === 'stopped') {
      return duration;
    }
    if (status === 'completed') {
      return 0;
    }
    if (status === 'paused') {
      const elapsed = elapsedBeforePause;
      return Math.max(0, duration - elapsed);
    }
    if (status === 'running' && startedAt !== null) {
      const elapsed = (Date.now() - startedAt) + elapsedBeforePause;
      return Math.max(0, duration - elapsed);
    }
    return duration;
  }, []);

  // Sync remaining state reactively
  const [liveRemaining, setLiveRemaining] = useState(() => getDerivedRemaining(state));

  // Update liveRemaining on ticks
  useEffect(() => {
    setLiveRemaining(getDerivedRemaining(state));

    if (state.status !== 'running') return;

    let animFrameId: number;
    const tick = () => {
      const currentRemaining = getDerivedRemaining(stateRef.current);
      setLiveRemaining(currentRemaining);

      if (currentRemaining <= 0) {
        // Complete the timer
        setState(prev => {
          const completedEntry: TimerHistoryEntry = {
            id: Math.random().toString(36).substring(2, 9),
            duration: prev.duration,
            startedAt: prev.startedAt || (Date.now() - prev.duration),
            completedAt: Date.now(),
            status: 'completed',
          };
          return {
            ...prev,
            status: 'completed',
            startedAt: null,
            pausedAt: null,
            elapsedBeforePause: prev.duration,
            sessionCount: prev.sessionCount + 1,
            history: [completedEntry, ...prev.history],
          };
        });
        
        // Custom Audio feedback if enabled
        if (config.soundEnabled) {
          playNotificationSound();
        }
      } else {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [state.status, state.duration, getDerivedRemaining, config.soundEnabled]);

  // Player for haptic/audio clicks
  const playClickSound = useCallback(() => {
    if (!config.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio context block bypass
    }
  }, [config.soundEnabled]);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Beautiful triple chime
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(523.25, 0, 0.4); // C5
      playTone(659.25, 0.15, 0.4); // E5
      playTone(783.99, 0.3, 0.6); // G5
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Action Methods
  const startTimer = useCallback((customDuration?: number) => {
    playClickSound();
    setState(prev => {
      const targetDuration = customDuration !== undefined ? customDuration : prev.duration;
      return {
        ...prev,
        status: 'running',
        duration: targetDuration,
        startedAt: Date.now(),
        pausedAt: null,
        elapsedBeforePause: 0,
      };
    });
  }, [playClickSound]);

  const pauseTimer = useCallback(() => {
    playClickSound();
    setState(prev => {
      if (prev.status !== 'running' || prev.startedAt === null) return prev;
      const elapsed = (Date.now() - prev.startedAt);
      return {
        ...prev,
        status: 'paused',
        pausedAt: Date.now(),
        elapsedBeforePause: prev.elapsedBeforePause + elapsed,
        startedAt: null,
      };
    });
  }, [playClickSound]);

  const resumeTimer = useCallback(() => {
    playClickSound();
    setState(prev => {
      if (prev.status !== 'paused') return prev;
      return {
        ...prev,
        status: 'running',
        startedAt: Date.now(),
        pausedAt: null,
      };
    });
  }, [playClickSound]);

  const stopTimer = useCallback(() => {
    playClickSound();
    setState(prev => {
      // Record stopped session to history if some progress was made
      const elapsed = prev.status === 'running' && prev.startedAt 
        ? (Date.now() - prev.startedAt) + prev.elapsedBeforePause 
        : prev.elapsedBeforePause;
      
      const newHistory = [...prev.history];
      if (elapsed > 5000 && (prev.status === 'running' || prev.status === 'paused')) {
        newHistory.unshift({
          id: Math.random().toString(36).substring(2, 9),
          duration: prev.duration,
          startedAt: prev.startedAt || (Date.now() - elapsed),
          completedAt: Date.now(),
          status: 'stopped',
        });
      }

      return {
        ...prev,
        status: 'stopped',
        startedAt: null,
        pausedAt: null,
        elapsedBeforePause: 0,
      };
    });
  }, [playClickSound]);

  const resetTimer = useCallback(() => {
    playClickSound();
    setState(prev => ({
      ...prev,
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      elapsedBeforePause: 0,
    }));
  }, [playClickSound]);

  const setDuration = useCallback((mins: number) => {
    playClickSound();
    const ms = mins * 60 * 1000;
    setState(prev => ({
      ...prev,
      duration: ms,
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      elapsedBeforePause: 0,
    }));
  }, [playClickSound]);

  const setVisualPreset = useCallback((preset: VisualPreset) => {
    playClickSound();
    setState(prev => ({
      ...prev,
      selectedVisual: preset,
    }));
  }, [playClickSound]);

  const clearHistory = useCallback(() => {
    playClickSound();
    setState(prev => ({
      ...prev,
      history: [],
      sessionCount: 0,
    }));
  }, [playClickSound]);

  const updateConfig = useCallback((updates: Partial<TappConfig>) => {
    playClickSound();
    setConfig(prev => ({ ...prev, ...updates }));
  }, [playClickSound]);

  // Simple custom sound simulator for physical timer click tick
  const playTickSound = useCallback(() => {
    if (!config.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.015);
    } catch (e) {
      // Fail silent
    }
  }, [config.soundEnabled]);

  return {
    state,
    config,
    remaining: liveRemaining,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setDuration,
    setVisualPreset,
    clearHistory,
    updateConfig,
    playTickSound,
    playClickSound,
  };
}
