
import React from 'react';
import { MagicWandIcon } from './icons';

interface TicketInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const TicketInput: React.FC<TicketInputProps> = ({ value, onChange, onAnalyze, isLoading }) => {
  return (
    <div className="bg-slate-850 rounded-xl shadow-2xl shadow-slate-950/50 p-6 flex flex-col">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Raw Incoming Ticket</h2>
      <textarea
        value={value}
        onChange={onChange}
        className="flex-grow bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
        rows={20}
        placeholder="Paste your raw ticket text here..."
      />
      <button
        onClick={onAnalyze}
        disabled={isLoading}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <MagicWandIcon className="w-5 h-5" />
            Analyze with IntelliTriage
          </>
        )}
      </button>
    </div>
  );
};

export default TicketInput;
