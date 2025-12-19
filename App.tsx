
import React, { useState, useEffect, useMemo } from 'react';
import { TodoTask } from './types.ts';
import { parseCurriculumPdf } from './services/geminiService.ts';
import ProgressBar from './components/ProgressBar.tsx';
import TodoItem from './components/TodoItem.tsx';
import FileUpload from './components/FileUpload.tsx';
import DriveSyncModal from './components/DriveSyncModal.tsx';
import Timer from './components/Timer.tsx';
import StudyStats from './components/StudyStats.tsx';
import StudyView from './components/StudyView.tsx';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'study' | 'timer' | 'stats'>('tasks');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSyncPhase, setIsSyncPhase] = useState(true);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('studyhouse_tasks');
    const savedPhase = localStorage.getItem('studyhouse_sync_phase');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved tasks");
      }
    }
    if (savedPhase) {
      setIsSyncPhase(JSON.parse(savedPhase));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('studyhouse_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('studyhouse_sync_phase', JSON.stringify(isSyncPhase));
  }, [isSyncPhase]);

  // Spaced Repetition Helper: Intervals in days
  const intervals = [0, 1, 3, 7, 14, 30, 90];
  
  const calculateNextReview = (level: number) => {
    const days = intervals[Math.min(level, intervals.length - 1)];
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.getTime();
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const totalPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const today = new Date().setHours(0,0,0,0);
    const dueToday = tasks.filter(t => !t.completed && (!t.nextReviewAt || t.nextReviewAt <= today));
    const completedToday = tasks.filter(t => t.completedAt && new Date(t.completedAt).setHours(0,0,0,0) === today).length;
    const dailyTotal = dueToday.length + completedToday;
    const dailyPercentage = dailyTotal === 0 ? 0 : Math.round((completedToday / dailyTotal) * 100);

    return { total, completed, totalPercentage, dailyPercentage, dueTodayCount: dueToday.length };
  }, [tasks]);

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    
    const newTask: TodoTask = {
      id: crypto.randomUUID(),
      title: inputValue.trim(),
      completed: false,
      source: 'manual',
      createdAt: Date.now(),
      repetitionLevel: 0,
      nextReviewAt: new Date().setHours(0,0,0,0)
    };
    
    setTasks(prev => [newTask, ...prev]);
    setInputValue('');
  };

  const handleToggle = (id: string, field: 'completed' | 'isUrgent' | 'isQuestion') => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: !t[field] };
        if (field === 'completed') {
          updated.completedAt = updated.completed ? Date.now() : undefined;
          if (updated.completed) {
            updated.repetitionLevel += 1;
            updated.nextReviewAt = calculateNextReview(updated.repetitionLevel);
          }
        }
        return updated;
      }
      return t;
    }));
  };

  const handleStudyComplete = (id: string) => {
    handleToggle(id, 'completed');
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Fix: Added missing handleDragStart function for drag-and-drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Fix: Added missing handleDragOver function for drag-and-drop reordering
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newTasks = [...tasks];
    const draggedItem = newTasks[draggedItemIndex];
    newTasks.splice(draggedItemIndex, 1);
    newTasks.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setTasks(newTasks);
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const parsedTasks = await parseCurriculumPdf(base64);
        const newOnes: TodoTask[] = parsedTasks.map(pt => ({
          id: crypto.randomUUID(),
          title: pt.className,
          category: pt.category,
          completed: false,
          source: 'ai',
          createdAt: Date.now(),
          repetitionLevel: 0,
          nextReviewAt: new Date().setHours(0,0,0,0)
        }));
        setTasks(prev => {
          const existing = new Set(prev.map(t => t.title.toLowerCase()));
          return [...newOnes.filter(n => !existing.has(n.title.toLowerCase())), ...prev];
        });
        setIsProcessing(false);
        setShowSyncPopup(true);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleSyncDrive = async (link: string) => {
    setIsDriveSyncing(true);
    await new Promise(r => setTimeout(r, 3000));
    
    const mockFiles = [
      "Quantum Mechanics Lecture 01 - Wavefunctions",
      "Thermodynamics Lab Report Template",
      "Advanced Calculus Midterm Revision",
      "Linear Algebra - Eigenvalues.pdf",
      "Complex Variables Homework 4",
      "Special Relativity Reading List"
    ];

    const driveTasks: TodoTask[] = mockFiles.map(f => ({
      id: crypto.randomUUID(),
      title: f,
      completed: false,
      source: 'drive',
      category: 'Drive Crawl',
      createdAt: Date.now(),
      repetitionLevel: 0,
      nextReviewAt: new Date().setHours(0,0,0,0)
    }));

    setTasks(prev => {
        const existing = new Set(prev.map(t => t.title.toLowerCase()));
        return [...driveTasks.filter(n => !existing.has(n.title.toLowerCase())), ...prev];
    });

    setIsDriveSyncing(false);
    setIsDriveModalOpen(false);
    setShowSyncPopup(true);
  };

  const finishSync = () => {
    setIsSyncPhase(false);
    setShowSyncPopup(false);
    setActiveTab('study');
  };

  const navItems = [
    { id: 'tasks', label: 'Schedule', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'study', label: 'Study', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.75 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.75 0-3.332.477-4.5 1.253' },
    { id: 'timer', label: 'Focus Lab', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'stats', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 selection:bg-indigo-500/30">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row h-screen overflow-hidden">
        
        {/* Platform Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-slate-800/50 bg-[#0f0f12] flex-col p-6 space-y-8 h-full">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">Study House</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all relative ${
                  activeTab === tab.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
                {tab.id === 'study' && stats.dueTodayCount > 0 && (
                  <span className="absolute right-3 top-3.5 w-4 h-4 bg-indigo-500 text-white text-[9px] flex items-center justify-center rounded-full font-black animate-pulse">
                    {stats.dueTodayCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="space-y-4 pt-4 border-t border-slate-800/30">
            <div className="bg-slate-800/10 rounded-2xl p-4 border border-slate-800/20">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Goal</span>
                <span className="text-xs font-black text-white">{stats.dailyPercentage}%</span>
              </div>
              <ProgressBar progress={stats.dailyPercentage} color="from-emerald-600 to-indigo-500" />
            </div>

            <div className="bg-slate-800/10 rounded-2xl p-4 border border-slate-800/20">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Mastered</span>
                <span className="text-xs font-black text-white">{stats.totalPercentage}%</span>
              </div>
              <ProgressBar progress={stats.totalPercentage} color="from-indigo-600 to-purple-500" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0c] p-4 sm:p-6 lg:p-10 relative pb-24 lg:pb-10 h-full">
          
          {activeTab === 'tasks' && (
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2">CURRICULUM</h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">Capture courses and define your academic roadmap.</p>
              </header>

              {isSyncPhase ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
                  <button 
                    onClick={() => setIsDriveModalOpen(true)}
                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all border border-slate-800 bg-[#0f0f12] text-slate-300 hover:bg-slate-800 hover:text-white group"
                  >
                    <svg className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5l2.45 4.25H21l-2.45-4.25H7.71zm-1.06 1.83L1 15.25l2.45 4.25 5.65-9.83-2.45-4.34zM9.45 9.25l5.65 9.83H21l-5.65-9.83H9.45z" />
                    </svg>
                    Sync Drive
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center py-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl px-6">
                   <p className="text-indigo-400 font-bold text-xs">Sync complete. Entering Study phase.</p>
                   <button onClick={() => setIsSyncPhase(true)} className="text-[10px] font-black uppercase text-indigo-500 hover:underline">Re-open sync</button>
                </div>
              )}

              <div className="space-y-4">
                <form onSubmit={handleAddTask} className="relative group">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Capture new class or task..."
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-slate-900/30 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 font-medium pr-20 sm:pr-24 text-sm sm:text-base"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                  >
                    Add
                  </button>
                </form>

                <div className="pt-6 border-t border-slate-800/50">
                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task, idx) => (
                        <TodoItem 
                          key={task.id} 
                          task={task} 
                          index={idx}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDragEnd={() => setDraggedItemIndex(null)}
                          isDragging={draggedItemIndex === idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-20 bg-slate-900/10 rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-slate-800">
                       <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Awaiting Input</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'study' && (
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2">SPACED REPETITION</h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">Focus on what's due for review today.</p>
              </header>
              <StudyView tasks={tasks} onComplete={handleStudyComplete} />
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="max-w-xl mx-auto py-4 sm:py-10 animate-in zoom-in-95 duration-500">
               <header className="text-center mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2 uppercase">Focus Lab</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium px-4">Master your concentration with deep work blocks.</p>
              </header>
              <Timer />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
              <header>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2 uppercase">Performance</h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">Tracking your academic growth and consistency.</p>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                <StudyStats tasks={tasks} />
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center">
                  <h3 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-6 sm:mb-8">Summary Highlights</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    <div className="p-4 sm:p-6 rounded-2xl bg-indigo-600/5 border border-indigo-500/10">
                      <span className="block text-2xl sm:text-3xl font-black text-white">{tasks.length}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Courses</span>
                    </div>
                    <div className="p-4 sm:p-6 rounded-2xl bg-emerald-600/5 border border-emerald-500/10">
                      <span className="block text-2xl sm:text-3xl font-black text-white">{tasks.filter(t => t.completed).length}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                    </div>
                    <div className="p-4 sm:p-6 rounded-2xl bg-rose-600/5 border border-rose-500/10">
                      <span className="block text-2xl sm:text-3xl font-black text-white">{tasks.filter(t => t.isUrgent).length}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Urgent</span>
                    </div>
                    <div className="p-4 sm:p-6 rounded-2xl bg-blue-600/5 border border-blue-500/10">
                      <span className="block text-2xl sm:text-3xl font-black text-white">{tasks.filter(t => t.source === 'drive').length}</span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Drive Synced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Nav - Mobile/Tablet only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f12]/95 backdrop-blur-lg border-t border-slate-800/50 flex justify-around items-center p-3 z-40">
           {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id 
                ? 'text-indigo-400' 
                : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-indigo-600/10' : ''}`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.id === 'study' && stats.dueTodayCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 text-white text-[8px] flex items-center justify-center rounded-full font-black">
                    {stats.dueTodayCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <DriveSyncModal 
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSync={handleSyncDrive}
        isSyncing={isDriveSyncing}
      />

      {/* Sync Done Popup */}
      {showSyncPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowSyncPopup(false)} />
          <div className="relative bg-[#0f0f12] border border-slate-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Sync Successful!</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">Are you done with syncing your resources for now? We can move to your study plan.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={finishSync}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
              >
                Yes, let's Study
              </button>
              <button 
                onClick={() => setShowSyncPopup(false)}
                className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all"
              >
                Sync more
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
