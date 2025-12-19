
import React from 'react';
import { TodoTask } from '../types.ts';

interface PlanViewProps {
  daysInRange: string[];
  taskDistribution: Record<string, TodoTask[]>;
  onUpdateTask: (taskId: string, newDate: string | null) => void;
}

const PlanView: React.FC<PlanViewProps> = ({ daysInRange, taskDistribution, onUpdateTask }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateStr: string | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTask(taskId, dateStr);
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const getTaskStatusColor = (t: TodoTask) => {
    if (t.completed) return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    if (t.isUrgent) return 'border-rose-500 bg-rose-500/10 text-rose-400';
    if (t.isQuestion) return 'border-blue-500 bg-blue-500/10 text-blue-400';
    return 'border-slate-800 bg-[#0a0a0c] text-slate-400';
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="grid grid-cols-1 gap-6">
        {daysInRange.map((day, idx) => {
          const dayTasks = taskDistribution[day] || [];
          const isToday = day === new Date().toISOString().split('T')[0];
          
          return (
            <section 
              key={day}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                isToday ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-900/20 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-900/40 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {idx + 1}
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-tight ${isToday ? 'text-indigo-400' : 'text-white'}`}>
                            {new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        {isToday && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 block">Session Live</span>}
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-black text-white">{dayTasks.length}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Tasks assigned</span>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayTasks.map(t => (
                  <div 
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.id)}
                    className={`p-4 border rounded-2xl flex flex-col gap-2 transition-all cursor-grab active:cursor-grabbing shadow-lg ${getTaskStatusColor(t)}`}
                  >
                    <span className="text-xs font-bold leading-tight truncate">{t.title}</span>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                            {t.source}
                        </span>
                        <div className="flex items-center gap-2">
                           {t.isUrgent && (
                             <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                           )}
                           {t.isQuestion && (
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                           )}
                           <button 
                              onClick={() => onUpdateTask(t.id, null)}
                              className="p-1 opacity-40 hover:opacity-100 transition-all"
                              title="Reset Assignment"
                           >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                           </button>
                        </div>
                    </div>
                  </div>
                ))}
                {dayTasks.length === 0 && (
                    <div className="col-span-full py-8 text-center border border-dashed border-slate-800/50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No tasks scheduled</p>
                    </div>
                )}
              </div>
            </section>
          );
        })}
        
        {daysInRange.length === 0 && (
            <div className="py-24 text-center border border-dashed border-slate-800 rounded-[3rem] bg-slate-900/10">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                </div>
                <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Plan not generated</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">Please select a start and end date in the Materials tab or the sync pop-up.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PlanView;
