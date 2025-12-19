
import React from 'react';
import { TodoTask } from '../types.ts';

interface StudyViewProps {
  tasks: TodoTask[];
  onComplete: (id: string) => void;
}

const StudyView: React.FC<StudyViewProps> = ({ tasks, onComplete }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  
  const dueTasks = tasks.filter(t => {
    // A task is due if it's not completed AND (it has no review date yet OR the review date is today or in the past)
    return !t.completed && (!t.nextReviewAt || t.nextReviewAt <= today);
  });

  const getLevelLabel = (level: number) => {
    switch(level) {
      case 0: return 'New';
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      default: return `Level ${level}`;
    }
  };

  if (dueTasks.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-800 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
           </svg>
        </div>
        <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Mastered Today</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">You've cleared your focus queue. Enjoy your rest or check your dashboard for long-term growth.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{dueTasks.length} Sessions Due</span>
         <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Spaced Repetition Active</span>
      </div>
      <div className="space-y-3">
        {dueTasks.map((task) => (
          <div 
            key={task.id}
            className="group flex items-center justify-between p-5 bg-[#0f0f12] border border-slate-800 rounded-[1.5rem] hover:border-indigo-500/30 transition-all duration-300"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
               <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white tracking-tight truncate">{task.title}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    task.repetitionLevel === 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {getLevelLabel(task.repetitionLevel)}
                  </span>
               </div>
               {task.category && (
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{task.category}</span>
               )}
            </div>
            
            <button 
              onClick={() => onComplete(task.id)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Mastered
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyView;
