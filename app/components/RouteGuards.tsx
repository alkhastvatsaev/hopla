'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const next = useMemo(() => {
    const p = pathname || '/';
    return encodeURIComponent(p);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?next=${next}`);
    }
  }, [loading, user, router, next]);

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
        color: '#86868b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
      }}>
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    const list = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (list.length === 0) return false;
    return !!user?.email && list.includes(user.email.toLowerCase());
  }, [user?.email]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?next=${encodeURIComponent(pathname || '/admin/support')}`);
      return;
    }
    if (!loading && user && !allowed) {
      router.replace('/');
    }
  }, [loading, user, allowed, router, pathname]);

  if (loading || !user || !allowed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
        color: '#86868b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
      }}>
        Accès sécurisé...
      </div>
    );
  }

  return <>{children}</>;
}
