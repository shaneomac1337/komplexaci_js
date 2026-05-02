import './cs2-redesign.css';

export default function Loading() {
  return (
    <div className="cs2-redesign" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="cs2-spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
          {'// LOADING'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-0)' }}>
          Counter-Strike 2
        </div>
        <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
          Připravujeme zbraně a mapy
        </div>
      </div>
    </div>
  );
}
