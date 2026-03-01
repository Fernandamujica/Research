import { useState, useCallback } from 'react';
import { useResearch } from '../context/ResearchContext';
import { COUNTRY_EMOJI, COUNTRY_LABELS, SQUAD_LABELS } from '../types/research';
import type { Country } from '../types/research';
import { getApiKey } from '../utils/aiGenerate';

const COUNTRY_LIST: Country[] = ['brasil', 'mexico', 'usa', 'colombia'];

type Mode = 'summary' | 'compare';

export function CrossGeoInsightsPage() {
  const { researches } = useResearch();
  const [mode, setMode] = useState<Mode>('summary');
  const [selectedCountry, setSelectedCountry] = useState<Country>('brasil');
  const [compareCountries, setCompareCountries] = useState<Country[]>(['brasil', 'mexico']);
  const [compareTopic, setCompareTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCompareCountry = (c: Country) => {
    setCompareCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const buildContext = useCallback(
    (countries: Country[]) => {
      return countries
        .map((country) => {
          const countryResearches = researches.filter((r) => r.country === country);
          if (countryResearches.length === 0) return '';
          const summaries = countryResearches
            .map(
              (r) =>
                `- "${r.title}" (${r.squad ? SQUAD_LABELS[r.squad] : 'N/A'}, ${r.date})\n  Description: ${r.description}\n  Key learnings: ${r.keyLearnings.join('; ')}`
            )
            .join('\n');
          return `## ${COUNTRY_LABELS[country]} (${countryResearches.length} studies)\n${summaries}`;
        })
        .filter(Boolean)
        .join('\n\n');
    },
    [researches]
  );

  const runAnalysis = useCallback(async () => {
    const key = getApiKey();
    if (!key) {
      setError('No Gemini API key configured. Go to Settings (⚙️) to add your key.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      let prompt: string;

      if (mode === 'summary') {
        const context = buildContext([selectedCountry]);
        if (!context) {
          setError(`No research found for ${COUNTRY_LABELS[selectedCountry]}.`);
          setLoading(false);
          return;
        }
        prompt = `You are a senior UX research analyst at Nubank. Analyze all the research below for ${COUNTRY_LABELS[selectedCountry]} and provide:

1. **Key Themes** — The main themes that emerge across all studies
2. **Patterns & Trends** — Recurring patterns, pain points, and opportunities
3. **Strategic Recommendations** — Actionable recommendations based on the evidence

${context}

Write in a clear, professional tone. Use markdown formatting. Be specific and data-backed where possible.`;
      } else {
        const context = buildContext(compareCountries);
        if (!context) {
          setError('No research found for the selected countries.');
          setLoading(false);
          return;
        }
        prompt = `You are a senior UX research analyst at Nubank. Compare research findings across countries${compareTopic ? ` focusing on the topic: "${compareTopic}"` : ''}.

Create a comparative analysis with:
1. **Overview** — Brief summary of research in each country
2. **Comparative Table** — A markdown table comparing key findings by country${compareTopic ? ` related to "${compareTopic}"` : ''}
3. **Unique Insights** — What's unique to each country
4. **Cross-Country Patterns** — What's consistent across all countries
5. **Recommendations** — How to leverage learnings globally

${context}

Write in a clear, professional tone. Use markdown tables where helpful. Be specific.`;
      }

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
              { role: 'system', content: 'You are a senior UX research analyst at Nubank. Write in clear, professional markdown.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 2048,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '';
      if (!text) throw new Error('AI returned no content.');
      setResult(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }, [mode, selectedCountry, compareCountries, compareTopic, buildContext]);

  const sectionStyle: React.CSSProperties = {
    padding: '1.5rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
          }}
        >
          <span className="text-gradient-primary">🌐 Cross-geo Insights</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)', fontWeight: 300 }}>
          AI-powered analysis comparing research findings across countries
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--gray-100)', borderRadius: 9999, padding: '0.25rem' }}>
          {([
            { key: 'summary', label: 'Country Summary' },
            { key: 'compare', label: 'Compare Countries' },
          ] as const).map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setResult(''); setError(''); }}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontWeight: active ? 500 : 400,
                  fontSize: '0.85rem',
                  border: 'none',
                  borderRadius: 9999,
                  background: active ? 'white' : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  color: active ? 'var(--purple-700)' : 'var(--gray-500)',
                  transition: 'all 0.2s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <section className="card-shadow" style={sectionStyle}>
        {mode === 'summary' ? (
          <>
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Select a country to analyze
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {COUNTRY_LIST.map((c) => {
                const active = selectedCountry === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCountry(c)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 9999,
                      border: active ? 'none' : '1px solid var(--gray-200)',
                      background: active ? 'var(--purple-600)' : 'var(--white)',
                      color: active ? 'white' : 'var(--gray-700)',
                      fontWeight: active ? 500 : 400,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '1rem' }}>
              {researches.filter((r) => r.country === selectedCountry).length} studies available for {COUNTRY_LABELS[selectedCountry]}
            </p>
          </>
        ) : (
          <>
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Select countries to compare
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {COUNTRY_LIST.map((c) => {
                const active = compareCountries.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCompareCountry(c)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 9999,
                      border: active ? 'none' : '1px solid var(--gray-200)',
                      background: active ? 'var(--purple-600)' : 'var(--white)',
                      color: active ? 'white' : 'var(--gray-700)',
                      fontWeight: active ? 500 : 400,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={compareTopic}
              onChange={(e) => setCompareTopic(e.target.value)}
              placeholder="Optional: focus on a topic (e.g. onboarding, transfers, CSAT...)"
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            />
          </>
        )}

        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading || (mode === 'compare' && compareCountries.length < 2)}
          style={{
            padding: '0.625rem 1.5rem',
            borderRadius: 9999,
            border: 'none',
            background: loading ? 'var(--gray-300)' : 'var(--purple-600)',
            color: 'white',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              Analyzing...
            </>
          ) : (
            <>✨ {mode === 'summary' ? 'Generate Summary' : 'Compare Countries'}</>
          )}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius)',
            color: '#dc2626',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <section
          className="card-shadow"
          style={{
            ...sectionStyle,
            marginTop: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--gray-700)' }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }}
          />
        </section>
      )}
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-weight:600;font-size:1rem;margin:1.25rem 0 0.5rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-weight:700;font-size:1.1rem;margin:1.5rem 0 0.5rem">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\| (.+)$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      const isHeader = cells.every((c) => /^-+$/.test(c));
      if (isHeader) return '';
      const tag = 'td';
      return `<tr>${cells.map((c) => `<${tag} style="padding:0.375rem 0.75rem;border:1px solid var(--gray-200);font-size:0.8rem">${c}</${tag}>`).join('')}</tr>`;
    })
    .replace(/((<tr>.*<\/tr>\s*)+)/g, '<table style="border-collapse:collapse;width:100%;margin:0.75rem 0;border-radius:var(--radius);overflow:hidden">$1</table>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1.25rem;margin-bottom:0.25rem">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:1.25rem;margin-bottom:0.25rem">$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
