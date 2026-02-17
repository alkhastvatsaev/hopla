'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MinimalTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();
        const foundJob = jobs.find((j: any) => j.id === params.id);
        setJob(foundJob);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid #e5e5ea',
            borderTopColor: '#007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#86868b' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f7',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          padding: '32px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ marginBottom: '12px' }}>Commande introuvable</h2>
          <p style={{ color: '#86868b', marginBottom: '24px' }}>
            Cette commande n'existe pas ou a été supprimée.
          </p>
          <button 
            onClick={() => router.push('/')}
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
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (job.status) {
      case 'open':
        return { emoji: '🔍', text: 'Recherche de livreur...', color: '#007AFF' };
      case 'taken':
        return { emoji: '🚗', text: 'Livreur en route', color: '#34c759' };
      case 'delivered':
        return { emoji: '✅', text: 'Livré !', color: '#34c759' };
      case 'cancelled':
        return { emoji: '❌', text: 'Annulé', color: '#ff3b30' };
      default:
        return { emoji: '📦', text: 'En cours', color: '#86868b' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f7',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          padding: '32px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{statusInfo.emoji}</div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            color: statusInfo.color,
            marginBottom: '8px'
          }}>
            {statusInfo.text}
          </h1>
          <p style={{ color: '#86868b', fontSize: '14px' }}>
            Commande #{job.id.slice(0, 8)}
          </p>
        </div>

        {/* Details */}
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Détails de la commande
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>
              Livraison
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {job.location}
            </div>
          </div>

          {job.pickupLocation && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>
                Point de retrait
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {job.pickupLocation}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>
              Articles
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {job.items?.length || 0} article{job.items?.length > 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ 
            borderTop: '1px solid #e5e5ea',
            paddingTop: '16px',
            marginTop: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              <span>Total</span>
              <span>{job.reward}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '18px',
            background: '#f5f5f7',
            color: '#1d1d1f',
            border: 'none',
            borderRadius: '16px',
            fontSize: '17px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
