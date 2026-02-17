
'use client';

import Link from 'next/link';
import { ShoppingBag, Truck } from 'lucide-react';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('./components/TrackingMap'), { 
  ssr: false,
  loading: () => <div />
});

export default function Home() {
  return (
    <div style={{
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px', 
      background: '#f5f5f7',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Dynamic Background Map */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, opacity: 0.6, filter: 'grayscale(100%) opacity(0.5)'
      }}>
         <TrackingMap status="open" clientCoords={undefined} />
         {/* Overlay gradient for aesthetics */}
         <div style={{
           position: 'absolute', inset: 0,
           background: 'linear-gradient(to bottom, rgba(245,245,247,0.8), rgba(245,245,247,0.4), rgba(245,245,247,0.8))'
         }}></div>
      </div>

      {/* Header with high-end Livreur access */}
      <div style={{
        position: 'absolute',
        top: '40px',
        right: '40px',
        zIndex: 100
      }}>
        <Link href="/jobs" style={{ textDecoration: 'none' }}>
          <div className="hover-scale" style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            border: '1px solid rgba(255,255,255,0.4)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <Truck size={22} color="#1d1d1f" strokeWidth={1.5} />
          </div>
        </Link>
      </div>

      {/* Main App Title / Branding */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        zIndex: 100
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '900', 
          color: '#1d1d1f', 
          letterSpacing: '-1.5px',
          margin: 0
        }}>
          HOPLA
        </h1>
        <div style={{ width: '20px', height: '4px', background: '#0072FF', borderRadius: '2px', marginTop: '2px' }}></div>
      </div>

      {/* Centered COMMANDER Button */}
      <Link href="/create-list" style={{ textDecoration: 'none', width: '100%', maxWidth: '300px', zIndex: 10 }}>
        <div className="animate-float" style={{
          aspectRatio: '1',
          width: '100%',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 30px 60px -12px rgba(0, 114, 255, 0.4)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)', 
            width: '100px', 
            height: '100px', 
            borderRadius: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '32px',
            backdropFilter: 'blur(10px)'
          }}>
            <ShoppingBag size={48} color="white" />
          </div>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '900', 
            color: 'white', 
            letterSpacing: '-1px',
            marginBottom: '4px'
          }}>
            COMMANDER
          </h1>
          <p style={{ color: 'white', opacity: 0.8, fontSize: '15px', fontWeight: '500' }}>
            Je fais mes courses
          </p>
        </div>
      </Link>

      <div style={{
        position: 'absolute', bottom: '30px', left: 0, right: 0, textAlign: 'center', zIndex: 5,
        color: '#86868b', fontSize: '13px', fontWeight: '500'
      }}>
        Des livreurs actifs autour de vous
      </div>

    </div>
  );
}
