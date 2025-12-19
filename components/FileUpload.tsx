
import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      alert("Please upload a PDF file.");
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        className="hidden" 
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleChange}
      />
      <button 
        disabled={isProcessing}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${
          isProcessing 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
          </div>
        ) : (
          <>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Sync PDF</span>
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
