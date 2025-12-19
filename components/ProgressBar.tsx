
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string; // Tailwind gradient classes
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = "from-indigo-600 to-emerald-500" }) => {
  return (
    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.3)]`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
