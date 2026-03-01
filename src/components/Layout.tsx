import { Outlet, Link, useLocation } from 'react-router-dom';

export function Layout() {
  const { pathname } = useLocation();
  const hideButton = pathname === '/submit' || pathname.endsWith('/edit');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                fontSize: '1.2rem',
                fontWeight: 700,
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
                fontSize: '0.6rem',
                fontWeight: 500,
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

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Link
              to="/"
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: pathname === '/' ? 500 : 400,
                color: pathname === '/' ? 'var(--purple-700)' : 'var(--gray-500)',
                background: pathname === '/' ? 'var(--purple-50)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              Research
            </Link>
            <Link
              to="/cross-geo"
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: pathname === '/cross-geo' ? 500 : 400,
                color: pathname === '/cross-geo' ? 'var(--purple-700)' : 'var(--gray-500)',
                background: pathname === '/cross-geo' ? 'var(--purple-50)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              🌐 Cross-geo Insights
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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

    </>
  );
}
