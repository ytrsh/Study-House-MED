
import React, { useState, useEffect, useMemo } from 'react';
import { TodoTask, StudyPlanConfig } from './types.ts';
import { parseCurriculumPdf } from './services/geminiService.ts';
import ProgressBar from './components/ProgressBar.tsx';
import TodoItem from './components/TodoItem.tsx';
import FileUpload from './components/FileUpload.tsx';
import DriveSyncModal from './components/DriveSyncModal.tsx';
import Timer from './components/Timer.tsx';
import StudyStats from './components/StudyStats.tsx';
import PlanView from './components/PlanView.tsx';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [activeTab, setActiveTab] = useState<'materials' | 'plan' | 'timer' | 'stats'>('materials');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSyncPhase, setIsSyncPhase] = useState(true);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const [studyConfig, setStudyConfig] = useState<StudyPlanConfig>(() => {
    const saved = localStorage.getItem('studyhouse_config');
    const today = new Date().toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : { startDate: today, targetEndDate: '' };
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem('studyhouse_tasks');
    const savedPhase = localStorage.getItem('studyhouse_sync_phase');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) { console.error("Failed to load saved tasks"); }
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

  useEffect(() => {
    localStorage.setItem('studyhouse_config', JSON.stringify(studyConfig));
  }, [studyConfig]);

  // Helper to get all days in range
  const daysInRange = useMemo(() => {
    if (!studyConfig.startDate || !studyConfig.targetEndDate) return [];
    const start = new Date(studyConfig.startDate);
    const end = new Date(studyConfig.targetEndDate);
    const days: string[] = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
      if (days.length > 365) break; // Safety break
    }
    return days;
  }, [studyConfig.startDate, studyConfig.targetEndDate]);

  // Logic to assign tasks to days
  const taskDistribution = useMemo(() => {
    const dist: Record<string, TodoTask[]> = {};
    if (daysInRange.length === 0) return dist;

    tasks.forEach((task, index) => {
      if (task.manualDate && daysInRange.includes(task.manualDate)) {
        dist[task.manualDate] = dist[task.manualDate] || [];
        dist[task.manualDate].push(task);
      } else {
        // Fallback: Distribute evenly among range if no valid manual date
        const dayIndex = index % daysInRange.length;
        const assignedDate = daysInRange[dayIndex];
        dist[assignedDate] = dist[assignedDate] || [];
        dist[assignedDate].push(task);
      }
    });
    return dist;
  }, [tasks, daysInRange]);

  const tasksDueToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    // We only show uncompleted tasks in the Study queue
    return (taskDistribution[todayStr] || []).filter(t => !t.completed);
  }, [taskDistribution]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const totalPercentage = total === 0 ? 0 : Math.round((completedCount / total) * 100);

    const todayDate = new Date().toISOString().split('T')[0];
    const tasksToday = taskDistribution[todayDate] || [];
    const completedTodayCount = tasksToday.filter(t => t.completed).length;
    const dailyTotal = tasksToday.length;
    const dailyPercentage = dailyTotal === 0 ? 0 : Math.round((completedTodayCount / dailyTotal) * 100);

    return { total, completedCount, totalPercentage, dailyPercentage, dueTodayCount: tasksDueToday.length };
  }, [tasks, tasksDueToday, taskDistribution]);

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    
    // Determine the last day for the new task
    const lastDay = daysInRange.length > 0 ? daysInRange[daysInRange.length - 1] : undefined;
    
    const newTask: TodoTask = {
      id: crypto.randomUUID(),
      title: inputValue.trim(),
      completed: false,
      source: 'manual',
      createdAt: Date.now(),
      repetitionLevel: 0,
      manualDate: lastDay
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
        }
        return updated;
      }
      return t;
    }));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskDate = (taskId: string, newDate: string | null) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, manualDate: newDate || undefined };
      }
      return t;
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const parsedTasks = await parseCurriculumPdf(base64);
        const lastDay = daysInRange.length > 0 ? daysInRange[daysInRange.length - 1] : undefined;
        
        const newOnes: TodoTask[] = parsedTasks.map(pt => ({
          id: crypto.randomUUID(),
          title: pt.className,
          category: pt.category,
          completed: false,
          source: 'ai',
          createdAt: Date.now(),
          repetitionLevel: 0,
          manualDate: lastDay
        }));
        setTasks(prev => [...newOnes, ...prev]);
        setIsProcessing(false);
        setShowSyncPopup(true);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setIsProcessing(false);
    }
  };

  const handleSyncDrive = async (link: string) => {
    setIsDriveSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    const lastDay = daysInRange.length > 0 ? daysInRange[daysInRange.length - 1] : undefined;
    
    const mockFiles = ["Physics Lecture 1", "Calculus Assignment", "History Reading"];
    const driveTasks: TodoTask[] = mockFiles.map(f => ({
      id: crypto.randomUUID(),
      title: f,
      completed: false,
      source: 'drive',
      category: 'Drive Crawl',
      createdAt: Date.now(),
      repetitionLevel: 0,
      manualDate: lastDay
    }));
    setTasks(prev => [...driveTasks, ...prev]);
    setIsDriveSyncing(false);
    setIsDriveModalOpen(false);
    setShowSyncPopup(true);
  };

  const navItems = [
    { id: 'materials', label: 'Materials', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'plan', label: 'Plan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'timer', label: 'Study', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'stats', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 selection:bg-indigo-500/30">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row h-screen overflow-hidden">
        
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
                {tab.id === 'timer' && stats.dueTodayCount > 0 && (
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
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Progress</span>
                <span className="text-xs font-black text-white">{stats.dailyPercentage}%</span>
              </div>
              <ProgressBar progress={stats.dailyPercentage} color="from-emerald-600 to-indigo-500" />
            </div>
            <div className="bg-slate-800/10 rounded-2xl p-4 border border-slate-800/20">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastery</span>
                <span className="text-xs font-black text-white">{stats.totalPercentage}%</span>
              </div>
              <ProgressBar progress={stats.totalPercentage} color="from-indigo-600 to-purple-500" />
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#0a0a0c] p-4 sm:p-6 lg:p-10 relative pb-24 lg:pb-10 h-full">
          
          {activeTab === 'materials' && (
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2">MATERIALS</h2>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">Registry of all your academic assets.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex gap-3 shrink-0">
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Start Date</label>
                        <input 
                            type="date" 
                            value={studyConfig.startDate}
                            onChange={(e) => setStudyConfig({ ...studyConfig, startDate: e.target.value })}
                            className="bg-transparent text-white font-black text-xs outline-none focus:text-indigo-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">End Date</label>
                        <input 
                            type="date" 
                            value={studyConfig.targetEndDate}
                            onChange={(e) => setStudyConfig({ ...studyConfig, targetEndDate: e.target.value })}
                            className="bg-transparent text-white font-black text-xs outline-none focus:text-indigo-400 transition-colors"
                        />
                    </div>
                </div>
              </header>

              {isSyncPhase && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
                  <button onClick={() => setIsDriveModalOpen(true)} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all border border-slate-800 bg-[#0f0f12] text-slate-300 hover:bg-slate-800 hover:text-white">
                    Cloud Crawler
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <form onSubmit={handleAddTask} className="relative group">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Register new material..."
                    className="w-full px-4 sm:px-6 py-4 bg-slate-900/30 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-medium pr-24 text-sm"
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700">
                    Register
                  </button>
                </form>

                <div className="pt-6 border-t border-slate-800/50 space-y-3">
                  {tasks.map((task, idx) => (
                    <TodoItem 
                      key={task.id} task={task} index={idx}
                      onToggle={handleToggle} onDelete={handleDelete}
                      onDragStart={() => {}} onDragOver={() => {}} onDragEnd={() => {}}
                      isDragging={false}
                      showMarks={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2">STUDY PLAN</h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">Automatic distribution of materials across your selected interval.</p>
              </header>
              <PlanView 
                daysInRange={daysInRange}
                taskDistribution={taskDistribution}
                onUpdateTask={updateTaskDate} 
              />
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="max-w-5xl mx-auto py-4 sm:py-10 animate-in zoom-in-95 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <header className="text-center lg:text-left">
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter mb-2 uppercase">Study Session</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Execute today's queue with absolute concentration.</p>
                </header>
                <Timer />
              </div>
              <div className="bg-[#0f0f12] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                 <h3 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    Study Queue • Today
                 </h3>
                 <div className="space-y-3">
                    {tasksDueToday.map((t, idx) => (
                        <TodoItem 
                            key={t.id} task={t} index={idx}
                            onToggle={handleToggle} onDelete={handleDelete}
                            onDragStart={() => {}} onDragOver={() => {}} onDragEnd={() => {}}
                            isDragging={false}
                            showMarks={true}
                        />
                    ))}
                    {tasksDueToday.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                           <p className="text-slate-600 font-black text-xs uppercase tracking-widest">Nothing scheduled for today</p>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
              <header>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Performance</h2>
                <p className="text-slate-500 font-medium">Visualization of your academic consistency.</p>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StudyStats tasks={tasks} />
                <div className="bg-[#0f0f12] border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 text-center">
                            <span className="block text-3xl font-black text-white">{tasks.length}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Materials</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-emerald-600/5 border border-emerald-500/10 text-center">
                            <span className="block text-3xl font-black text-white">{stats.completedCount}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mastered</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f12]/95 backdrop-blur-lg border-t border-slate-800/50 flex justify-around items-center p-3 z-40">
           {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-indigo-600/10' : ''}`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.id === 'timer' && stats.dueTodayCount > 0 && (
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

      <DriveSyncModal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} onSync={handleSyncDrive} isSyncing={isDriveSyncing} />

      {/* SYNC DONE POPUP WITH DATE INTERVAL SELECTION */}
      {showSyncPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setShowSyncPopup(false)} />
          <div className="relative bg-[#0f0f12] border border-slate-800 rounded-[3rem] p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Materials Synced</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">Define your study interval to distribute the materials.</p>
            
            <div className="space-y-4 mb-10 text-left">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                        <input 
                            type="date" 
                            value={studyConfig.startDate}
                            onChange={(e) => setStudyConfig({ ...studyConfig, startDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                        <input 
                            type="date" 
                            value={studyConfig.targetEndDate}
                            onChange={(e) => setStudyConfig({ ...studyConfig, targetEndDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                disabled={!studyConfig.targetEndDate}
                onClick={() => { setIsSyncPhase(false); setShowSyncPopup(false); setActiveTab('plan'); }} 
                className="py-5 bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                Generate Study Plan
              </button>
              <button 
                onClick={() => setShowSyncPopup(false)} 
                className="py-4 bg-slate-800/50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
