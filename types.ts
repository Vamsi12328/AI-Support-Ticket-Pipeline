
export interface EnrichedTicket {
  summary: string;
  priority: {
    level: 'Critical' | 'High' | 'Medium' | 'Low';
    reason: string;
  };
  routing: {
    team: string;
    assignee: string;
  };
  tags: string[];
  rootCause: string;
  codeCorrection: {
    file: string;
    explanation: string;
    currentCode: string;
    suggestedFix: string;
  };
  similarTickets: {
    id: string;
    description: string;
  }[];
}
