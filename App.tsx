import React, { useState, useCallback } from 'react';
import { EnrichedTicket } from './types';
import TicketInput from './components/TicketInput';
import EnrichedTicketDisplay from './components/EnrichedTicketDisplay';
import { SparklesIcon, IntelliTriageLogo } from './components/icons';

export default function App() {
  const [rawText, setRawText] = useState('');
  const [enrichedTicket, setEnrichedTicket] = useState<EnrichedTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamworkStatus, setTeamworkStatus] = useState<string | null>(null);

  const fetchOutlookTicket = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEnrichedTicket(null);
    try {
      const res = await fetch('http://localhost:4000/api/latest-outlook-ticket');
      if (!res.ok) throw new Error('Failed to fetch ticket from Outlook.');
      const data = await res.json();
      setEnrichedTicket(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!rawText.trim()) {
      setError("Input text cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEnrichedTicket(null);
    try {
      const res = await fetch('http://localhost:4000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      if (!res.ok) throw new Error('Failed to analyze ticket.');
      const data = await res.json();
      setEnrichedTicket(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [rawText]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <IntelliTriageLogo className="h-10 w-10 text-sky-400" />
            <h1 className="text-4xl font-bold text-slate-50 tracking-tight">IntelliTriage</h1>
          </div>
          <p className="text-lg text-slate-400">
            From Outlook Ticket to Actionable Insight
          </p>
        </header>

        <div className="text-center mb-6">
          <button
            onClick={fetchOutlookTicket}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-5 py-2 rounded"
            disabled={isLoading}
          >
            🔄 Fetch Latest Outlook Ticket
          </button>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TicketInput
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          <div className="bg-slate-850 rounded-xl shadow-2xl shadow-slate-950/50 p-6 flex flex-col min-h-[600px]">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-sky-400" />
              AI-Enriched Ticket
            </h2>
            <div className="flex-grow">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">Analyzing ticket...</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-400">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && enrichedTicket && (
                <>
                  <EnrichedTicketDisplay ticket={enrichedTicket} />
                  <div className="mt-4 text-center">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded"
                      onClick={async () => {
                        setTeamworkStatus(null);
                        try {
                          const res = await fetch('http://localhost:4000/api/send-to-teamwork', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: enrichedTicket.subject || 'AI Enriched Ticket',
                              description: JSON.stringify(enrichedTicket, null, 2),
                            }),
                          });
                          if (!res.ok) {
                            const contentType = res.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                              const err = await res.json();
                              throw new Error(err.error || `API returned an error`);
                            } else {
                              const errorText = await res.text();
                              throw new Error(errorText || `Request failed with status ${res.status}`);
                            }
                          } else {
                            setTeamworkStatus('Successfully sent to Teamwork!');
                          }
                        } catch (e: any) {
                          setTeamworkStatus('Error sending to Teamwork: ' + (e.message || 'Unknown error'));
                        }
                      }}
                      disabled={isLoading}
                    >
                      ➡️ Send to Teamwork
                    </button>
                    {teamworkStatus && (
                      <div className="mt-2 text-sm text-slate-300">{teamworkStatus}</div>
                    )}
                  </div>
                </>
              )}
              {!isLoading && !error && !enrichedTicket && (
                <div className="text-center text-slate-500">
                  <p className="font-medium">No ticket yet.</p>
                  <p className="text-sm">Click "Fetch Latest" or paste and analyze manually.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
