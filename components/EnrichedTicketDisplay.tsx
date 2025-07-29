
import React from 'react';
import { EnrichedTicket } from '../types';
import TicketField from './TicketField';
import CodeBlock from './CodeBlock';
import { SummaryIcon, PriorityIcon, RouteIcon, TagIcon, RootCauseIcon, CodeIcon, LinkIcon } from './icons';

interface EnrichedTicketDisplayProps {
  ticket: EnrichedTicket;
}

const PriorityBadge: React.FC<{ level: EnrichedTicket['priority']['level'] }> = ({ level }) => {
    const levelColors = {
        Critical: 'bg-red-500/20 text-red-300 border-red-500/30',
        High: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        Low: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    };
    return <span className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${levelColors[level]}`}>{level}</span>
};

const EnrichedTicketDisplay: React.FC<EnrichedTicketDisplayProps> = ({ ticket }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <TicketField icon={<SummaryIcon/>} title="AI Summary">
        <p className="text-slate-300">{ticket.summary}</p>
      </TicketField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TicketField icon={<PriorityIcon/>} title="Priority">
             <div className="flex flex-col items-start gap-2">
                <PriorityBadge level={ticket.priority.level} />
                <p className="text-sm text-slate-400 italic">Reason: {ticket.priority.reason}</p>
             </div>
          </TicketField>

          <TicketField icon={<RouteIcon/>} title="Suggested Route">
            <p className="text-slate-300">
                <strong>Team:</strong> {ticket.routing.team}
            </p>
            <p className="text-slate-300">
                <strong>Assignee:</strong> {ticket.routing.assignee}
            </p>
          </TicketField>
      </div>
      
      <TicketField icon={<TagIcon/>} title="AI-Generated Tags">
        <div className="flex flex-wrap gap-2">
          {ticket.tags.map((tag) => (
            <span key={tag} className="bg-sky-500/10 text-sky-300 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-500/20">
              {tag}
            </span>
          ))}
        </div>
      </TicketField>

      <TicketField icon={<RootCauseIcon/>} title="Root Cause Suggestion">
        <p className="text-slate-300">{ticket.rootCause}</p>
      </TicketField>

      <TicketField icon={<CodeIcon/>} title="Code Correction Suggestion">
        <div className="space-y-4">
            <p className="text-slate-400"><strong className="text-slate-300">File:</strong> {ticket.codeCorrection.file}</p>
            <p className="text-slate-400">{ticket.codeCorrection.explanation}</p>
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Current Code (Likely)</h4>
                <CodeBlock code={ticket.codeCorrection.currentCode} language="typescript" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-green-300 mb-2">Suggested Fix</h4>
                <CodeBlock code={ticket.codeCorrection.suggestedFix} language="typescript" />
            </div>
        </div>
      </TicketField>
       <TicketField icon={<LinkIcon/>} title="Similar Resolved Tickets">
        <ul className="space-y-2">
            {ticket.similarTickets.map((st) => (
                 <li key={st.id}>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                      🔗 [{st.id}]: {st.description}
                    </a>
                </li>
            ))}
        </ul>
      </TicketField>
    </div>
  );
};

export default EnrichedTicketDisplay;
