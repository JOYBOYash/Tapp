/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import MacMenuBar from './components/MacMenuBar';
import TappWindow from './components/TappWindow';
import MacDock from './components/MacDock';

export default function App() {
  const timer = useTimer();
  const { state, config, remaining, playClickSound } = timer;
  const [isWindowVisible, setIsWindowVisible] = useState(true);

  // Synchronize Dark / Light Mode with user preference and system appearance
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      root.classList.remove('dark');

      if (config.theme === 'dark') {
        root.classList.add('dark');
      } else if (config.theme === 'light') {
        // do nothing, default is light
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

  // Keyboard shortcut to toggle window visibility (Command + H or Alt + H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.altKey) && e.key === 'h') {
        e.preventDefault();
        playClickSound();
        setIsWindowVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playClickSound]);

  const toggleWindow = () => {
    setIsWindowVisible(prev => !prev);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans">
      
      {/* 
        PREMIUM FLUID WALLPAPER BACKGROUND
        Simulates the iconic macOS Sonoma organic fluid flow with pure high-performance CSS gradients 
        and animation. Blends golden sunrays, cosmic midnight blues, and rich slates.
      */}
      <div className="absolute inset-0 z-0 bg-[#070b19] transition-all duration-700">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge filter blur-[120px] pointer-events-none scale-110">
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-blue-600 rounded-full animate-pulse transition-all duration-[6000ms]" />
          <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vh] bg-indigo-500 rounded-full transition-all duration-[8000ms] delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-[35vw] h-[35vh] bg-[#ffd60a]/20 rounded-full transition-all duration-[7000ms]" />
        </div>
        
        {/* Subtle Sonoma organic wave grid overlays */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      </div>

      {/* Simulated Desktop Folders / Icons */}
      <div className="absolute inset-0 z-1 pointer-events-none p-10 pt-16 flex flex-col items-end gap-6 text-white text-[11px]">
        <div className="flex flex-col items-center gap-1.5 cursor-default pointer-events-auto active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded bg-blue-600/20 border border-white/20 flex items-center justify-center text-blue-300">
            📁
          </div>
          <span className="text-white/80 font-medium drop-shadow-md">Focus Projects</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 cursor-default pointer-events-auto active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded bg-indigo-600/20 border border-white/20 flex items-center justify-center text-indigo-300">
            📄
          </div>
          <span className="text-white/80 font-medium drop-shadow-md">Tapp Guide.rtf</span>
        </div>
      </div>

      {/* macOS Top Menu Bar */}
      <MacMenuBar 
        timer={timer} 
        onToggleWindow={toggleWindow} 
        isWindowVisible={isWindowVisible}
      />

      {/* Tapp Main Application Window (Floating overlay sandbox) */}
      {isWindowVisible && (
        <TappWindow 
          timer={timer} 
          onClose={toggleWindow}
        />
      )}

      {/* macOS Bottom Desktop Dock */}
      <MacDock 
        status={state.status}
        sessionCount={state.sessionCount}
        remainingTimeFormatted={formatTime(remaining)}
        onTappClick={toggleWindow}
        isWindowVisible={isWindowVisible}
        playClickSound={playClickSound}
      />

      {/* Keyboard Helper Floating Tip (Hides automatically in miniature window size) */}
      {config.windowSize !== 'mini' && isWindowVisible && (
        <div className="absolute bottom-20 left-4 z-50 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-400 font-sans tracking-tight pointer-events-none flex flex-col gap-0.5 shadow-md">
          <span className="font-bold text-white uppercase text-[8px] tracking-widest block text-slate-500">keystroke tips</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">Space</kbd> Start / Pause</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">R</kbd> Stop Session</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">Shift+R</kbd> Full Reset</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">V</kbd> Cycle Visual Preset</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">F</kbd> Toggle Frameless Frame</span>
          <span><kbd className="bg-white/10 px-1 rounded font-mono">⌥+H</kbd> / <kbd className="bg-white/10 px-1 rounded font-mono">⌘+H</kbd> Toggle UI Hide</span>
        </div>
      )}

    </div>
  );
}
