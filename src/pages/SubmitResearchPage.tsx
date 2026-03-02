import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import type { Country, Squad } from '../types/research';
import {
  COUNTRY_EMOJI,
  COUNTRY_LABELS,
  SQUAD_LABELS,
} from '../types/research';
import type { PlannedResearch } from '../data/plannedResearch';
import { extractKeyLearningsFromText, autoFillFromPdf, getApiKey } from '../utils/aiGenerate';
import { extractPdfText, extractPdfCover } from '../utils/extractPdfText';
import { getResearchers } from '../utils/settings';
import { isGoogleLink, getStoredToken, requestGoogleToken, fetchGoogleDocContent, getGoogleClientId } from '../utils/googleAuth';

const COUNTRIES: Country[] = ['brasil', 'mexico', 'usa', 'colombia', 'global'];
const SQUADS = Object.keys(SQUAD_LABELS) as Squad[];


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
  const [researcher, setResearcher] = useState<string>(suggestion?.researcher ?? '');
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
  const [docUrl, setDocUrl] = useState('');
  const [planFile, setPlanFile] = useState<FileEntry | null>(null);
  const [usefulLinks, setUsefulLinks] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [slackMessage, setSlackMessage] = useState('');
  const [copied, setCopied] = useState(false);

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

  const [googleToken, setGoogleToken] = useState<string | null>(getStoredToken);

  const handleGoogleSignIn = async () => {
    try {
      setAiError('');
      const token = await requestGoogleToken();
      setGoogleToken(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAiError(msg);
    }
  };

  const needsGoogleAuth = docUrl.trim() && isGoogleLink(docUrl) && !googleToken && !!getGoogleClientId();
  const hasGoogleClientId = !!getGoogleClientId();

  const fetchDocTextFromUrl = async (url: string, token: string | null): Promise<string> => {
    if (isGoogleLink(url) && token) {
      return fetchGoogleDocContent(url, token);
    }

    const gDocsMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/);
    const gSlidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([^/]+)/);

    let exportUrl = '';
    if (gDocsMatch) {
      exportUrl = `https://docs.google.com/document/d/${gDocsMatch[1]}/export?format=txt`;
    } else if (gSlidesMatch) {
      exportUrl = `https://docs.google.com/presentation/d/${gSlidesMatch[1]}/export/txt`;
    }

    if (exportUrl) {
      try {
        const res = await fetch(exportUrl);
        if (res.ok) {
          const text = await res.text();
          if (text.trim().length > 50) return text;
        }
      } catch { /* CORS blocked, fall through */ }
    }

    if (isGoogleLink(url)) {
      throw new Error('This Google document requires authentication. Click "Sign in with Google" first.');
    }

    throw new Error('Could not read the document at this URL. Make sure it is publicly accessible.');
  };

  const runGeneration = useCallback(async (
    rawFile: File | null,
    currentUrl: string,
    currentTitle: string,
    currentDescription: string,
    currentMethodology: string,
    token: string | null,
  ) => {
    if (!rawFile && !currentUrl.trim()) {
      setAiError('Upload a PDF or paste a document link first.');
      return;
    }

    setAiLoading(true);
    setAiError('');
    try {
      let docText = '';

      if (rawFile && rawFile.name.toLowerCase().endsWith('.pdf')) {
        docText = await extractPdfText(rawFile);
      } else if (currentUrl.trim()) {
        docText = await fetchDocTextFromUrl(currentUrl.trim(), token);
      }

      if (!docText.trim()) {
        setAiError('Could not extract text. Try a text-based PDF or a public Google Docs/Slides link.');
        setAiLoading(false);
        return;
      }

      if (getApiKey()) {
        const filled = await autoFillFromPdf({ pdfText: docText, title: currentTitle });

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
          setAiError('AI could not extract content from this document. Try a different source.');
        }
      } else {
        const learnings = extractKeyLearningsFromText(docText);
        if (learnings.length > 0) {
          setKeyLearnings(learnings);
        } else {
          setAiError('AI features are temporarily disabled. They will be re-enabled on Nubank infrastructure.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error.';
      setAiError(`AI error: ${msg}`);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const autoGenerateLearnings = useCallback(() => {
    runGeneration(pptFileObj, docUrl, title, description, methodology, googleToken);
  }, [runGeneration, pptFileObj, docUrl, title, description, methodology, googleToken]);

  const handlePptFile = useCallback(
    async (entry: FileEntry, raw: File) => {
      setPptFile(entry);
      setPptFileObj(raw);
      setDocUrl('');

      if (raw.name.toLowerCase().endsWith('.pdf')) {
        const cover = await extractPdfCover(raw);
        if (cover) {
          setScreenshots((prev) => prev.length === 0 ? [cover] : prev);
        }
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
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

    const filteredLearnings = keyLearnings.filter((k) => k.trim());

    await addResearch({
      title: title.trim(),
      description: description.trim(),
      date,
      country,
      squad: squad || undefined,
      researcher: researcher || undefined,
      methodology: methodology.trim(),
      team: teamFiltered,
      tags: tagsFiltered,
      keyLearnings: filteredLearnings,
      pptScreenshots: screenshots,
      presentationUrl: presentationUrl.trim() || undefined,
      pptFile: pptFile ?? undefined,
      planFile: planFile ?? undefined,
      usefulLinks: usefulLinks.filter((l) => l.name.trim() && l.url.trim()),
    });

    const emoji = COUNTRY_EMOJI[country] ?? '';
    const learningsText = filteredLearnings.length > 0
      ? filteredLearnings.map((l, i) => `   ${i + 1}. ${l}`).join('\n')
      : '   No key learnings added yet.';

    const msg = `${emoji} *New Research Published!*\n\n` +
      `*${title.trim()}*\n` +
      `${description.trim()}\n\n` +
      `*Key Findings:*\n${learningsText}\n\n` +
      `${tagsFiltered.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ')}` +
      `${squad ? ` | ${SQUAD_LABELS[squad as Squad]}` : ''}` +
      `${researcher ? ` | by ${researcher}` : ''}`;

    setSlackMessage(msg);
    setShowSuccess(true);
    setCopied(false);
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
        {/* ── File Upload + AI Fill ───────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            📄 Upload & AI Auto-Fill
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Upload a PDF <strong>or</strong> paste a document link (Google Slides, Google Docs, etc.) — the AI will read the document and auto-fill the form.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: pptFile ? 'var(--purple-100)' : 'var(--gray-100)',
              color: pptFile ? 'var(--purple-700)' : 'var(--gray-500)',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              Option 1
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Upload PDF</span>
          </div>

          <FileUploadZone
            label="Research PDF"
            accept=".pdf"
            file={pptFile}
            onFile={handlePptFile}
            onRemove={() => { setPptFile(null); setPptFileObj(null); }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '1rem 0',
            color: 'var(--gray-400)',
            fontSize: '0.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
            <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: docUrl.trim() ? 'var(--purple-100)' : 'var(--gray-100)',
              color: docUrl.trim() ? 'var(--purple-700)' : 'var(--gray-500)',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              Option 2
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Paste document link</span>
          </div>

          <input
            type="url"
            placeholder="https://docs.google.com/presentation/d/... or any public PDF/document link"
            value={docUrl}
            onChange={e => { setDocUrl(e.target.value); setAiError(''); }}
            disabled={!!pptFile}
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius)',
              border: `1px solid ${docUrl.trim() ? 'var(--purple-300)' : 'var(--gray-200)'}`,
              background: pptFile ? 'var(--gray-50)' : 'white',
              fontSize: '0.85rem',
              color: pptFile ? 'var(--gray-400)' : 'var(--gray-700)',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
          {pptFile && (
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
              Remove the PDF above to use a link instead.
            </p>
          )}

          {/* Google Sign-In when a Google link is detected */}
          {needsGoogleAuth && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#e8f0fe',
              borderRadius: 'var(--radius)',
              border: '1px solid #a8c7fa',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8rem', color: '#1a73e8', fontWeight: 600, margin: 0 }}>
                  This is a corporate Google document
                </p>
                <p style={{ fontSize: '0.72rem', color: '#5f6368', margin: '0.2rem 0 0' }}>
                  Sign in with your Google account to allow reading it.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid #dadce0',
                  background: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1a73e8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign in with Google
              </button>
            </div>
          )}

          {/* Warning when Google link but no client ID */}
          {docUrl.trim() && isGoogleLink(docUrl) && !hasGoogleClientId && !pptFile && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#fffbeb',
              borderRadius: 'var(--radius)',
              border: '1px solid #fbbf24',
              fontSize: '0.8rem',
              color: '#92400e',
            }}>
              ⚠ To read corporate Google documents, configure a <strong>Google OAuth Client ID</strong> in{' '}
              <a href="#/settings" style={{ color: '#92400e', fontWeight: 600 }}>Settings</a>.
              <br />
              <span style={{ fontSize: '0.72rem' }}>
                Without it, the AI can only read publicly shared documents.
              </span>
            </div>
          )}

          {/* Signed in indicator */}
          {docUrl.trim() && isGoogleLink(docUrl) && googleToken && (
            <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500, marginTop: '0.5rem' }}>
              ✓ Signed in with Google — ready to read the document
            </p>
          )}

          {(pptFile || (docUrl.trim() && !needsGoogleAuth)) && (
            <button
              type="button"
              onClick={autoGenerateLearnings}
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: aiLoading ? 'var(--gray-200)' : 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                color: aiLoading ? 'var(--gray-500)' : 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: aiLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem',
                transition: 'all 0.2s',
              }}
            >
              {aiLoading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Reading document with AI...
                </>
              ) : (
                <>✨ Fill with AI from {pptFile ? 'PDF' : 'link'}</>
              )}
            </button>
          )}

          {!pptFile && !docUrl.trim() && !aiLoading && (
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>
              Upload a PDF or paste a link to enable AI auto-fill.
            </p>
          )}

          {aiError && (
            <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: 'var(--radius)', border: '1px solid #fecaca' }}>
              {aiError}
            </p>
          )}
        </section>

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
            onChange={(e) => setResearcher(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select researcher —</option>
            {getResearchers().map((r) => (
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
            {screenshots.length > 0 && pptFile
              ? 'PDF cover extracted automatically. Add up to 2 more images.'
              : 'Upload up to 3 screenshots or images from the research (slides, charts, etc.).'}
          </p>
          <ImageUploadGrid images={screenshots} onChange={setScreenshots} />
        </section>

        {/* ── Presentation Link ─────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Presentation Link
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            Paste a link to the research presentation (Google Slides, Docs, Notion, Figma, etc.)
          </p>

          {presentationUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--purple-50)',
                border: '1px solid var(--purple-300)',
                borderRadius: 'var(--radius)',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>
                {presentationUrl.includes('presentation') || presentationUrl.includes('slides') ? '📊' :
                 presentationUrl.includes('document') || presentationUrl.includes('docs') ? '📝' :
                 presentationUrl.includes('figma') ? '🎨' :
                 presentationUrl.includes('notion') ? '📓' : '🔗'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {presentationUrl}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPresentationUrl('')}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-300)',
                  background: 'var(--white)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={presentationUrl}
              onChange={(e) => setPresentationUrl(e.target.value)}
              placeholder="https://docs.google.com/presentation/d/..."
              style={inputStyle}
            />
          )}
        </section>

        {/* ── Additional File Upload ─────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Research Plan (optional)
          </h2>
          <FileUploadZone
            label="Research Plan Upload"
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
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Key Learnings (optional)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                Auto-filled by AI when you click "Fill with AI". Edit freely or add manually.
              </p>
            </div>
            {pptFile && (
              <button
                type="button"
                onClick={autoGenerateLearnings}
                disabled={aiLoading}
                title="Re-run AI extraction"
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--purple-300)',
                  background: aiLoading ? 'var(--gray-100)' : 'var(--purple-50)',
                  color: aiLoading ? 'var(--gray-400)' : 'var(--purple-700)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  cursor: aiLoading ? 'wait' : 'pointer',
                }}
              >
                {aiLoading ? '⏳ Generating…' : '✨ Re-fill'}
              </button>
            )}
          </div>
          {keyLearnings.length === 0 && !aiLoading && (
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>
              Upload a PDF and click "Fill with AI" to auto-extract learnings, or add them manually below.
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

      {/* Success Modal */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '2rem 1.75rem',
              maxWidth: 520,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}achievement.png`}
              alt="Achievement!"
              style={{ height: 150, margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }}
            />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--purple-600), var(--purple-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem',
            }}>
              Research Published!
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Thank you for sharing your research with the team.
            </p>

            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
              How about sharing it on Slack channels?
            </p>

            <div style={{
              textAlign: 'left',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Slack Message
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(slackMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: 9999,
                    border: 'none',
                    background: copied ? '#16a34a' : 'var(--purple-600)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: 'var(--gray-700)',
                fontFamily: 'inherit',
                margin: 0,
              }}>
                {slackMessage}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--purple-600)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
