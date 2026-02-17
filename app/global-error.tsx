
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px' }}>
          <h2>💥 Une erreur critique est survenue !</h2>
          <pre style={{ background: '#eee', padding: '20px', overflowX: 'auto', borderRadius: '8px' }}>
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
            {error.stack}
          </pre>
          <button onClick={() => reset()} style={{ marginTop: '20px', padding: '10px 20px', background: 'black', color: 'white' }}>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
