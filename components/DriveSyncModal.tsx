
import React, { useState } from 'react';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (link: string) => void;
  isSyncing: boolean;
}

const DriveSyncModal: React.FC<DriveSyncModalProps> = ({ isOpen, onClose, onSync, isSyncing }) => {
  const [link, setLink] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (link.trim()) {
      onSync(link.trim());
      setLink('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-[#0f0f12] border border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-md p-10 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 3.5l2.45 4.25H21l-2.45-4.25H7.71zm-1.06 1.83L1 15.25l2.45 4.25 5.65-9.83-2.45-4.34zM9.45 9.25l5.65 9.83H21l-5.65-9.83H9.45z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Cloud Crawler</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
          Connect your Google Drive folder. Our crawler will traverse the directory and index all academic resources into your schedule.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-1">
              Drive Folder Link
            </label>
            <input 
              autoFocus
              type="url"
              required
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm text-white font-medium"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isSyncing}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSyncing}
              className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 ${
                isSyncing 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isSyncing ? (
                <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Crawling...</span>
                </div>
              ) : 'Initialize Crawler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriveSyncModal;
