
import React, { useState, useEffect, useRef } from 'react';

const Timer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'short' | 'long'>('study');
  const timerRef = useRef<number | null>(null);

  const switchMode = (newMode: 'study' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'study') setTimeLeft(25 * 60);
    else if (newMode === 'short') setTimeLeft(5 * 60);
    else if (newMode === 'long') setTimeLeft(15 * 60);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(() => {});
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTimeForMode = mode === 'study' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60;

  return (
    <div className="bg-[#0f0f12] border border-slate-800/80 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col items-center shadow-2xl backdrop-blur-md w-full">
      {/* Mode Switcher */}
      <div className="flex gap-1 mb-8 sm:mb-12 bg-slate-900/50 p-1 rounded-xl sm:rounded-2xl border border-slate-800/50 w-full justify-center">
        {(['study', 'short', 'long'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              mode === m 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {m === 'study' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 mb-8 sm:mb-12">
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className="stroke-slate-900 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className="stroke-indigo-500 fill-none transition-all duration-1000 ease-linear shadow-indigo-500/50"
            strokeWidth="8"
            strokeDasharray="264%"
            strokeDashoffset={`${264 * (1 - timeLeft / totalTimeForMode)}%`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-5xl sm:text-7xl font-black text-white tracking-tighter tabular-nums leading-none">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3 sm:gap-4 w-full">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 py-4 sm:py-5 rounded-[1.25rem] sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all shadow-2xl active:scale-95 border ${
            isActive 
            ? 'bg-slate-900 text-rose-500 border-rose-500/20 hover:border-rose-500/40' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-400/20 shadow-indigo-600/40'
          }`}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => { setIsActive(false); switchMode(mode); }}
          className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] bg-slate-800/50 text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-90 group"
          title="Reset"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;
