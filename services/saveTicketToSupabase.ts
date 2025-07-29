import { supabase } from '../supabase';
import { EnrichedTicket } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function saveEnrichedTicket(
  enriched: EnrichedTicket,
  subject: string,
  userId: string
): Promise<string> {
  const ticketId = uuidv4();

  // Insert into tickets
  const { error: ticketError } = await supabase.from('tickets').insert({
    id: ticketId,
    subject,
    summary: enriched.summary,
    priority: enriched.priority.level,
    reason: enriched.priority.reason,
    team: enriched.routing.team,
    assignee: enriched.routing.assignee,
    root_cause: enriched.rootCause,
    created_by: userId,
  });

  if (ticketError) throw new Error(`❌ Failed to insert into tickets: ${ticketError.message}`);

  // Insert tags
  const tagRows = enriched.tags.map((tag) => ({
    id: uuidv4(),
    ticket_id: ticketId,
    tag,
  }));

  if (tagRows.length > 0) {
    const { error } = await supabase.from('ticket_tags').insert(tagRows);
    if (error) throw new Error(`❌ Failed to insert ticket_tags: ${error.message}`);
  }

  // Insert similar tickets
  const similarRows = enriched.similarTickets.map((t) => ({
    id: uuidv4(),
    ticket_id: ticketId,
    reference_id: t.id,
    description: t.description,
  }));

  if (similarRows.length > 0) {
    const { error } = await supabase.from('similar_tickets').insert(similarRows);
    if (error) throw new Error(`❌ Failed to insert similar_tickets: ${error.message}`);
  }

  // Insert code suggestion
  const code = enriched.codeCorrection;
  const { error: codeError } = await supabase.from('code_suggestions').insert([
    {
      id: uuidv4(),
      ticket_id: ticketId,
      file_path: code.file,
      explanation: code.explanation,
      current_code: code.currentCode,
      suggested_code: code.suggestedFix,
    },
  ]);

  if (codeError) throw new Error(`❌ Failed to insert code_suggestions: ${codeError.message}`);

  return ticketId;
}
