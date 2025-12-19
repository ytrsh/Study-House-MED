
import React from 'react';
import { TodoTask } from '../types.ts';

interface StudyStatsProps {
  tasks: TodoTask[];
}

const StudyStats: React.FC<StudyStatsProps> = ({ tasks }) => {
  const getStatsByDate = () => {
    const stats: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt).toISOString().split('T')[0];
        stats[date] = (stats[date] || 0) + 1;
      }
    });
    return stats;
  };

  const stats = getStatsByDate();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/50';
    if (count === 1) return 'bg-emerald-900';
    if (count === 2) return 'bg-emerald-700';
    if (count >= 3) return 'bg-emerald-500';
    return 'bg-slate-800';
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl backdrop-blur-md w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Daily Activity</h2>
        <span className="text-[10px] sm:text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-wider">{monthName} {currentYear}</span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[8px] sm:text-[10px] font-black text-slate-500 text-center uppercase mb-1 sm:mb-2">{d}</div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const count = stats[dateStr] || 0;
          
          return (
            <div 
              key={day} 
              className={`relative aspect-square rounded-md sm:rounded-lg flex items-center justify-center transition-all group ${getColor(count)}`}
              title={`${count} tasks completed on ${dateStr}`}
            >
              <span className={`text-[8px] sm:text-[10px] font-bold ${count > 0 ? 'text-white' : 'text-slate-600'}`}>{day}</span>
              {count > 0 && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-white leading-none">{tasks.filter(t => t.completed).length}</span>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Mastered</span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase mr-1 hidden sm:inline">Intensity</span>
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-slate-800/50" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-emerald-900" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-emerald-700" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-emerald-500" />
        </div>
      </div>
    </div>
  );
};

export default StudyStats;
