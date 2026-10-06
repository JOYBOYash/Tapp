/**
 * Tapp Timer Data Models and TypeScript Definitions
 */

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'stopped';

export type VisualPreset = 'ring' | 'ambient-glow' | 'physical-sand' | 'pie-slice';

export interface TimerState {
  status: TimerStatus;
  duration: number; // Total duration in milliseconds
  startedAt: number | null; // Timestamp (Date.now()) when started
  pausedAt: number | null; // Timestamp when paused
  elapsedBeforePause: number; // Total elapsed time accumulated before the last pause
  remaining: number; // Calculated remaining time in milliseconds
  selectedVisual: VisualPreset;
  sessionCount: number; // Total completed sessions this run
  history: TimerHistoryEntry[];
}

export interface TimerHistoryEntry {
  id: string;
  duration: number; // millisecond duration
  startedAt: number; // timestamp
  completedAt: number; // timestamp
  status: 'completed' | 'stopped';
}

export interface TappConfig {
  theme: 'system' | 'light' | 'dark';
  windowSize: 'mini' | 'compact' | 'standard' | 'wide';
  windowPosition: { x: number; y: number } | string; // Preset or custom coordinates
  alwaysOnTop: boolean;
  frameless: boolean;
  translucency: number; // 0 (opaque) to 1 (max transparent backdrop blur)
  soundEnabled: boolean;
  hapticEnabled: boolean;
  startupEnabled: boolean;
}
