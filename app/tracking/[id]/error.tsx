'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tracking page error:', error);
  }, [error]);

  return (
    <div style={{ 
      padding: '40px', 
      minHeight: '100vh', 
      background: '#f5f5f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '24px', 
        padding: '32px', 
        maxWidth: '600px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ff3b30', marginBottom: '16px' }}>💥 Erreur de chargement</h2>
        <div style={{ 
          background: '#fff5f5', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #fee2e2'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Message:</div>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '14px',
            color: '#dc2626'
          }}>
            {error.message}
          </pre>
          
          {error.stack && (
            <>
              <div style={{ fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Stack:</div>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '12px',
                color: '#991b1b',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {error.stack}
              </pre>
            </>
          )}
        </div>
        
        <button 
          onClick={() => reset()}
          style={{
            width: '100%',
            padding: '16px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            width: '100%',
            padding: '16px',
            background: '#f5f5f7',
            color: '#1d1d1f',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '12px'
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
