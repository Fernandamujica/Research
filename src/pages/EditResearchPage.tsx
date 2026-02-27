import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import type { Country, Squad, Researcher } from '../types/research';
import { COUNTRY_EMOJI, COUNTRY_LABELS, SQUAD_LABELS, RESEARCHERS } from '../types/research';

const COUNTRIES: Country[] = ['brasil', 'mexico', 'usa', 'colombia', 'global'];
const SQUADS = Object.keys(SQUAD_LABELS) as Squad[];

function ImageUploadGrid({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const MAX = 3;
  const handleFile = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const next = [...images];
      if (index < next.length) next[index] = dataUrl;
      else next.push(dataUrl);
      onChange(next);
    };
    reader.readAsDataURL(file);
  };
  const removeImage = (index: number) => onChange(images.filter((_, i) => i !== index));
  const slots = Array.from({ length: MAX });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
      {slots.map((_, i) => {
        const src = images[i];
        const inputRef = React.createRef<HTMLInputElement>();
        return (
          <div key={i}>
            {src ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={src}
                  alt={`Screenshot ${i + 1}`}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                    border: '2px solid var(--purple-200)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.55)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 9999,
                    width: 22,
                    height: 22,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => images.length <= i && inputRef.current?.click()}
                style={{
                  aspectRatio: '16/9',
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--gray-50)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: images.length <= i ? 'pointer' : 'default',
                  color: 'var(--gray-400)',
                  fontSize: '0.75rem',
                  gap: '0.25rem',
                }}
              >
                {images.length <= i && (
                  <>
                    <span style={{ fontSize: '1.25rem' }}>📷</span>
                    <span>Image {i + 1}</span>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { handleFile(i, f); e.target.value = ''; }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EditResearchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getResearchById, updateResearch } = useResearch();
  const research = id ? getResearchById(id) : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [country, setCountry] = useState<Country>('brasil');
  const [squad, setSquad] = useState<Squad | ''>('');
  const [researcher, setResearcher] = useState<Researcher | ''>('');
  const [methodology, setMethodology] = useState('');
  const [team, setTeam] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>(['']);
  const [keyLearnings, setKeyLearnings] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [presentationUrl, setPresentationUrl] = useState('');

  useEffect(() => {
    if (research) {
      setTitle(research.title);
      setDescription(research.description);
      setDate(research.date);
      setCountry(research.country);
      setSquad(research.squad ?? '');
      setResearcher(research.researcher ?? '');
      setMethodology(research.methodology);
      setTeam(research.team.length ? research.team : ['']);
      setTags(research.tags.length ? research.tags : ['']);
      setKeyLearnings(research.keyLearnings || []);
      setScreenshots(research.pptScreenshots || []);
      setPresentationUrl(research.presentationUrl ?? '');
    }
  }, [research]);

  const addTeamMember = () => setTeam((t) => [...t, '']);
  const removeTeamMember = (i: number) =>
    setTeam((t) => (t.length > 1 ? t.filter((_, j) => j !== i) : t));
  const setTeamMember = (i: number, v: string) =>
    setTeam((t) => t.map((m, j) => (j === i ? v : m)));

  const addTag = () => setTags((t) => [...t, '']);
  const removeTag = (i: number) =>
    setTags((t) => (t.length > 1 ? t.filter((_, j) => j !== i) : t));
  const setTag = (i: number, v: string) =>
    setTags((t) => t.map((m, j) => (j === i ? v : m)));

  const addLearning = () => setKeyLearnings((k) => [...k, '']);
  const removeLearning = (i: number) =>
    setKeyLearnings((k) => k.filter((_, j) => j !== i));
  const setLearning = (i: number, v: string) =>
    setKeyLearnings((k) => k.map((m, j) => (j === i ? v : m)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !research) return;
    const teamFiltered = team.filter((t) => t.trim());
    const tagsFiltered = tags.filter((t) => t.trim());
    if (!title.trim() || !description.trim() || !date || !methodology.trim()) return;
    if (teamFiltered.length === 0 || tagsFiltered.length === 0) return;

    updateResearch(id, {
      title: title.trim(),
      description: description.trim(),
      date,
      country,
      squad: squad || undefined,
      researcher: researcher || undefined,
      methodology: methodology.trim(),
      team: teamFiltered,
      tags: tagsFiltered,
      keyLearnings: keyLearnings.filter((k) => k.trim()),
      pptScreenshots: screenshots,
      presentationUrl: presentationUrl.trim() || undefined,
    });
    navigate(`/pesquisa/${id}`);
  };

  if (!research) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Research not found.</p>
        <button type="button" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow)',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
    marginBottom: '0.375rem',
    fontSize: '0.875rem',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--gray-300)',
    marginBottom: '0.75rem',
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Edit Research
      </h1>
      <form onSubmit={handleSubmit}>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Basic Information
          </h2>
          <label style={labelStyle}>Research Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={labelStyle}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <label style={labelStyle}>Research Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />
          <label style={labelStyle}>Country *</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            required
            style={inputStyle}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
              </option>
            ))}
          </select>
          <label style={labelStyle}>Methodology *</label>
          <textarea
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            required
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Squad & Researcher
          </h2>
          <label style={labelStyle}>Squad</label>
          <select
            value={squad}
            onChange={(e) => setSquad(e.target.value as Squad | '')}
            style={inputStyle}
          >
            <option value="">— Select squad —</option>
            {SQUADS.map((s) => (
              <option key={s} value={s}>
                {SQUAD_LABELS[s]}
              </option>
            ))}
          </select>
          <label style={labelStyle}>Lead Researcher</label>
          <select
            value={researcher}
            onChange={(e) => setResearcher(e.target.value as Researcher | '')}
            style={inputStyle}
          >
            <option value="">— Select researcher —</option>
            {RESEARCHERS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Team</h2>
          {team.map((member, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={member}
                onChange={(e) => setTeamMember(i, e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeTeamMember(i)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--white)',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTeamMember}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--gray-400)',
              background: 'var(--gray-50)',
              fontWeight: 500,
            }}
          >
            + Add Member
          </button>
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Tags</h2>
          {tags.map((tag, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(i, e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeTag(i)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--white)',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTag}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--gray-400)',
              background: 'var(--gray-50)',
              fontWeight: 500,
            }}
          >
            + Add Tag
          </button>
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Key Learnings
          </h2>
          {keyLearnings.map((learning, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <textarea
                value={learning}
                onChange={(e) => setLearning(i, e.target.value)}
                rows={2}
                style={{ ...inputStyle, marginBottom: '0.25rem', resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={() => removeLearning(i)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--gray-500)',
                  fontSize: '0.875rem',
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLearning}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--gray-400)',
              background: 'var(--gray-50)',
              fontWeight: 500,
            }}
          >
            + Add Learning
          </button>
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Research Images
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Upload up to 3 screenshots or images from the research (slides, charts, etc.).
          </p>
          <ImageUploadGrid images={screenshots} onChange={setScreenshots} />
        </section>
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Presentation Link
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Paste a Google Slides, Notion, or any public link to the full presentation.
          </p>
          <label style={labelStyle}>URL</label>
          <input
            type="url"
            value={presentationUrl}
            onChange={(e) => setPresentationUrl(e.target.value)}
            placeholder="https://docs.google.com/presentation/d/..."
            style={inputStyle}
          />
        </section>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--purple-600)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate(`/pesquisa/${id}`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-300)',
              background: 'var(--white)',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
