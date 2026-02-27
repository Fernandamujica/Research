// ── API key storage ────────────────────────────────────────────────────────
const LS_KEY = 'gba-gemini-key';

export function getApiKey(): string {
  return localStorage.getItem(LS_KEY) ?? '';
}

export function setApiKey(key: string) {
  localStorage.setItem(LS_KEY, key.trim());
}

// ── Gemini response types ──────────────────────────────────────────────────
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

// ── Gemini AI call ─────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Main: auto-fill from PDF text or title ─────────────────────────────────
export async function autoFillFromPdf(params: {
  pdfText: string;
  title: string;
}): Promise<AiFilledFields> {
  const { pdfText, title } = params;

  const context = pdfText.trim()
    ? `Research document content (first ~6000 chars):\n${pdfText.slice(0, 6000)}`
    : `Research title: "${title}"`;

  const prompt = `You are a UX research analyst at Nubank. Based on the following research material, extract structured information.

${context}

Return ONLY a valid JSON object with exactly these keys (no markdown, no extra text):
{
  "title": "Research title if clearly stated, else null",
  "description": "2-3 sentence summary of what this research is about, its goal and main finding",
  "date": "Date in YYYY-MM-DD format if found, else null",
  "country": "One of: brasil, mexico, usa, colombia, global — whichever is most relevant, else null",
  "squad": "One of the exact keys: money-in, mb-account-xp, payments-assistant, troy, tout, cross-gba, payments-core-infra — if clearly mentioned, else null",
  "methodology": "Short description of research method (e.g. 'Qualitative interviews, n=20'), else null",
  "team": ["Person name 1", "Person name 2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keyLearnings": [
    "Concise actionable insight 1",
    "Concise actionable insight 2",
    "Concise actionable insight 3",
    "Concise actionable insight 4"
  ]
}

Rules:
- title: extract verbatim from the document if present; null if not clearly stated
- description: plain text, 2-3 sentences, no bullet points
- date: YYYY-MM-DD format only; null if not found
- country: must be exactly one of the listed values; null if unclear
- squad: must be exactly one of the listed key values; null if not mentioned
- methodology: 1 sentence; null if not found
- team: list of people names found as authors/researchers; empty array [] if none found
- tags: 4-6 lowercase short tags (e.g. "CSAT", "transfers", "Colombia", "qualitative")
- keyLearnings: 3-5 sentences, each starting with the main insight, data-backed when possible`;

  const raw = await callGemini(prompt);

  try {
    // Extract JSON even if Gemini wraps it in markdown code blocks
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    const parsed = JSON.parse(match[0]) as AiFilledFields;
    return parsed;
  } catch {
    throw new Error(`Could not parse AI response: ${raw.slice(0, 200)}`);
  }
}

// ── Local fallback: extractive summarization (no API needed) ───────────────
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
