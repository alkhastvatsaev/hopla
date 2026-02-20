'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [showInstallMessage, setShowInstallMessage] = useState(false);

  useEffect(() => {
    // Check if the device is iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Check if the app is already installed (standalone mode)
    const isInStandaloneMode = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-ignore
      const isStandaloneNav = window.navigator.standalone || false;
      return isStandaloneMedia || isStandaloneNav;
    };

    // Show the popup only if on iOS, not standalone, and not dismissed before
    if (isIos() && !isInStandaloneMode()) {
      const hasDismissed = localStorage.getItem('pwaPromptDismissed');
      if (!hasDismissed) {
        // Slight delay to avoid showing immediately on first load frame
        const timer = setTimeout(() => setShowInstallMessage(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowInstallMessage(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!showInstallMessage) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px', // Just above the tab bar
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      borderRadius: '24px',
      boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid rgba(0,0,0,0.05)',
      animation: 'enter 0.5s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1d1d1f', letterSpacing: '-0.5px' }}>
          Installer l'Application Hopla
        </h3>
        <button onClick={handleDismiss} style={{ 
          background: '#f2f2f7', border: 'none', color: '#86868b', 
          width: '28px', height: '28px', borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', cursor: 'pointer' 
        }}>
          &times;
        </button>
      </div>
      
      <p style={{ margin: 0, fontSize: '14px', color: '#86868b', lineHeight: '1.4' }}>
        Ajoutez cette application sur votre écran d'accueil pour une expérience fluide en plein écran.
      </p>

      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1d1d1f', fontWeight: '600', 
        background: '#f5f5f7', padding: '14px', borderRadius: '16px', marginTop: '4px' 
      }}>
        <span>Appuyez sur</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        <span>puis <strong style={{color: '#007AFF'}}>Sur l'écran d'accueil</strong></span>
      </div>
    </div>
  );
}
