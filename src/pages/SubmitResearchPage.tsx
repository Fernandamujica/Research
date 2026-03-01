import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import type { Country, Squad, Researcher } from '../types/research';
import {
  COUNTRY_EMOJI,
  COUNTRY_LABELS,
  SQUAD_LABELS,
  RESEARCHERS,
} from '../types/research';
import type { PlannedResearch } from '../data/plannedResearch';
import { extractKeyLearningsFromText, autoFillFromPdf, getApiKey } from '../utils/aiGenerate';
import { extractPdfText } from '../utils/extractPdfText';

const COUNTRIES: Country[] = ['brasil', 'mexico', 'usa', 'colombia', 'global'];
const SQUADS = Object.keys(SQUAD_LABELS) as Squad[];

function generateDescriptionFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  const parts: string[] = [];
  if (lower.includes('consumer')) parts.push('Consumer insights and behavior');
  if (lower.includes('digital')) parts.push('digital channels');
  if (lower.includes('market')) parts.push('market analysis');
  if (lower.includes('brand')) parts.push('brand perception');
  if (lower.includes('survey')) parts.push('Survey-based research');
  if (parts.length === 0) parts.push('Research findings and key insights');
  return parts.join('. ') + '.';
}


interface FileEntry {
  name: string;
  size: number;
}

