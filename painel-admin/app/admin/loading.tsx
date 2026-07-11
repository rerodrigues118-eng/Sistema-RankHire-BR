export default function AdminLoading() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
        <div className="skeleton-card" style={{ height: 220 }} />
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="skeleton-box" style={{ width: '100%' }} />
          <div className="skeleton-box" style={{ width: '100%' }} />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <div className="skeleton-box short" />
            <div className="skeleton-box short" />
          </div>
        </div>
      </div>
    </main>
  );
}
