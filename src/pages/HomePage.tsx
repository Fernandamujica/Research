import { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import {
  COUNTRY_EMOJI,
  COUNTRY_LABELS,
  SQUAD_LABELS,
  SQUAD_COLORS,
  RESEARCHERS,
  type Country,
  type Squad,
  type Researcher,
} from '../types/research';
import { PLANNED_RESEARCH, type PlannedResearch } from '../data/plannedResearch';

const SQUADS = Object.keys(SQUAD_LABELS) as Squad[];
const COUNTRY_LIST = Object.keys(COUNTRY_LABELS) as Country[];

const LS_DELETED = 'rr-suggestions-deleted';
const LS_CUSTOM = 'rr-suggestions-custom';

function loadDeleted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_DELETED) ?? '[]')); }
  catch { return new Set(); }
}
function loadCustom(): PlannedResearch[] {
  try { return JSON.parse(localStorage.getItem(LS_CUSTOM) ?? '[]'); }
  catch { return []; }
}

const COUNTRIES: { value: Country | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Countries', emoji: '' },
  { value: 'brasil', label: 'Brasil', emoji: '🇧🇷' },
  { value: 'mexico', label: 'Mexico', emoji: '🇲🇽' },
  { value: 'usa', label: 'USA', emoji: '🇺🇸' },
  { value: 'colombia', label: 'Colombia', emoji: '🇨🇴' },
  { value: 'global', label: 'Global', emoji: '🌎' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SuggestionCard({
  suggestion,
  onSubmit,
  onDelete,
}: {
  suggestion: PlannedResearch;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  const countryFlags = suggestion.countries.map((c) => COUNTRY_EMOJI[c]).join(' ');
  return (
    <div
      style={{
        padding: '0.625rem 0.875rem',
        background: '#fafafa',
        borderRadius: 'var(--radius)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        flexWrap: 'wrap',
        opacity: 0.82,
      }}
    >
      {/* Pending dot */}
      <span
        title="Not yet submitted"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#d1d5db',
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <span
        style={{
          padding: '0.15rem 0.45rem',
          borderRadius: 9999,
          background: '#f3f4f6',
          color: '#6b7280',
          fontSize: '0.68rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          border: '1px solid #e5e7eb',
        }}
      >
        {SQUAD_LABELS[suggestion.squad]}
      </span>
      <span style={{ fontSize: '0.8rem', flexShrink: 0, color: '#9ca3af' }}>{countryFlags}</span>
      <span style={{ fontWeight: 500, fontSize: '0.85rem', flex: 1, minWidth: 120, color: '#6b7280' }}>
        {suggestion.title}
      </span>
      <span style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>
        {suggestion.researcher}
      </span>
      <button
        type="button"
        onClick={onSubmit}
        style={{
          padding: '0.25rem 0.625rem',
          borderRadius: 'var(--radius)',
          border: '1px solid #d1d5db',
          background: 'white',
          color: '#6b7280',
          fontWeight: 500,
          fontSize: '0.75rem',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        + Submit
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Remove suggestion"
        style={{
          padding: '0.25rem 0.4rem',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'transparent',
          color: '#d1d5db',
          fontSize: '0.7rem',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

const SQUAD_FILTER: { value: Squad | 'all'; label: string }[] = [
  { value: 'all', label: 'All Squads' },
  ...Object.entries(SQUAD_LABELS).map(([k, v]) => ({ value: k as Squad, label: v })),
];

export function HomePage() {
  const { researches } = useResearch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Pick up ?tag= from URL (e.g. coming from detail page)
  useEffect(() => {
    const urlTag = searchParams.get('tag');
    if (urlTag) {
      setTagFilter(urlTag);
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeTab, setActiveTab] = useState<'gba' | 'external'>('gba');
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<Country | 'all'>('all');
  const [squadFilter, setSquadFilter] = useState<Squad | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [suggestionSquad, setSuggestionSquad] = useState<Squad | 'all'>('all');

  const EXTERNAL_SQUADS: Squad[] = ['external', 'other'];
  const isExternal = (squad?: Squad) => !!squad && EXTERNAL_SQUADS.includes(squad);

  const selectTag = useCallback((tag: string) => {
    setTagFilter((prev) => (prev === tag ? '' : tag));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Suggestion management
  const [deletedIds, setDeletedIds] = useState<Set<string>>(loadDeleted);
  const [customSuggestions, setCustomSuggestions] = useState<PlannedResearch[]>(loadCustom);
  const [showAddSuggestion, setShowAddSuggestion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSquad, setNewSquad] = useState<Squad>('cross-gba');
  const [newResearcher, setNewResearcher] = useState<Researcher>('Yas');
  const [newCountries, setNewCountries] = useState<Country[]>(['brasil']);

  const deleteSuggestion = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(LS_DELETED, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const addSuggestion = useCallback(() => {
    if (!newTitle.trim()) return;
    const item: PlannedResearch = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      question: '',
      squad: newSquad,
      researcher: newResearcher,
      countries: newCountries.length ? newCountries : ['brasil'],
      tags: [],
    };
    setCustomSuggestions((prev) => {
      const next = [item, ...prev];
      localStorage.setItem(LS_CUSTOM, JSON.stringify(next));
      return next;
    });
    setNewTitle('');
    setShowAddSuggestion(false);
  }, [newTitle, newSquad, newResearcher, newCountries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return researches.filter((r) => {
      const tabMatch = activeTab === 'external' ? isExternal(r.squad) : !isExternal(r.squad);
      const matchCountry = countryFilter === 'all' || r.country === countryFilter;
      const matchSquad = squadFilter === 'all' || r.squad === squadFilter;
      const matchTag = !tagFilter || r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase());
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.team.some((t) => t.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.country.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.methodology.toLowerCase().includes(q) ||
        r.keyLearnings.some((k) => k.toLowerCase().includes(q)) ||
        (r.squad ? SQUAD_LABELS[r.squad].toLowerCase().includes(q) : false) ||
        (r.researcher ? r.researcher.toLowerCase().includes(q) : false);
      return tabMatch && matchCountry && matchSquad && matchTag && matchSearch;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researches, search, countryFilter, squadFilter, tagFilter, activeTab]);

  // Suggestions: planned items not yet submitted (compare by title)
  const submittedTitles = useMemo(
    () => new Set(researches.map((r) => r.title.toLowerCase().trim())),
    [researches]
  );

  const allSuggestions = useMemo(
    () => [...customSuggestions, ...PLANNED_RESEARCH],
    [customSuggestions]
  );

  const suggestions = useMemo(() => {
    return allSuggestions.filter((p) => {
      const notDeleted = !deletedIds.has(p.id);
      const notSubmitted = !submittedTitles.has(p.title.toLowerCase().trim());
      const matchSquad = suggestionSquad === 'all' || p.squad === suggestionSquad;
      return notDeleted && notSubmitted && matchSquad;
    });
  }, [allSuggestions, deletedIds, submittedTitles, suggestionSquad]);

  const latestResearch = useMemo(
    () => [...filtered].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 3),
    [filtered]
  );


  const SQUAD_FILTER_GBA: { value: Squad | 'all'; label: string }[] = [
    { value: 'all', label: 'All Squads' },
    ...Object.entries(SQUAD_LABELS)
      .filter(([k]) => !EXTERNAL_SQUADS.includes(k as Squad))
      .map(([k, v]) => ({ value: k as Squad, label: v })),
  ];

  const SQUAD_FILTER_EXTERNAL: { value: Squad | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'external', label: 'External' },
    { value: 'other', label: 'Other' },
  ];

  const activeSquadFilter = activeTab === 'external' ? SQUAD_FILTER_EXTERNAL : SQUAD_FILTER_GBA;

  const noFiltersActive = !search && countryFilter === 'all' && squadFilter === 'all' && !tagFilter;

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* ── Hero (gradient background) ────────────────── */}
      <div
        className="bg-gradient-hero"
        style={{
          textAlign: 'center',
          padding: '3rem 1rem 2.5rem',
          margin: '-1.5rem -1.5rem 0',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '0.75rem',
          }}
        >
          <span className="text-gradient-primary">Research Hub</span>
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--gray-500)',
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          Repositorio centralizado de pesquisas do time de UX Research do GBA
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0.5rem' }}>

      {/* ── Controls ──────────────────────────────────── */}
      <div style={{ marginTop: '-1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--gray-100)',
              borderRadius: 9999,
              padding: '0.25rem',
            }}
          >
            {([
              { key: 'gba', label: 'GBA Research' },
              { key: 'external', label: 'External Research' },
            ] as const).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSquadFilter('all');
                    setTagFilter('');
                  }}
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
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by title, tags, team, country, methodology, key learnings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 9999,
            border: '1px solid var(--gray-200)',
            background: 'var(--white)',
            fontSize: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        />

        {/* Active tag filter */}
        {tagFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Filtering by tag:</span>
            <button
              type="button"
              onClick={() => setTagFilter('')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 9999,
                background: 'var(--purple-600)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tagFilter} ✕
            </button>
          </div>
        )}

        {/* Country Filter — pill buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {COUNTRIES.map((c) => {
            const active = countryFilter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCountryFilter(c.value as Country | 'all')}
                className="card-shadow"
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: 9999,
                  border: active ? 'none' : '1px solid var(--gray-200)',
                  background: active ? 'var(--purple-600)' : 'var(--white)',
                  color: active ? 'white' : 'var(--gray-700)',
                  fontWeight: active ? 500 : 400,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>

        {/* Squad Filter — subtle dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
            Squad:
          </span>
          <select
            value={squadFilter}
            onChange={(e) => setSquadFilter(e.target.value as Squad | 'all')}
            style={{
              height: 32,
              padding: '0 2rem 0 0.75rem',
              borderRadius: 9999,
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              fontSize: '0.8rem',
              color: 'var(--gray-700)',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value="all">All Squads</option>
            {activeSquadFilter.filter(s => s.value !== 'all').map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Latest Research — only when no filters active */}
      {latestResearch.length > 0 && noFiltersActive && (
        <section style={{ marginTop: '2.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            🕐 Latest Research
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {latestResearch.map((r) => (
              <Link
                key={r.id}
                to={`/pesquisa/${r.id}`}
                style={{
                  display: 'block',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {r.pptScreenshots && r.pptScreenshots.length > 0 ? (
                  <img
                    src={r.pptScreenshots[0]}
                    alt={r.title}
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      objectFit: 'cover',
                      display: 'block',
                      borderBottom: '1px solid var(--gray-100)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      background: 'var(--purple-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      borderBottom: '1px solid var(--gray-100)',
                    }}
                  >
                    {COUNTRY_EMOJI[r.country]}
                  </div>
                )}
                <div style={{ padding: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem' }}>{COUNTRY_EMOJI[r.country]}</span>
                    {r.squad && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        padding: '0.15rem 0.45rem', borderRadius: 9999,
                        background: SQUAD_COLORS[r.squad].bg,
                        color: SQUAD_COLORS[r.squad].text,
                        border: `1px solid ${SQUAD_COLORS[r.squad].border}`,
                      }}>
                        {SQUAD_LABELS[r.squad]}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem', fontSize: '0.9rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                    {formatDate(r.date)}
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.4rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                  }}>
                    {r.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            📚 {activeTab === 'external' ? 'External Research' : 'All Research'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 300 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filtered.map((r) => (
            <article
              key={r.id}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)',
                boxShadow: 'var(--shadow)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Screenshot or placeholder banner */}
              {r.pptScreenshots && r.pptScreenshots.length > 0 ? (
                <img
                  src={r.pptScreenshots[0]}
                  alt={r.title}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    display: 'block',
                    borderBottom: '1px solid var(--gray-100)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: 'var(--purple-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    borderBottom: '1px solid var(--gray-100)',
                  }}
                >
                  {COUNTRY_EMOJI[r.country]}
                </div>
              )}

              <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ fontSize: '1rem' }}>{COUNTRY_EMOJI[r.country]}</span>
                {r.squad && (
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: 9999,
                      background: SQUAD_COLORS[r.squad].bg,
                      color: SQUAD_COLORS[r.squad].text,
                      border: `1px solid ${SQUAD_COLORS[r.squad].border}`,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {SQUAD_LABELS[r.squad]}
                  </span>
                )}
              </div>
              <h3 style={{ fontWeight: 600, marginTop: '0.25rem', fontSize: '1rem' }}>
                {r.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                {formatDate(r.date)}{r.researcher ? ` · 🔬 ${r.researcher}` : ''}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  marginTop: '0.5rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                }}
              >
                {r.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.75rem' }}>
                {r.tags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => { e.preventDefault(); selectTag(tag); }}
                    title={`Filter by "${tag}"`}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 9999,
                      background: tagFilter === tag ? 'var(--purple-600)' : 'var(--purple-100)',
                      color: tagFilter === tag ? 'white' : 'var(--purple-800)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <Link
                to={`/pesquisa/${r.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: 'var(--purple-600)',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                View Details
              </Link>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              background: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)',
            }}
            className="card-shadow"
          >
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</p>
            <p style={{ color: 'var(--gray-500)', fontWeight: 300 }}>
              {activeTab === 'external'
                ? 'No external research yet. Submit one using "New Research" and select External or Other as the squad.'
                : 'No research found matching your filters.'}
            </p>
          </div>
        )}
      </section>

      {/* Suggestions — GBA tab only */}
      <section style={{ marginTop: '2.5rem', display: activeTab === 'external' ? 'none' : undefined }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              📋 Research Suggestions
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
              Planned projects from the 2026 agenda not yet submitted
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={suggestionSquad}
              onChange={(e) => setSuggestionSquad(e.target.value as Squad | 'all')}
              style={{
                padding: '0.375rem 0.625rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                fontSize: '0.8rem',
                background: 'var(--white)',
              }}
            >
              {SQUAD_FILTER.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAddSuggestion(true)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--purple-600)',
                color: 'white',
                fontWeight: 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Add
            </button>
          </div>
        </div>

        {suggestions.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
            All planned research has been submitted or removed. Click "+ Add" to add new suggestions.
          </p>
        )}

        {/* Group by month */}
        {(() => {
          // Preserve a stable month order
          const ORDER = ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026','Jun 2026','Q3 2026','Q4 2026'];
          const groups = new Map<string, PlannedResearch[]>();
          suggestions.forEach((s) => {
            const key = s.month ?? 'Unscheduled';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(s);
          });
          const sortedKeys = [...groups.keys()].sort((a, b) => {
            const ia = ORDER.indexOf(a);
            const ib = ORDER.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
          });
          return sortedKeys.map((month) => (
            <div key={month} style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {month}
                </span>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#d1d5db',
                    fontWeight: 500,
                  }}
                >
                  {groups.get(month)!.length} pending
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {groups.get(month)!.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    onSubmit={() => navigate('/submit', { state: s })}
                    onDelete={() => deleteSuggestion(s.id)}
                  />
                ))}
              </div>
            </div>
          ));
        })()}
      </section>

      {/* Add Suggestion Modal */}
      {showAddSuggestion && (
        <div
          onClick={() => setShowAddSuggestion(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 480,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
              Add Research Suggestion
            </h3>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Title *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Research title"
              autoFocus
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
              }}
            />
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Squad
            </label>
            <select
              value={newSquad}
              onChange={(e) => setNewSquad(e.target.value as Squad)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                marginBottom: '0.75rem',
              }}
            >
              {SQUADS.map((s) => (
                <option key={s} value={s}>{SQUAD_LABELS[s]}</option>
              ))}
            </select>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Researcher
            </label>
            <select
              value={newResearcher}
              onChange={(e) => setNewResearcher(e.target.value as Researcher)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                marginBottom: '0.75rem',
              }}
            >
              {RESEARCHERS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Countries
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
              {COUNTRY_LIST.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setNewCountries((prev) =>
                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                    )
                  }
                  style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: 9999,
                    border: newCountries.includes(c)
                      ? '2px solid var(--purple-600)'
                      : '1px solid var(--gray-300)',
                    background: newCountries.includes(c) ? 'var(--purple-50)' : 'var(--white)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: newCountries.includes(c) ? 600 : 400,
                  }}
                >
                  {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAddSuggestion(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-300)',
                  background: 'var(--white)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addSuggestion}
                disabled={!newTitle.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: newTitle.trim() ? 'var(--purple-600)' : 'var(--gray-300)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: newTitle.trim() ? 'pointer' : 'default',
                }}
              >
                Add Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
