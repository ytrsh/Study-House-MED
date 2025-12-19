
import React from 'react';
import { TodoTask } from '../types.ts';

interface TodoItemProps {
  task: TodoTask;
  index: number;
  onToggle: (id: string, field: 'completed' | 'isUrgent' | 'isQuestion') => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ 
  task, 
  index, 
  onToggle, 
  onDelete, 
  onDragStart, 
  onDragOver, 
  onDragEnd,
  isDragging 
}) => {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`group flex items-center justify-between p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-30 scale-95 border-indigo-500 border-dashed bg-indigo-500/5' : 'bg-[#0f0f12] border-slate-800/50 hover:border-slate-700 shadow-lg hover:bg-slate-800/20'
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-700 w-4 sm:w-5 text-center tracking-tighter shrink-0">
          {(index + 1).toString().padStart(2, '0')}
        </span>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs sm:text-sm font-bold transition-all tracking-tight truncate ${
              task.completed ? 'text-slate-500 line-through' : 'text-white'
            }`}>
              {task.title}
            </span>
            <div className="flex gap-1">
              {task.source === 'drive' && (
                 <span className="text-[7px] sm:text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest shrink-0">Cloud</span>
              )}
              {task.source === 'ai' && (
                 <span className="text-[7px] sm:text-[8px] bg-indigo-500/10 text-indigo-500 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-500/20 font-black uppercase tracking-widest shrink-0">AI</span>
              )}
            </div>
          </div>
          {task.category && (
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-black text-slate-600 mt-0.5 sm:mt-1 truncate">
              {task.category}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <div className="flex items-center gap-0.5 sm:gap-2 px-1 sm:px-4 border-x border-slate-800/50">
          <button 
            onClick={() => onToggle(task.id, 'completed')}
            className={`transition-all p-1.5 sm:p-2 rounded-lg hover:bg-white/5 active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-600'}`}
          >
            <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <button 
            onClick={() => onToggle(task.id, 'isUrgent')}
            className={`transition-all p-1.5 sm:p-2 rounded-lg hover:bg-white/5 active:scale-90 ${task.isUrgent ? 'text-rose-500' : 'text-slate-600'}`}
          >
            <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>

          <button 
            onClick={() => onToggle(task.id, 'isQuestion')}
            className={`transition-all p-1.5 sm:p-2 rounded-lg hover:bg-white/5 active:scale-90 font-black text-xs sm:text-base select-none ${task.isQuestion ? 'text-blue-500' : 'text-slate-600'}`}
          >
            ?
          </button>
        </div>

        <button 
          onClick={() => onDelete(task.id)}
          className="p-1.5 sm:p-2 text-slate-700 hover:text-rose-500 transition-colors"
        >
          <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
