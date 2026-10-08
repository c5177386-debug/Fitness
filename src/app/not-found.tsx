import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🔍</div>
          <h1 style={{ fontSize: 28, color: '#0f172a', marginBottom: 16 }}>Page Not Found</h1>
          <p style={{ color: '#475569', marginBottom: 32 }}>
            The page you were looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/en"
            style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
          >
            ← Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
