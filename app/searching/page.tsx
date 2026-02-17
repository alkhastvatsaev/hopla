'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  useEffect(() => {
    // Attendre 3 secondes puis rediriger vers tracking
    const timer = setTimeout(() => {
      if (jobId) {
        router.push(`/tracking/${jobId}`);
      } else {
        router.push('/');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [jobId, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Animated circles */}
      <div style={{ position: 'relative', marginBottom: '40px' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>

      <div style={{
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '12px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🔍 Recherche de livreur...
        </h1>
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          Nous cherchons le meilleur livreur disponible
        </p>
        <p style={{
          fontSize: '14px',
          opacity: 0.7
        }}>
          Cela ne prendra que quelques secondes
        </p>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '40px'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'white',
              opacity: 0.5,
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
}
