import { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import {
  COUNTRY_EMOJI,
  COUNTRY_LABELS,
  SQUAD_LABELS,
  SQUAD_COLORS,
  type Country,
  type Squad,
} from '../types/research';
import { PLANNED_RESEARCH, type PlannedResearch } from '../data/plannedResearch';
import { getResearchers } from '../utils/settings';
import { db, firebaseEnabled } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
} from 'firebase/firestore';

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
  { value: 'brasil', label: 'Brazil', emoji: '🇧🇷' },
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
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<Country | 'all'>('all');
  const [squadFilter, setSquadFilter] = useState<Squad | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [suggestionSquad, setSuggestionSquad] = useState<Squad | 'all'>('all');

  const EXTERNAL_SQUADS: Squad[] = ['external', 'other'];
  const isExternal = (squad?: Squad) => !!squad && EXTERNAL_SQUADS.includes(squad);

  const LABEL_TO_KEY: Record<string, Squad> = {};
  for (const [k, v] of Object.entries(SQUAD_LABELS)) {
    LABEL_TO_KEY[v.toLowerCase()] = k as Squad;
    LABEL_TO_KEY[k] = k as Squad;
  }
  const normalizeSquad = (s?: string | null): Squad | undefined => {
    if (!s) return undefined;
    const trimmed = s.trim();
    if (trimmed in SQUAD_LABELS) return trimmed as Squad;
    return LABEL_TO_KEY[trimmed.toLowerCase()] ?? undefined;
  };

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
  const [newResearcher, setNewResearcher] = useState('Yas');
  const [newCountries, setNewCountries] = useState<Country[]>(['brasil']);

  useEffect(() => {
    if (!firebaseEnabled || !db) return;
    const unsub1 = onSnapshot(collection(db, 'suggestions_deleted'), (snap) => {
      const ids = new Set(snap.docs.map((d) => d.id));
      setDeletedIds(ids);
    });
    const unsub2 = onSnapshot(collection(db, 'suggestions_custom'), (snap) => {
      const items = snap.docs.map((d) => d.data() as PlannedResearch);
      setCustomSuggestions(items);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const deleteSuggestion = useCallback(async (id: string) => {
    if (firebaseEnabled && db) {
      await setDoc(doc(db, 'suggestions_deleted', id), { deletedAt: new Date().toISOString() });
    } else {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem(LS_DELETED, JSON.stringify([...next]));
        return next;
      });
    }
  }, []);

  const addSuggestion = useCallback(async () => {
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
    if (firebaseEnabled && db) {
      await addDoc(collection(db, 'suggestions_custom'), item);
    } else {
      setCustomSuggestions((prev) => {
        const next = [item, ...prev];
        localStorage.setItem(LS_CUSTOM, JSON.stringify(next));
        return next;
      });
    }
    setNewTitle('');
    setShowAddSuggestion(false);
  }, [newTitle, newSquad, newResearcher, newCountries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return researches
      .filter((r) => {
        const rSquad = normalizeSquad(r.squad);
        const matchCountry = countryFilter === 'all' || r.country === countryFilter;
        const matchSquad = squadFilter === 'all' || rSquad === squadFilter;
        const matchTag = !tagFilter || r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase());
        const squadLabel = rSquad ? (SQUAD_LABELS[rSquad] ?? '') : '';
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
          squadLabel.toLowerCase().includes(q) ||
          (r.researcher ? r.researcher.toLowerCase().includes(q) : false);
        return matchCountry && matchSquad && matchTag && matchSearch;
      })
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : (b.createdAt > a.createdAt ? 1 : -1)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researches, search, countryFilter, squadFilter, tagFilter]);

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


  const ALL_SQUAD_FILTER: { value: Squad | 'all'; label: string }[] = [
    { value: 'all', label: 'All Squads' },
    ...Object.entries(SQUAD_LABELS).map(([k, v]) => ({ value: k as Squad, label: v })),
  ];

  const noFiltersActive = !search && countryFilter === 'all' && squadFilter === 'all' && !tagFilter;

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* ── Hero (gradient background) ────────────────── */}
      <div
        className="bg-gradient-hero"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2.5rem 1.5rem 2rem',
          margin: '-1.5rem -1.5rem 0',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="GBA Research"
          style={{
            height: 160,
            width: 160,
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 2rem)',
              fontWeight: 600,
              color: 'var(--gray-700)',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            Repository for UX Research studies across GBA.
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0.5rem' }}>

      {/* ── Controls ──────────────────────────────────── */}
      <div style={{ marginTop: '-1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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

        {/* Squad Filter — pill buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {ALL_SQUAD_FILTER.map((s) => {
            const active = squadFilter === s.value;
            const colors = s.value !== 'all' && SQUAD_COLORS[s.value as Squad]
              ? SQUAD_COLORS[s.value as Squad]
              : null;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSquadFilter(s.value as Squad | 'all')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 9999,
                  border: active
                    ? 'none'
                    : `1px solid ${colors ? colors.border : 'var(--gray-200)'}`,
                  background: active
                    ? (colors ? colors.bg : 'var(--purple-600)')
                    : 'var(--white)',
                  color: active
                    ? (colors ? colors.text : 'white')
                    : 'var(--gray-600)',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Latest Research — compact cards, only when no filters active */}
      {latestResearch.length > 0 && noFiltersActive && (
        <section style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            🕐 Recently added
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {latestResearch.map((r) => {
              const sq = normalizeSquad(r.squad);
              return (
                <Link
                  key={r.id}
                  to={`/research/${r.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.875rem',
                    background: 'var(--white)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--gray-150, var(--gray-200))',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--purple-50, #faf5ff)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{COUNTRY_EMOJI[r.country]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.1rem' }}>
                      {formatDate(r.date)}{r.researcher ? ` · ${r.researcher}` : ''}
                    </div>
                  </div>
                  {sq && SQUAD_COLORS[sq] && (
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700,
                      padding: '0.15rem 0.45rem', borderRadius: 9999,
                      background: SQUAD_COLORS[sq].bg,
                      color: SQUAD_COLORS[sq].text,
                      border: `1px solid ${SQUAD_COLORS[sq].border}`,
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {SQUAD_LABELS[sq]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}


      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            📚 All Research
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem' }}>{COUNTRY_EMOJI[r.country]}</span>
                {(() => { const sq = normalizeSquad(r.squad); return sq && SQUAD_COLORS[sq] ? (
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: 9999,
                      background: SQUAD_COLORS[sq].bg,
                      color: SQUAD_COLORS[sq].text,
                      border: `1px solid ${SQUAD_COLORS[sq].border}`,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {SQUAD_LABELS[sq]}
                  </span>
                ) : r.squad ? (
                  <span style={{
                    padding: '0.15rem 0.45rem', borderRadius: 9999,
                    background: '#F9FAFB', color: '#6B7280',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    {r.squad}
                  </span>
                ) : null; })()}
                {isExternal(normalizeSquad(r.squad)) && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700,
                    padding: '0.15rem 0.5rem', borderRadius: 9999,
                    background: '#fef3c7', color: '#92400e',
                    border: '1px solid #fde68a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}>
                    External
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
                to={`/research/${r.id}`}
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
              No research found matching your filters.
            </p>
          </div>
        )}
      </section>

      {/* Suggestions — GBA tab only */}
      <section style={{ marginTop: '2.5rem' }}>
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
              Planned projects from the 2026 agenda — not yet submitted
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
              onChange={(e) => setNewResearcher(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                marginBottom: '0.75rem',
              }}
            >
              {getResearchers().map((r) => (
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
