'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, MapPin, MessageCircle, Send, 
  ShoppingBag, CheckCircle2, Navigation, 
  Smartphone, User, Star
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const TrackingMap = dynamic(() => import('../../components/TrackingMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', width: '100%', background: '#e5e3df', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '13px' }}>Initialisation carte...</div>
});

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef<any>(null);
  const hasGreeted = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  // Real-time Chat Subscription
  useEffect(() => {
    if (!params.id) return;
    
    // Initial system message if empty
    if (messages.length === 0) {
       setMessages([{ id: 'init', sender: 'system', text: 'Commande validée ! Nous recherchons votre livreur...' }]);
    }

    const q = query(
      collection(db, `jobs/${params.id}/messages`), 
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
      }));
      if (msgs.length > 0) setMessages(msgs);
    });

    return () => unsubscribe();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const current = data.find((j: any) => j.id === params.id);
      if (current) {
        setJob(current);
        
        // Auto-redirect if mission is finished
        if (current.status === 'completed' || current.status === 'delivered') {
          setTimeout(() => router.push('/'), 3000); // Leave 3s for user to see "Completed" status
        }
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !params.id) return;
    
    try {
      await addDoc(collection(db, `jobs/${params.id}/messages`), {
        text: inputMsg,
        sender: 'client',
        timestamp: serverTimestamp()
      });
      setInputMsg('');
    } catch (e) {
      console.error("Error sending message: ", e);
    }
  };
  const cancelJob = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    try {
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, status: 'cancelled' }),
      });
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) return null; // Avoid Hydration mismatch
  if (loading) return (
     <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', color: '#86868b' }}>
       Chargement...
     </div>
  );

  const getStatusLabel = () => {
    switch(job?.status) {
      case 'open': return 'Recherche d\'un livreur...';
      case 'taken': return 'Courses en cours';
      case 'delivering': return 'Livraison en cours';
      case 'completed': return 'Livraison terminée';
      case 'delivered': return 'Livraison terminée';
      default: return 'Statut inconnu';
    }
  };

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showTipModal, setShowTipModal] = useState(false);

  useEffect(() => {
     if (job?.status === 'delivered') {
        setShowTipModal(true);
     }
  }, [job?.status]);

  const stepIndex = job?.status === 'open' ? 0 : job?.status === 'taken' ? 1 : 2;

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f5f7', color: '#1d1d1f',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* Real Map View */}
      <div style={{
        position: 'relative', height: '45vh', width: '100%', background: '#e5e3df',
        overflow: 'hidden', zIndex: 1
      }}>
        {/* Tracking Map - Only render if coords exist to prevent crash */}
        {job?.locationCoords && typeof job.locationCoords.lat === 'number' ? (
           <TrackingMap status={job?.status || 'open'} clientCoords={job.locationCoords} />
        ) : (
           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#86868b' }}>
             <MapPin size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
             <div style={{ fontSize: '13px' }}>Carte indisponible pour cette adresse</div>
           </div>
        )}

        {/* Header Overlay */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
          <button onClick={() => router.push('/')} style={{
            background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
          }}>
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Cancel Button (Top Right) */}
        {job?.status !== 'completed' && job?.status !== 'delivered' && job?.status !== 'cancelled' && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
            <button onClick={cancelJob} style={{
              background: 'white', border: 'none', borderRadius: '20px', padding: '8px 16px',
              fontWeight: '600', fontSize: '13px', color: '#ff3b30', boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
            }}>
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Tracking Info Card */}
      <div style={{
        flex: 1, background: 'white', marginTop: '-30px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '30px 24px', position: 'relative', zIndex: 20, boxShadow: '0 -20px 40px rgba(0,0,0,0.05)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>{getStatusLabel()}</h1>
            <p style={{ color: '#86868b', fontSize: '15px' }}>
              {job?.status === 'open' ? 'Nous prévenons les livreurs à proximité...' : `Livreur : ${job?.driverName || 'Adama S.'}`}
            </p>
          </div>
          {job?.status !== 'open' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowChat(true)} style={{
                background: '#f2f2f7', border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', position: 'relative'
              }}>
                <MessageCircle size={22} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', background: '#ff3b30', borderRadius: '50%', border: '2px solid white' }}></div>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: '6px', borderRadius: '3px',
              background: i <= stepIndex ? '#007AFF' : '#f2f2f7',
              transition: 'all 0.5s ease'
            }} />
          ))}
        </div>

        {/* Order Summary Item */}
        <div style={{ background: '#f5f5f7', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                <ShoppingBag size={24} color="#007AFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '16px' }}>Ma commande</div>
                <div style={{ fontSize: '13px', color: '#86868b' }}>{job?.items?.length} articles • {job?.location?.split(',')[0]}</div>
              </div>
              <div style={{ fontWeight: '800', fontSize: '17px' }}>{job?.reward}</div>
           </div>
        </div>

        {/* Delivery Address Card */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
           <div style={{ width: '44px', height: '44px', background: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Navigation size={20} color="#007AFF" />
           </div>
           <div>
             <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '600' }}>Adresse de livraison</div>
             <div style={{ fontWeight: '600', fontSize: '15px' }}>{job?.location}</div>
           </div>
        </div>
      </div>

      {/* CHAT OVERLAY */}
      {showChat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'white', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }} className="animate-enter">
          
          <div style={{ padding: '20px', borderBottom: '1px solid #f2f2f7', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', padding: '8px' }}>
              <ArrowLeft size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', background: '#007AFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>AS</div>
              <div>
                <div style={{ fontWeight: '700' }}>Adama S.</div>
                <div style={{ fontSize: '12px', color: '#34c759', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#34c759', borderRadius: '50%' }}></div> En ligne
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.sender === 'client' ? 'flex-end' : m.sender === 'system' ? 'center' : 'flex-start',
                maxWidth: m.sender === 'system' ? '100%' : '80%',
                background: m.sender === 'client' ? '#007AFF' : m.sender === 'system' ? 'none' : '#f2f2f7',
                color: m.sender === 'client' ? 'white' : m.sender === 'system' ? '#86868b' : '#1d1d1f',
                padding: m.sender === 'system' ? '10px' : '12px 16px',
                borderRadius: '18px',
                fontSize: m.sender === 'system' ? '13px' : '15px',
                textAlign: m.sender === 'system' ? 'center' : 'left',
                position: 'relative'
              }}>
                {m.text}
                {m.sender !== 'system' && <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>{m.time}</div>}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '20px 20px 40px 20px', borderTop: '1px solid #f2f2f7', display: 'flex', gap: '10px' }}>
             <input 
               value={inputMsg}
               onChange={(e) => setInputMsg(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
               placeholder="Écrire un message..."
               style={{
                 flex: 1, background: '#f5f5f7', border: 'none', borderRadius: '24px',
                 padding: '12px 20px', fontSize: '15px', outline: 'none'
               }}
             />
             <button onClick={sendMessage} style={{
               background: '#007AFF', color: 'white', border: 'none', borderRadius: '50%',
               width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
               <Send size={20} />
             </button>
          </div>
        </div>
      )}
      {/* TIP MODAL */}
      {showTipModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
           <div style={{
             background: 'white', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
             padding: '32px 24px', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
           }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Livraison Terminée !</h2>
                <p style={{ color: '#86868b', fontSize: '16px' }}>Votre commande a été livrée avec succès.<br/>Souhaitez-vous remercier {job?.driverName || 'le livreur'} ?</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                 {[0, 2, 5, 10].map(val => (
                   <button key={val} onClick={() => setSelectedTip(val)} style={{
                     padding: '16px 0', borderRadius: '16px', border: '1px solid',
                     borderColor: selectedTip === val ? '#007AFF' : '#d2d2d7',
                     background: selectedTip === val ? '#f5faff' : 'white',
                     color: selectedTip === val ? '#007AFF' : '#1d1d1f',
                     fontWeight: '700', fontSize: '16px', transition: 'all 0.2s'
                   }}>
                     {val === 0 ? 'Non' : `${val}€`}
                   </button>
                 ))}
              </div>

              <button onClick={() => {
                setShowTipModal(false);
                // Here we would ideally call API to update tip
                setTimeout(() => router.push('/'), 500); 
              }} style={{
                width: '100%', background: '#007AFF', color: 'white', border: 'none', borderRadius: '16px',
                padding: '18px', fontSize: '17px', fontWeight: '700'
              }}>
                Valider
              </button>
           </div>
        </div>
      )}


      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
        }
      `}</style>
    </div>
  );
}
