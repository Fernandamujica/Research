import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { COUNTRY_EMOJI, SQUAD_LABELS, SQUAD_COLORS } from '../types/research';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ResearchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getResearchById, deleteResearch } = useResearch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const research = id ? getResearchById(id) : undefined;

  const handleDelete = () => {
    if (id) {
      deleteResearch(id);
      setShowDeleteModal(false);
      navigate('/');
    }
  };

  if (!research) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Research not found.</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 0',
          background: 'none',
          border: 'none',
          color: 'var(--purple-600)',
          fontWeight: 500,
        }}
      >
        ← Back
      </button>

      <section
        style={{
          marginBottom: '1.5rem',
          padding: '1.5rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <span style={{ fontSize: '2rem' }}>{COUNTRY_EMOJI[research.country]}</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
          {research.title}
        </h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>
          {formatDate(research.date)}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {research.squad && (
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 9999,
                background: SQUAD_COLORS[research.squad].bg,
                color: SQUAD_COLORS[research.squad].text,
                border: `1px solid ${SQUAD_COLORS[research.squad].border}`,
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {SQUAD_LABELS[research.squad]}
            </span>
          )}
          {research.researcher && (
            <span
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: 9999,
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              🔬 {research.researcher}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link
            to={`/pesquisa/${research.id}/edit`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--purple-600)',
              color: 'var(--purple-600)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Edit Research
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-300)',
              background: 'var(--white)',
              color: 'var(--gray-700)',
            }}
          >
            Delete Research
          </button>
        </div>
      </section>

      <section
        style={{
          marginBottom: '1.5rem',
          padding: '1.5rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Research Information
        </h2>
        <p style={{ color: 'var(--gray-700)', marginBottom: '1rem' }}>
          {research.description}
        </p>
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Team:</strong>{' '}
          {research.team.map((t, i) => (
            <span key={t}>
              👤 {t}
              {i < research.team.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {research.tags.map((tag) => (
            <Link
              key={tag}
              to={`/?tag=${encodeURIComponent(tag)}`}
              title={`See all research tagged "${tag}"`}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 9999,
                background: 'var(--purple-100)',
                color: 'var(--purple-800)',
                fontSize: '0.75rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--purple-200)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--purple-100)'; }}
            >
              {tag}
            </Link>
          ))}
        </div>
        <div
          style={{
            padding: '1rem',
            background: 'var(--purple-50)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--purple-200)',
          }}
        >
          <strong>Methodology:</strong>
          <p style={{ marginTop: '0.25rem' }}>{research.methodology}</p>
        </div>
      </section>

      {research.keyLearnings.length > 0 && (
        <section
          style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'var(--purple-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--purple-200)',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            💡 Key Learnings
          </h2>
          <ol style={{ paddingLeft: '1.25rem' }}>
            {research.keyLearnings.map((learning, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {learning}
              </li>
            ))}
          </ol>
        </section>
      )}

      {research.pptScreenshots && research.pptScreenshots.length > 0 && (
        <section
          style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            PPT Screenshots
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            {research.pptScreenshots.slice(0, 3).map((src, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '16/9',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--radius)',
                  border: '2px solid var(--purple-200)',
                  overflow: 'hidden',
                }}
              >
                <img src={src} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        style={{
          padding: '1.5rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Resources
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(research.presentationUrl || research.pptFile?.url) && (
            <a
              href={research.presentationUrl || research.pptFile?.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--purple-600)',
                borderRadius: 'var(--radius)',
                color: 'white',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              View Full Presentation ↗
            </a>
          )}
          {research.pptFile && !research.presentationUrl && (
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              📄 {research.pptFile.name} ({research.pptFile.size.toFixed(2)} MB)
            </span>
          )}
          {research.pptFile && research.presentationUrl && (
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              📄 {research.pptFile.name} also uploaded
            </span>
          )}
          {research.planFile && (
            <a
              href={research.planFile.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--purple-100)',
                borderRadius: 'var(--radius)',
                color: 'var(--purple-800)',
                fontWeight: 500,
              }}
            >
              View Research Plan ↗
            </a>
          )}
          {research.usefulLinks && research.usefulLinks.length > 0 && (
            <div>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Useful Links</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {research.usefulLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      background: 'var(--gray-100)',
                      borderRadius: 9999,
                      color: 'var(--gray-800)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {link.name} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
          {!research.pptFile && !research.planFile && (!research.usefulLinks || research.usefulLinks.length === 0) && (
            <p style={{ color: 'var(--gray-500)' }}>No resources attached.</p>
          )}
        </div>
      </section>

      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'var(--white)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 400,
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Delete Research</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Are you sure you want to delete "{research.title}"? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-300)',
                  background: 'var(--white)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: 500,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
