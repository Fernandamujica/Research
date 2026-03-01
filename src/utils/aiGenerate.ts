import { getGeminiApiKey } from './settings';

export function getApiKey(): string {
  return getGeminiApiKey();
}

export interface AiFilledFields {
  title?: string;
  description?: string;
  date?: string;
  country?: string;
  squad?: string;
  methodology?: string;
  team?: string[];
  tags?: string[];
  keyLearnings?: string[];
}

const TOOL_SCHEMA = {
  type: 'function' as const,
  function: {
    name: 'extract_research_data',
    description: 'Extract structured data from a UX research document',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Research title verbatim from the document' },
        description: { type: 'string', description: '2-3 sentence summary of the research goal and main finding' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format if found' },
        country: {
          type: 'string',
          enum: ['brasil', 'mexico', 'usa', 'colombia', 'global'],
          description: 'Most relevant country',
        },
        squad: {
          type: 'string',
          enum: ['money-in', 'mb-account-xp', 'payments-assistant', 'troy', 'tout', 'cross-gba', 'payments-core-infra', 'external', 'other'],
          description: 'Squad name if clearly mentioned',
        },
        methodology: { type: 'string', description: 'Short description of research method (e.g. "Qualitative interviews, n=20")' },
        team: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of people found as authors/researchers',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '4-6 lowercase short tags (e.g. "CSAT", "transfers", "Colombia")',
        },
        keyLearnings: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 concise actionable insights, data-backed when possible',
        },
      },
      required: ['title', 'description', 'tags', 'keyLearnings'],
    },
  },
};

const SYSTEM_PROMPT = `You are a UX Research document parser for Nubank's GBA (Global Banking & Account) team.
Your job is to extract structured data from research documents.
Always use the extract_research_data tool to return your analysis.
Be concise and factual. Extract only what is clearly present in the document.
For tags, use short lowercase terms. For key learnings, write actionable insights.`;

async function callGeminiWithTools(pdfText: string, title: string): Promise<AiFilledFields> {
  const key = getApiKey();
  if (!key) throw new Error('No Gemini API key configured. Go to Settings to add your key.');

  const context = pdfText.trim()
    ? `Research document content:\n\n${pdfText.slice(0, 15000)}`
    : `Research title: "${title}"`;

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Parse this research document and extract all structured data:\n\n${context}` },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'function', function: { name: 'extract_research_data' } },
        temperature: 0.2,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments) as AiFilledFields;
  }

  const fallbackText = data?.choices?.[0]?.message?.content ?? '';
  if (fallbackText) {
    const match = fallbackText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AiFilledFields;
  }

  throw new Error('AI returned no structured data');
}

export async function autoFillFromPdf(params: {
  pdfText: string;
  title: string;
}): Promise<AiFilledFields> {
  return callGeminiWithTools(params.pdfText, params.title);
}

// Local fallback: extractive summarization (no API needed)
const RESEARCH_KEYWORDS = [
  'consumers', 'consumer', 'users', 'user', 'customers', 'customer',
  'prefer', 'preferred', 'behavior', 'behaviour', 'insight', 'insights',
  'majority', 'most', 'significant', 'key', 'main', 'primary',
  'increase', 'decrease', 'grew', 'declined', 'improved',
  'found', 'shows', 'indicates', 'reveals', 'suggests',
  'percent', '%', 'rate', 'adoption', 'usage',
  'pain point', 'opportunity', 'barrier', 'challenge',
  'trust', 'satisfaction', 'engagement', 'awareness',
  'digital', 'mobile', 'payment', 'financial', 'bank',
];

function scoreSentence(sentence: string, index: number, total: number): number {
  const lower = sentence.toLowerCase();
  let score = (1 - index / total) * 2;
  const words = sentence.split(/\s+/).length;
  if (words >= 8 && words <= 40) score += 2;
  else if (words >= 5) score += 1;
  for (const kw of RESEARCH_KEYWORDS) {
    if (lower.includes(kw)) score += 1;
  }
  if (/\d/.test(sentence)) score += 1.5;
  if (words < 5) score -= 3;
  return score;
}

export function extractKeyLearningsFromText(rawText: string): string[] {
  if (!rawText.trim()) return [];
  const sentences = rawText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.split(/\s+/).length >= 4);
  if (sentences.length === 0) return [];
  const scored = sentences.map((s, i) => ({
    text: s,
    score: scoreSentence(s, i, sentences.length),
  }));
  scored.sort((a, b) => b.score - a.score);
  const topIndices = new Set(scored.slice(0, 4).map((s) => sentences.indexOf(s.text)));
  return sentences.filter((_, i) => topIndices.has(i)).slice(0, 4);
}
