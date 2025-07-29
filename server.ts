import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Client } from '@microsoft/microsoft-graph-client';
import { htmlToText } from 'html-to-text';
import { analyzeTicket } from './services/geminiService.js';
import { getOutlookAccessToken } from './authOutlook.js';
import { saveEnrichedTicket } from './services/saveTicketToSupabase.js';

dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

function formatEnrichedTicketToMarkdown(data: any): string {
  const {
    summary,
    priority,
    routing,
    codeCorrection,
    rootCause,
    similarTickets,
    tags,
  } = data;

  let md = `#### Summary\n${summary || 'No summary available.'}\n`;

  if (priority) {
    md += `\n#### Priority\n- Level: ${priority.level}\n- Reason: ${priority.reason}`;
  }

  if (routing) {
    md += `\n\n#### Routing\n- Assignee: ${routing.assignee}\n- Team: ${routing.team}`;
  }

  if (codeCorrection) {
    md += `\n\n#### Code Correction\n- File: ${codeCorrection.file}\n- Explanation: ${codeCorrection.explanation}\n- Suggested Fix:\n\`\`\`ts\n${codeCorrection.suggestedFix}\n\`\`\``;
  }

  if (rootCause) {
    md += `\n\n#### Root Cause\n${rootCause}`;
  }

  if (similarTickets?.length) {
    md += `\n\n#### Similar Tickets`;
    for (const t of similarTickets) {
      md += `\n- ${t.id}: ${t.description}`;
    }
  }

  if (tags?.length) {
    md += `\n\n#### Tags\n${tags.map(t => `#${t}`).join(' ')}`;
  }

  return md.trim();
}

app.get('/', (_req, res) => {
  res.send(`
    <h2>🚀 IntelliTriage API (Outlook Only)</h2>
    <ul>
      <li><a href="/api/latest-outlook-ticket">📨 Fetch & Enrich Outlook Ticket</a></li>
    </ul>
  `);
});

app.get('/api/latest-outlook-ticket', async (_req, res) => {
  try {
    const token = await getOutlookAccessToken();
    const client = Client.init({ authProvider: done => done(null, token) });

    const inbox = await client
      .api('/me/mailfolders/inbox/messages?$top=1&$filter=isRead eq false')
      .get();

    if (!inbox.value.length) {
      return res.status(404).json({ error: 'No unread Outlook emails found.' });
    }

    const msg = inbox.value[0];
    const html = msg.body?.content || '';
    const subject = msg.subject || 'No Subject';

    const plainText = htmlToText(html, {
      wordwrap: 120,
      selectors: [{ selector: 'a', options: { ignoreHref: true } }],
    });

    console.log(`📩 Processing: ${subject}`);

    const enriched = await analyzeTicket(plainText);

    saveEnrichedTicket(enriched, subject, '9cae6c59-2264-4fb3-b29f-2c7131d8d205')
      .catch(err => console.error('⚠️ Failed to save to Supabase:', err.message));

    res.json(enriched);
  } catch (err: any) {
    console.error('❌ Outlook fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/send-to-teamwork', async (req, res) => {
  const { description, title } = req.body;
  const enriched = JSON.parse(description);

  const {
    TEAMWORK_API_KEY,
    TEAMWORK_PROJECT_ID,
    TEAMWORK_TASKLIST_ID,
    TEAMWORK_DOMAIN,
  } = process.env;

  if (!TEAMWORK_API_KEY || !TEAMWORK_PROJECT_ID || !TEAMWORK_TASKLIST_ID || !TEAMWORK_DOMAIN) {
    console.error('🚨 Missing Teamwork environment variables');
    return res.status(500).json({ error: 'Teamwork credentials not configured' });
  }

  let content = (title || enriched.summary || 'AI Enriched Ticket')
    .replace(/[^a-zA-Z0-9\s.,!?-]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  if (content.length > 255) content = content.slice(0, 252) + '...';
  if (!content) content = 'AI Enriched Ticket';

  const allowedPriorities = ['low', 'medium', 'high'];
  let priority = (enriched.priority?.level || 'medium').toLowerCase();
  if (!allowedPriorities.includes(priority)) priority = 'medium';

  const tags = enriched.tags || [];

  const body = formatEnrichedTicketToMarkdown(enriched);

  const authHeader = 'Basic ' + Buffer.from(`${TEAMWORK_API_KEY}:`).toString('base64');
  const url = `https://${TEAMWORK_DOMAIN}.teamwork.com/tasklists/${TEAMWORK_TASKLIST_ID}/tasks.json`;

  const assigneeId = enriched.routing?.assigneeId || null;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const startDate = `${yyyy}${mm}${dd}`;

  const payload: any = {
    'todo-item': {
      content,
      description: body,
      projectId: Number(TEAMWORK_PROJECT_ID),
      priority,
      tags,
      'start-date': startDate,
    },
  };

  if (assigneeId) {
    payload['todo-item'].responsiblePartyIds = [assigneeId];
  }

  try {
    console.log('📤 Creating Teamwork task:', content);

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      let parsed;
      try { parsed = JSON.parse(errorText); } catch { parsed = { raw: errorText }; }
      console.error('❌ Teamwork error:', parsed);
      return res.status(500).json({ error: 'Failed to create Teamwork task', details: parsed });
    }

    const data = await resp.json();
    console.log('✅ Teamwork task created:', data);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('🔥 Teamwork call failed:', err);
    res.status(500).json({ error: 'Teamwork request failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 IntelliTriage backend running at http://localhost:${PORT}`);
});
