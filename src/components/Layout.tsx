import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getApiKey, setApiKey } from '../utils/aiGenerate';

export function Layout() {
  const { pathname } = useLocation();
  const hideButton = pathname === '/submit' || pathname.endsWith('/edit');

  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(false);
  const hasKey = !!getApiKey();

  const openSettings = () => {
    setKeyInput(getApiKey());
    setSaved(false);
    setShowSettings(true);
  };

  const saveKey = () => {
    setApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setShowSettings(false), 700);
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--purple-600), var(--purple-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Research Hub
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--gray-400)',
              borderLeft: '1px solid var(--gray-200)',
              paddingLeft: '0.5rem',
            }}
          >
            GBA
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* AI key settings button */}
          <button
            type="button"
            onClick={openSettings}
            title={hasKey ? 'AI configured — click to change key' : 'Configure Gemini AI key'}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `1px solid ${hasKey ? 'var(--purple-300)' : 'var(--gray-200)'}`,
              background: hasKey ? 'var(--purple-50)' : 'var(--white)',
              color: hasKey ? 'var(--purple-600)' : 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {hasKey ? '✨' : '⚙️'}
          </button>

          {!hideButton && (
            <Link
              to="/submit"
              title="Submit new research"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem 0.5rem 0.625rem',
                borderRadius: '9999px',
                background: 'var(--purple-600)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,58,237,0.35)';
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                +
              </span>
              New Research
            </Link>
          )}
        </div>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* AI Settings Modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 460,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
              ✨ AI Auto-fill Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Add your <strong>Google Gemini API key</strong> to enable automatic filling of description, tags and key learnings when you upload a PDF. Free to use — get your key at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-600)' }}>
                aistudio.google.com
              </a>
              .
            </p>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-300)',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            />
            {keyInput && (
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '-0.75rem', marginBottom: '1rem' }}>
                Stored only in your browser. Never sent anywhere except directly to Google's API.
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-300)',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveKey}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: saved ? '#16a34a' : 'var(--purple-600)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {saved ? '✓ Saved!' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