function FileUploadZone({
  label,
  accept,
  file,
  onFile,
  onRemove,
}: {
  label: string;
  accept: string;
  file: FileEntry | null;
  onFile: (entry: FileEntry, raw: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile({ name: dropped.name, size: dropped.size / 1024 / 1024 }, dropped);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
        {label}
      </div>
      {file ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--purple-50)',
            border: '1px solid var(--purple-300)',
            borderRadius: 'var(--radius)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {file.size.toFixed(2)} MB
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-300)',
              background: 'var(--white)',
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            padding: '1.5rem',
            border: `2px dashed ${dragging ? 'var(--purple-400)' : 'var(--gray-300)'}`,
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            background: dragging ? 'var(--purple-50)' : 'var(--gray-50)',
            cursor: 'pointer',
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
          }}
        >
          Drop file here or click to upload
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onFile({ name: f.name, size: f.size / 1024 / 1024 }, f);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

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

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const slots = Array.from({ length: MAX });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
      }}
    >
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
                onClick={() => inputRef.current?.click()}
                style={{
                  aspectRatio: '16/9',
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--gray-50)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: images.length >= MAX ? 'default' : 'pointer',
                  color: 'var(--gray-400)',
                  fontSize: '0.75rem',
                  gap: '0.25rem',
                  opacity: images.length > i ? 0 : 1,
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

export function SubmitResearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addResearch } = useResearch();

  // Pre-fill from suggestion via navigation state
  const suggestion = location.state as PlannedResearch | null;

  const [title, setTitle] = useState(suggestion?.title ?? '');
  const [description, setDescription] = useState(suggestion?.question ?? '');
  const [date, setDate] = useState('');
  const [country, setCountry] = useState<Country>(suggestion?.countries[0] ?? 'brasil');
  const [squad, setSquad] = useState<Squad | ''>(suggestion?.squad ?? '');
  const [researcher, setResearcher] = useState<Researcher | ''>(suggestion?.researcher ?? '');
  const [methodology, setMethodology] = useState('');
  const [team, setTeam] = useState<string[]>(
    suggestion?.researcher ? [suggestion.researcher] : ['']
  );
  const [tags, setTags] = useState<string[]>(
    suggestion?.tags?.length ? suggestion.tags : ['']
  );
  const [keyLearnings, setKeyLearnings] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [presentationUrl, setPresentationUrl] = useState('');
  const [pptFile, setPptFile] = useState<FileEntry | null>(null);
  const [pptFileObj, setPptFileObj] = useState<File | null>(null);
  const [planFile, setPlanFile] = useState<FileEntry | null>(null);
  const [usefulLinks, setUsefulLinks] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Banner to show when form was pre-filled from a suggestion
  const [fromSuggestion] = useState(!!suggestion);

  // initial state is already set from suggestion in useState calls above

  const addUsefulLink = () => setUsefulLinks((l) => [...l, { name: '', url: '' }]);
  const removeUsefulLink = (i: number) => setUsefulLinks((l) => l.filter((_, j) => j !== i));
  const setUsefulLink = (i: number, field: 'name' | 'url', value: string) =>
    setUsefulLinks((l) => l.map((link, j) => (j === i ? { ...link, [field]: value } : link)));

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
  const removeLearning = (i: number) => setKeyLearnings((k) => k.filter((_, j) => j !== i));
  const setLearning = (i: number, v: string) =>
    setKeyLearnings((k) => k.map((m, j) => (j === i ? v : m)));

  const runGeneration = useCallback(async (
    rawFile: File | null,
    currentTitle: string,
    currentDescription: string,
    currentMethodology: string,
  ) => {
    setAiLoading(true);
    setAiError('');
    try {
      let pdfText = '';
      if (rawFile && rawFile.name.toLowerCase().endsWith('.pdf')) {
        pdfText = await extractPdfText(rawFile);
      }

      if (getApiKey()) {
        // ── Gemini path: fills all fields from PDF ──────────────────────
        const filled = await autoFillFromPdf({ pdfText, title: currentTitle });

        if (filled.title && !currentTitle.trim()) {
          setTitle(filled.title);
        }
        if (filled.description && !currentDescription.trim()) {
          setDescription(filled.description);
        }
        if (filled.date) {
          setDate((prev) => prev || filled.date!);
        }
        if (filled.country) {
          setCountry((prev) => {
            const valid = ['brasil', 'mexico', 'usa', 'colombia', 'global'];
            return valid.includes(filled.country!) ? (filled.country as Country) : prev;
          });
        }
        if (filled.squad) {
          setSquad((prev) => {
            const valid = ['money-in', 'mb-account-xp', 'payments-assistant', 'troy', 'tout', 'cross-gba', 'payments-core-infra'];
            return (!prev && valid.includes(filled.squad!)) ? (filled.squad as Squad) : prev;
          });
        }
        if (filled.methodology && !currentMethodology.trim()) {
          setMethodology(filled.methodology);
        }
        if (filled.team && filled.team.length > 0) {
          setTeam((prev) => {
            const hasEmpty = prev.length === 1 && !prev[0].trim();
            return hasEmpty ? filled.team! : prev;
          });
        }
        if (filled.tags && filled.tags.length > 0) {
          setTags(filled.tags);
        }
        if (filled.keyLearnings && filled.keyLearnings.length > 0) {
          setKeyLearnings(filled.keyLearnings);
        }
        if (!filled.keyLearnings?.length && !filled.description && !filled.tags?.length) {
          setAiError('AI returned no content. Try uploading a text-based PDF.');
        }
      } else {
        // ── Local fallback: extractive key learnings only ─────────────
        const sourceText = pdfText.trim()
          || [currentDescription, currentMethodology].filter(Boolean).join('. ');
        const learnings = extractKeyLearningsFromText(sourceText);
        if (learnings.length > 0) {
          setKeyLearnings(learnings);
        } else {
          setAiError('Could not extract learnings. Try uploading a text-based PDF or add a description first.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error.';
      if (msg === 'NO_API_KEY') {
        setAiError('AI error — please try again.');
      } else {
        setAiError(`AI error: ${msg}`);
      }
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Manual regenerate button — uses current state
  const autoGenerateLearnings = useCallback(() => {
    runGeneration(pptFileObj, title, description, methodology);
  }, [runGeneration, pptFileObj, title, description, methodology]);

  const handlePptFile = useCallback(
    (entry: FileEntry, raw: File) => {
      const newDesc = !description.trim() ? generateDescriptionFromFileName(entry.name) : description;
      setPptFile(entry);
      setPptFileObj(raw);
      if (!description.trim()) setDescription(newDesc);
      runGeneration(raw, title, newDesc, methodology);
    },
    [description, title, methodology, runGeneration]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teamFiltered = team.filter((t) => t.trim());
    const tagsFiltered = tags.filter((t) => t.trim());

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description / research question is required.';
    if (!date) newErrors.date = 'Date is required.';
    if (!methodology.trim()) newErrors.methodology = 'Methodology is required.';
    if (teamFiltered.length === 0) newErrors.team = 'Add at least one team member.';
    if (tagsFiltered.length === 0) newErrors.tags = 'Add at least one tag.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    addResearch({
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
      pptFile: pptFile ?? undefined,
      planFile: planFile ?? undefined,
      usefulLinks: usefulLinks.filter((l) => l.name.trim() && l.url.trim()),
    });
    navigate('/');
  };

  const errStyle: React.CSSProperties = {
    color: '#dc2626',
    fontSize: '0.8rem',
    marginTop: '-0.5rem',
    marginBottom: '0.5rem',
  };

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
        Submit Research
      </h1>

      {fromSuggestion && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.875rem 1rem',
            background: 'var(--purple-50)',
            border: '1px solid var(--purple-300)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            color: 'var(--purple-800)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <span>✨</span>
          <span>
            Pre-filled from planned research agenda. Review and complete the remaining fields.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Basic Information ─────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Basic Information
          </h2>
          <label style={labelStyle} id="field-title">Research Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((v) => ({ ...v, title: '' })); }}
            placeholder="e.g. Consumer Behavior in Digital Channels"
            style={{ ...inputStyle, borderColor: errors.title ? '#dc2626' : 'var(--gray-300)' }}
          />
          {errors.title && <p style={errStyle}>{errors.title}</p>}

          <label style={labelStyle} id="field-description">Description / Research Question *</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((v) => ({ ...v, description: '' })); }}
            placeholder="What is the main research question?"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', borderColor: errors.description ? '#dc2626' : 'var(--gray-300)' }}
          />
          {errors.description && <p style={errStyle}>{errors.description}</p>}

          <label style={labelStyle} id="field-date">Research Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((v) => ({ ...v, date: '' })); }}
            style={{ ...inputStyle, borderColor: errors.date ? '#dc2626' : 'var(--gray-300)' }}
          />
          {errors.date && <p style={errStyle}>{errors.date}</p>}

          <label style={labelStyle}>Country *</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            style={inputStyle}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_EMOJI[c]} {COUNTRY_LABELS[c]}
              </option>
            ))}
          </select>

          <label style={labelStyle} id="field-methodology">Methodology *</label>
          <textarea
            value={methodology}
            onChange={(e) => { setMethodology(e.target.value); setErrors((v) => ({ ...v, methodology: '' })); }}
            placeholder="e.g. Mixed methods: surveys (n=500) and 20 in-depth interviews"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', borderColor: errors.methodology ? '#dc2626' : 'var(--gray-300)' }}
          />
          {errors.methodology && <p style={errStyle}>{errors.methodology}</p>}
        </section>

        {/* ── Squad & Researcher ────────────────────────── */}
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

        {/* ── Team ──────────────────────────────────────── */}
        <section style={sectionStyle} id="field-team">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: errors.team ? '0.25rem' : '1rem' }}>Team</h2>
          {errors.team && <p style={{ ...errStyle, marginBottom: '0.75rem' }}>{errors.team}</p>}
          {team.map((member, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={member}
                onChange={(e) => setTeamMember(i, e.target.value)}
                placeholder="Team member name"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeTeamMember(i)}
                aria-label="Remove member"
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

        {/* ── Tags ──────────────────────────────────────── */}
        <section style={sectionStyle} id="field-tags">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: errors.tags ? '0.25rem' : '1rem' }}>Tags *</h2>
          {errors.tags && <p style={{ ...errStyle, marginBottom: '0.75rem' }}>{errors.tags}</p>}
          {tags.map((tag, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(i, e.target.value)}
                placeholder="Tag"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeTag(i)}
                aria-label="Remove tag"
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

        {/* ── Research Images ───────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Research Images
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Upload up to 3 screenshots or images from the research (slides, charts, etc.).
          </p>
          <ImageUploadGrid images={screenshots} onChange={setScreenshots} />
        </section>

        {/* ── Presentation Link ─────────────────────────── */}
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

        {/* ── File Uploads ──────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            File Uploads
          </h2>
          <FileUploadZone
            label="PPT / PDF Upload"
            accept=".ppt,.pptx,.pdf"
            file={pptFile}
            onFile={handlePptFile}
            onRemove={() => { setPptFile(null); setPptFileObj(null); }}
          />
          <FileUploadZone
            label="Research Plan Upload (optional)"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            file={planFile}
            onFile={(entry) => setPlanFile(entry)}
            onRemove={() => setPlanFile(null)}
          />
        </section>

        {/* ── Key Learnings ─────────────────────────────── */}
        <section style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: aiError ? '0.5rem' : '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Key Learnings (optional)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                {aiLoading
                  ? 'Reading PDF with Gemini AI…'
                  : 'AI fills title, date, team, squad, description, tags & learnings on upload. Edit freely.'}
              </p>
            </div>
            <button
              type="button"
              onClick={autoGenerateLearnings}
              disabled={aiLoading}
              title="Regenerate key learnings with AI"
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--purple-300)',
                background: aiLoading ? 'var(--gray-100)' : 'var(--purple-50)',
                color: aiLoading ? 'var(--gray-400)' : 'var(--purple-700)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: aiLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              {aiLoading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Generating…
                </>
              ) : (
                <>✨ Regenerate</>
              )}
            </button>
          </div>
          {aiError && (
            <p style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: 'var(--radius)', border: '1px solid #fecaca' }}>
              {aiError}
            </p>
          )}
          {keyLearnings.length === 0 && !aiError && !aiLoading && (
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>
              Key learnings will appear here automatically after you upload a PDF. You can also add them manually.
            </p>
          )}
          {keyLearnings.map((learning, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                alignItems: 'flex-start',
              }}
            >
              <textarea
                value={learning}
                onChange={(e) => setLearning(i, e.target.value)}
                placeholder={`Learning ${i + 1}`}
                rows={2}
                style={{ ...inputStyle, marginBottom: 0, flex: 1, resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={() => removeLearning(i)}
                aria-label="Remove learning"
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--white)',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLearning}
            style={{
              marginTop: '0.25rem',
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

        {/* ── Useful Links ──────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Useful Links (optional)
          </h2>
          {usefulLinks.map((link, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                value={link.name}
                onChange={(e) => setUsefulLink(i, 'name', e.target.value)}
                placeholder="Link name (e.g. Survey Results)"
                style={{ ...inputStyle, marginBottom: 0, flex: '1 1 140px' }}
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => setUsefulLink(i, 'url', e.target.value)}
                placeholder="https://..."
                style={{ ...inputStyle, marginBottom: 0, flex: '1 1 200px' }}
              />
              <button
                type="button"
                onClick={() => removeUsefulLink(i)}
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
            onClick={addUsefulLink}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--gray-400)',
              background: 'var(--gray-50)',
              fontWeight: 500,
            }}
          >
            + Add Link
          </button>
        </section>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '2rem' }}>
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
            Submit Research
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
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
