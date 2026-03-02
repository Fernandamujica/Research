import { useState, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
  subscribeSettings,
  DEFAULT_SQUADS,
  DEFAULT_COUNTRIES,
  DEFAULT_RESEARCHERS,
  DEFAULT_METHODOLOGIES,
  type AppSettings,
} from '../utils/settings';

const sectionStyle: React.CSSProperties = {
  padding: '1.5rem',
  background: 'var(--white)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--gray-200)',
  marginBottom: '1.25rem',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  marginBottom: '0.5rem',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--gray-200)',
  fontSize: '0.85rem',
  flex: 1,
  minWidth: 0,
};

const btnSmall: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--gray-200)',
  background: 'var(--white)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  flexShrink: 0,
};

function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState('');

  const add = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <section className="card-shadow" style={sectionStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              style={inputStyle}
            />
            <button type="button" onClick={() => remove(i)} style={btnSmall}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={add}
          style={{
            ...btnSmall,
            background: 'var(--purple-600)',
            color: 'white',
            border: 'none',
            padding: '0.375rem 0.875rem',
            fontWeight: 500,
          }}
        >
          + Add
        </button>
      </div>
    </section>
  );
}

function CountryList({
  countries,
  onChange,
}: {
  countries: { name: string; flag: string }[];
  onChange: (c: { name: string; flag: string }[]) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newFlag, setNewFlag] = useState('');

  const add = () => {
    const name = newName.trim();
    const flag = newFlag.trim() || '🏳️';
    if (name && !countries.some((c) => c.name === name)) {
      onChange([...countries, { name, flag }]);
      setNewName('');
      setNewFlag('');
    }
  };

  const remove = (i: number) => onChange(countries.filter((_, j) => j !== i));

  return (
    <section className="card-shadow" style={sectionStyle}>
      <label style={labelStyle}>Countries</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
        {countries.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={c.flag}
              onChange={(e) => {
                const next = [...countries];
                next[i] = { ...next[i], flag: e.target.value };
                onChange(next);
              }}
              style={{ ...inputStyle, maxWidth: 60, textAlign: 'center' }}
              placeholder="🏳️"
            />
            <input
              type="text"
              value={c.name}
              onChange={(e) => {
                const next = [...countries];
                next[i] = { ...next[i], name: e.target.value };
                onChange(next);
              }}
              style={inputStyle}
            />
            <button type="button" onClick={() => remove(i)} style={btnSmall}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newFlag}
          onChange={(e) => setNewFlag(e.target.value)}
          placeholder="🏳️"
          style={{ ...inputStyle, maxWidth: 60, textAlign: 'center' }}
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Country name"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={add}
          style={{
            ...btnSmall,
            background: 'var(--purple-600)',
            color: 'white',
            border: 'none',
            padding: '0.375rem 0.875rem',
            fontWeight: 500,
          }}
        >
          + Add
        </button>
      </div>
    </section>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeSettings((s) => setSettings(s));
    return () => { unsub?.(); };
  }, []);

  const save = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = async () => {
    const defaults: AppSettings = {
      squads: [...DEFAULT_SQUADS],
      countries: [...DEFAULT_COUNTRIES],
      researchers: [...DEFAULT_RESEARCHERS],
      methodologies: [...DEFAULT_METHODOLOGIES],
    };
    setSettings(defaults);
    setSaving(true);
    await saveSettings(defaults);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '2rem' }}>

      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
          }}
        >
          <span className="text-gradient-primary">⚙️ Settings</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 300 }}>
          Customize squads, countries, researchers and methodologies
        </p>
      </div>

      <EditableList
        label="Squads"
        items={settings.squads}
        onChange={(squads) => setSettings((s) => ({ ...s, squads }))}
        placeholder="New squad name"
      />

      <CountryList
        countries={settings.countries}
        onChange={(countries) => setSettings((s) => ({ ...s, countries }))}
      />

      <EditableList
        label="Researchers"
        items={settings.researchers}
        onChange={(researchers) => setSettings((s) => ({ ...s, researchers }))}
        placeholder="Researcher name"
      />

      <EditableList
        label="Methodologies"
        items={settings.methodologies}
        onChange={(methodologies) => setSettings((s) => ({ ...s, methodologies }))}
        placeholder="e.g. Ethnography"
      />

      {/* Google OAuth */}
      <section className="card-shadow" style={{
        ...sectionStyle,
        border: settings.googleClientId?.trim()
          ? '1px solid var(--gray-200)'
          : '1px solid var(--gray-200)',
      }}>
        <label style={labelStyle}>🔗 Google Docs / Slides Integration</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
          Allows the AI to read corporate Google Docs and Slides when submitting research.
          Researchers sign in with their Google account to authorize reading.
        </p>
        <ol style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.75rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
          <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-600)', fontWeight: 600 }}>Google Cloud Console → Credentials</a></li>
          <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application type)</li>
          <li>Add <code style={{ background: 'var(--gray-100)', padding: '0.1rem 0.3rem', borderRadius: 4, fontSize: '0.75rem' }}>https://fernandamujica.github.io</code> to Authorized JavaScript origins</li>
          <li>Enable <strong>Google Docs API</strong> and <strong>Google Slides API</strong> in the project</li>
          <li>Paste the Client ID below and click <strong>"Save Settings"</strong></li>
        </ol>
        <input
          type="text"
          value={settings.googleClientId ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, googleClientId: e.target.value }))}
          placeholder="OAuth 2.0 Client ID (e.g. 123456789.apps.googleusercontent.com)"
          style={{
            ...inputStyle,
            width: '100%',
            border: settings.googleClientId?.trim()
              ? '1px solid #16a34a'
              : '1px solid var(--gray-200)',
          }}
        />
        {settings.googleClientId?.trim() ? (
          <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.5rem', fontWeight: 500 }}>
            ✓ Client ID configured — Google authentication enabled
          </p>
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
            Optional — without this, only public documents and PDF uploads work
          </p>
        )}
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-300)',
            background: 'var(--white)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={save}
          style={{
            padding: '0.625rem 1.5rem',
            borderRadius: 9999,
            border: 'none',
            background: saved ? '#16a34a' : 'var(--purple-600)',
            color: 'white',
            fontWeight: 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved for everyone!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
