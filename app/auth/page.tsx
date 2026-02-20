'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    const params = new URLSearchParams(window.location.search);
    return params.get('next') || '/';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, redirectTo, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace(redirectTo);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
        padding: '28px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: '900', letterSpacing: '-1px', fontSize: '28px' }}>HOPLA</div>
          <div style={{ color: '#86868b', marginTop: '6px', fontSize: '14px' }}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '14px',
              border: mode === 'login' ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
              background: mode === 'login' ? '#EBF5FF' : 'white',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '14px',
              border: mode === 'register' ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
              background: mode === 'register' ? '#EBF5FF' : 'white',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            style={{
              padding: '14px 14px',
              borderRadius: '14px',
              border: '1.5px solid #E5E5EA',
              background: '#F9F9FB',
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{
              padding: '14px 14px',
              borderRadius: '14px',
              border: '1.5px solid #E5E5EA',
              background: '#F9F9FB',
              fontSize: '15px',
              outline: 'none'
            }}
          />

          {error && (
            <div style={{
              background: '#fff5f5',
              border: '1px solid #fee2e2',
              color: '#b91c1c',
              padding: '10px 12px',
              borderRadius: '14px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            style={{
              marginTop: '6px',
              width: '100%',
              height: '54px',
              borderRadius: '18px',
              border: 'none',
              background: '#007AFF',
              color: 'white',
              fontSize: '16px',
              fontWeight: '800',
              boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)',
              opacity: submitting ? 0.7 : 1,
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Connexion...' : (mode === 'login' ? 'Se connecter' : 'Créer le compte')}
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#86868b', textAlign: 'center', lineHeight: '1.4' }}>
          Pour accéder à <b>Missions</b> ou <b>Admin</b>, vous devez être connecté.
        </div>
      </div>
    </div>
  );
}
