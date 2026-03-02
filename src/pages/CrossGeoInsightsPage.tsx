import { useState, useCallback } from 'react';
import { useResearch } from '../context/ResearchContext';
import { COUNTRY_EMOJI, COUNTRY_LABELS, SQUAD_LABELS } from '../types/research';
import type { Country } from '../types/research';
import { getApiKey } from '../utils/aiGenerate';

const COUNTRY_LIST: Country[] = ['brasil', 'mexico', 'usa', 'colombia', 'global'];

const COUNTRY_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  Brasil: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', accent: '#16a34a' },
  Brazil: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', accent: '#16a34a' },
  Mexico: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', accent: '#d97706' },
  México: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', accent: '#d97706' },
  USA: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#2563eb' },
  Colombia: { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', accent: '#db2777' },
};

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

  const getCountryResearchCount = useCallback(
    (country: Country) => researches.filter((r) => r.country === country).length,
    [researches]
  );

  const buildContext = useCallback(
    (countries: Country[], maxPerCountry = 10) => {
      const externalSquads = ['external', 'other'];
      return countries
        .map((country) => {
          const countryResearches = researches
            .filter((r) => r.country === country)
            .sort((a, b) => (b.date > a.date ? 1 : -1))
            .slice(0, maxPerCountry);
          if (countryResearches.length === 0) return '';
          const summaries = countryResearches
            .map((r) => {
              const ext = r.squad && externalSquads.includes(r.squad) ? ' [EXTERNAL]' : '';
              const squadName = r.squad ? (SQUAD_LABELS[r.squad] ?? r.squad) : 'N/A';
              return `- "${r.title}"${ext} (${squadName}, ${r.date})\n  Description: ${r.description}\n  Key learnings: ${r.keyLearnings.join('; ')}`;
            })
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
      setError('AI features are temporarily disabled. They will be re-enabled once the site is hosted on Nubank infrastructure.');
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
        prompt = `You are a senior UX research analyst at Nubank. Analyze all the research below for ${COUNTRY_EMOJI[selectedCountry]} ${COUNTRY_LABELS[selectedCountry]} and provide:

## 🔍 Key Themes
The main themes that emerge across all studies

## 📊 Patterns & Trends
Recurring patterns, pain points, and opportunities

## 🎯 Strategic Recommendations
Actionable recommendations based on the evidence

${context}

IMPORTANT formatting rules:
- Use ## for section headers, always with an emoji prefix
- Use **bold** for key terms
- Use bullet points (- ) for lists
- Be specific and data-backed where possible
- Write in a clear, professional tone`;
      } else {
        const countriesWithData = compareCountries.filter((c) => getCountryResearchCount(c) > 0);
        if (countriesWithData.length === 0) {
          setError('No research found for any of the selected countries.');
          setLoading(false);
          return;
        }
        if (countriesWithData.length < 2) {
          const missing = compareCountries.filter((c) => getCountryResearchCount(c) === 0);
          setError(`Cannot compare: ${missing.map((c) => COUNTRY_LABELS[c]).join(', ')} ha${missing.length === 1 ? 's' : 've'} no research yet. Add research for at least 2 countries to compare.`);
          setLoading(false);
          return;
        }
        const context = buildContext(countriesWithData, 8);
        const countryEmojis = countriesWithData.map((c) => `${COUNTRY_EMOJI[c]} ${COUNTRY_LABELS[c]}`).join(' vs ');
        prompt = `Compare the UX research findings between ${countryEmojis}${compareTopic ? ` with focus on: "${compareTopic}"` : ''}.

Here is the research data for each country:

${context}

Based ONLY on the research data above, write a structured comparison with these sections:

## 🌎 Overview
One paragraph per country summarizing their research. Use flag emojis.

## 📊 Comparative Table
A markdown table comparing key dimensions across the countries. Use flag emojis in column headers.

## 💡 Unique Insights per Country
Use ### with flag emoji for each country. What stands out in each?

## 🔗 Cross-Country Patterns
What themes or findings are consistent across countries?

## 🎯 Recommendations
Actionable recommendations for leveraging these learnings globally.

Use **bold** for key terms, bullet points for lists, and markdown tables with | syntax.`;
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
              { role: 'system', content: 'You are a senior UX research analyst. Write structured, data-backed markdown analysis.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 8192,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        let msg = `Gemini error ${res.status}`;
        try {
          const parsed = JSON.parse(errBody);
          msg = parsed?.error?.message ?? msg;
        } catch { /* use default */ }
        throw new Error(msg);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '';
      if (!text) throw new Error('AI returned no content. Try again or select different countries.');
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {COUNTRY_LIST.map((c) => {
                const active = compareCountries.includes(c);
                const count = getCountryResearchCount(c);
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
                      color: active ? 'white' : count === 0 ? 'var(--gray-400)' : 'var(--gray-700)',
                      fontWeight: active ? 500 : 400,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      opacity: count === 0 && !active ? 0.6 : 1,
                    }}
                  >
                    {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
                    <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem', opacity: 0.7 }}>({count})</span>
                  </button>
                );
              })}
            </div>
            {compareCountries.length > 0 && (() => {
              const withData = compareCountries.filter((c) => getCountryResearchCount(c) > 0);
              const noData = compareCountries.filter((c) => getCountryResearchCount(c) === 0);
              return (
                <div style={{ marginBottom: '0.75rem' }}>
                  {withData.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500, marginBottom: noData.length > 0 ? '0.25rem' : 0 }}>
                      ✓ {withData.map((c) => `${COUNTRY_EMOJI[c]} ${COUNTRY_LABELS[c]} (${getCountryResearchCount(c)})`).join('  ·  ')}
                    </p>
                  )}
                  {noData.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                      ✗ {noData.map((c) => `${COUNTRY_EMOJI[c]} ${COUNTRY_LABELS[c]}`).join(', ')} — no research yet
                    </p>
                  )}
                </div>
              );
            })()}
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
          disabled={loading || (mode === 'compare' && compareCountries.filter((c) => getCountryResearchCount(c) > 0).length < 2)}
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
        <div style={{ marginTop: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {parseResultSections(result).map((section, i) => (
            <section
              key={i}
              className="card-shadow"
              style={{
                padding: '1.25rem 1.5rem',
                background: section.color?.bg ?? 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${section.color?.border ?? 'var(--gray-200)'}`,
              }}
            >
              {section.heading && (
                <h2 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: section.color?.text ?? 'var(--gray-800)',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${section.color?.border ?? 'var(--gray-100)'}`,
                  letterSpacing: '-0.01em',
                }}>
                  {section.heading}
                </h2>
              )}
              <div
                style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--gray-700)' }}
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface ResultSection {
  heading: string;
  html: string;
  color?: { bg: string; border: string; text: string };
}

const SECTION_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  'overview':        { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  'visão':           { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  'key themes':      { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  'temas':           { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  'patterns':        { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'padrões':         { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'comparative':     { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  'comparativ':      { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  'unique':          { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d' },
  'único':           { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d' },
  'cross-country':   { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  'cross country':   { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  'recommend':       { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  'recomend':        { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  'strategic':       { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  'estratég':        { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
};

function getSectionTheme(heading: string) {
  const lower = heading.toLowerCase();
  for (const [key, theme] of Object.entries(SECTION_THEMES)) {
    if (lower.includes(key)) return theme;
  }
  return { bg: 'var(--white)', border: 'var(--gray-200)', text: 'var(--gray-800)' };
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes('|')) return false;
  const parts = t.replace(/^\|/, '').replace(/\|$/, '').split('|');
  return parts.length >= 2;
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').every((c) => /^\s*[-:]{2,}\s*$/.test(c));
}

function extractCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function renderTableBlock(rows: string[]): string {
  if (rows.length === 0) return '';

  let headerRow: string | null = null;
  const dataRows: string[] = [];

  if (rows.length >= 2 && isSeparatorRow(rows[1])) {
    headerRow = rows[0];
    for (let i = 2; i < rows.length; i++) {
      if (!isSeparatorRow(rows[i])) dataRows.push(rows[i]);
    }
  } else if (rows.length >= 3 && isSeparatorRow(rows[2])) {
    headerRow = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (!isSeparatorRow(rows[i])) dataRows.push(rows[i]);
    }
  } else {
    headerRow = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (!isSeparatorRow(rows[i])) dataRows.push(rows[i]);
    }
  }

  const thStyle = 'padding:0.625rem 0.875rem;background:var(--purple-600);color:white;font-weight:600;text-align:left;font-size:0.8rem';
  const tdStyle = 'padding:0.5rem 0.875rem;border-bottom:1px solid var(--gray-100);font-size:0.8rem';

  let html = '<div style="overflow-x:auto;margin:0.75rem 0"><table style="border-collapse:collapse;width:100%;border-radius:8px;overflow:hidden;font-size:0.8rem">';

  if (headerRow) {
    const cells = extractCells(headerRow);
    html += `<thead><tr>${cells.map((c) => `<th style="${thStyle}">${applyInline(c)}</th>`).join('')}</tr></thead>`;
  }

  html += '<tbody>';
  let even = false;
  for (const row of dataRows) {
    const cells = extractCells(row);
    const bg = even ? 'background:var(--gray-50);' : '';
    html += `<tr>${cells.map((c) => `<td style="${tdStyle};${bg}">${applyInline(c)}</td>`).join('')}</tr>`;
    even = !even;
  }
  html += '</tbody></table></div>';

  return html;
}

function bodyToHtml(body: string): string {
  const lines = body.split('\n');
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && (isTableRow(lines[i].trim()) || isSeparatorRow(lines[i].trim()))) {
        tableLines.push(lines[i]);
        i++;
      }
      html += renderTableBlock(tableLines);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      const countryMatch = Object.entries(COUNTRY_COLORS).find(([name]) => text.includes(name));
      const accent = countryMatch ? countryMatch[1].accent : 'var(--purple-600)';
      html += `<h3 style="font-weight:700;font-size:0.95rem;margin:1rem 0 0.375rem;color:${accent};display:flex;align-items:center;gap:0.375rem">${applyInline(text)}</h3>`;
    } else if (trimmed.startsWith('- ')) {
      const content = trimmed.slice(2);
      html += `<div style="display:flex;align-items:flex-start;gap:0.5rem;margin:0.25rem 0 0.25rem 0.25rem"><span style="color:var(--purple-400);font-size:0.7rem;margin-top:0.35rem;flex-shrink:0">●</span><span>${applyInline(content)}</span></div>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1] ?? '';
      const content = trimmed.replace(/^\d+\.\s/, '');
      html += `<div style="display:flex;align-items:flex-start;gap:0.5rem;margin:0.25rem 0 0.25rem 0.25rem"><span style="background:var(--purple-100);color:var(--purple-700);font-size:0.7rem;font-weight:700;min-width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:0.15rem">${num}</span><span>${applyInline(content)}</span></div>`;
    } else if (trimmed === '') {
      html += '<div style="height:0.375rem"></div>';
    } else {
      html += `<p style="margin:0.25rem 0">${applyInline(trimmed)}</p>`;
    }

    i++;
  }

  return html;
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--gray-800)">$1</strong>');
}

function parseResultSections(md: string): ResultSection[] {
  const lines = md.split('\n');
  const sections: ResultSection[] = [];
  let currentHeading = '';
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join('\n').trim();
    if (body || currentHeading) {
      sections.push({
        heading: currentHeading,
        html: bodyToHtml(body),
        color: currentHeading ? getSectionTheme(currentHeading) : undefined,
      });
    }
  };

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      flush();
      currentHeading = h2Match[1];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  return sections;
}
