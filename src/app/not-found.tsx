import Link from 'next/link';

export const metadata = {
  title: 'Stránka nenalezena',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#e6e6f0',
        background:
          'radial-gradient(circle at 30% 20%, rgba(110,79,246,0.18), transparent 60%), radial-gradient(circle at 70% 80%, rgba(0,255,255,0.12), transparent 55%), #0a0a14',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '6rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '1.6rem', margin: '0.6rem 0 0.4rem', fontWeight: 700 }}>
        Tahle stránka neexistuje
      </h1>
      <p style={{ maxWidth: 520, margin: '0 0 1.6rem', color: '#a8a8c0', lineHeight: 1.55 }}>
        URL, kterou hledáš, na webu Komplexáků nenajdeš. Možná pochází ze starší verze stránky.
        Zkus některé z hlavních sekcí:
      </p>
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          maxWidth: 520,
        }}
      >
        {[
          { href: '/', label: 'Domů' },
          { href: '/league-of-legends', label: 'League of Legends' },
          { href: '/cs2', label: 'Counter-Strike 2' },
          { href: '/wwe-games', label: 'WWE Games' },
          { href: '/videotvorba', label: 'Videotvorba' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: '0.55rem 1.05rem',
              borderRadius: 999,
              background: 'rgba(110,79,246,0.18)',
              border: '1px solid rgba(110,79,246,0.45)',
              color: '#e6e6f0',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {l.label}
          </Link>
        ))}
        <a
          href="https://discord.gg/e6BEQpQRBA"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '0.55rem 1.05rem',
            borderRadius: 999,
            background: 'rgba(88,101,242,0.22)',
            border: '1px solid rgba(88,101,242,0.55)',
            color: '#e6e6f0',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Discord
        </a>
      </nav>
    </main>
  );
}
