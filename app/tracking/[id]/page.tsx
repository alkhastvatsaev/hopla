'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, MessageCircle, Send, 
  ShoppingBag, CheckCircle2, Navigation, 
  Smartphone, User, Star, ChevronDown, ChevronUp, Pencil, Check,
  CreditCard, Wallet
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import JobChat from '../../components/JobChat';
import DeliveryRating from '../../components/DeliveryRating';

const TrackingMap = dynamic(() => import('../../components/TrackingMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', width: '100%', background: '#e5e3df', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '13px' }}>Initialisation carte...</div>
});

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showItems, setShowItems] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [searchTimeoutRef] = useState<any>({ current: null });
  const isUpdatingRef = useRef(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingStep, setRatingStep] = useState<'rate' | 'tip'>('rate');
  const [eta, setEta] = useState(15); // Default 15 minutes

  // Dynamic ETA adjustment based on status
  useEffect(() => {
    if (job?.status === 'taken') setEta(12);
    if (job?.status === 'delivering') setEta(5);
    
    // Smooth countdown every 60 seconds
    const interval = setInterval(() => {
      setEta(prev => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(interval);
  }, [job?.status]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    // MODE DEBUG: Charger des données fictives sans appeler Firebase
    if (jobId === 'debug-123') {
      setJob({
        id: 'debug-123',
        status: 'open',
        type: 'courses',
        items: [
          { name: 'Papier toilette Lotus x12', price: 6.50 },
          { name: 'Doliprane 1000mg tab', price: 2.15 }
        ],
        location: '17 Rue Sénèque, Strasbourg',
        locationCoords: { lat: 48.5734, lng: 7.7521 },
        reward: '7.50€',
        deliveryFee: 4.50,
        tip: 3.00,
        totalAmount: 16.15,
        paymentMethod: 'card'
      });
      setLoading(false);
      return;
    }

    // Use onSnapshot for real-time updates instead of polling
    const jobRef = doc(db, 'jobs', jobId);
    const unsubscribe = onSnapshot(jobRef, (snapshot) => {
      if (snapshot.exists()) {
        const current = { id: snapshot.id, ...snapshot.data() } as any;
        
        // Prevent reversion: only update state if we are NOT currently sending a manual update
        if (!isUpdatingRef.current) {
          setJob(current);
        }
        
        if (current.status !== 'open') {
          setIsEditingAddress(false);
        }
        
        // Auto-show tip modal if mission is finished
        if ((current.status === 'completed' || current.status === 'delivered') && !showTipModal) {
          setShowTipModal(true);
          setRatingStep('rate');
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId, showTipModal]);

  const cancelJob = async () => {
    try {
      console.log('Attempting to cancel job:', jobId);
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status: 'cancelled' }),
      });
      if (res.ok) {
        router.push('/');
      } else {
        const err = await res.json();
        console.error('Cancel failed:', err);
        alert('Erreur lors de l\'annulation: ' + (err.error || 'Inconnu'));
      }
    } catch (e) {
      console.error('Cancel catch error:', e);
      alert('Erreur réseau lors de l\'annulation');
    }
  };

  const saveAddress = async () => {
    if (!tempAddress.trim() || tempAddress === job.location) {
      setIsEditingAddress(false);
      return;
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, location: tempAddress }),
      });
      if (res.ok) {
        setJob({ ...job, location: tempAddress });
        setIsEditingAddress(false);
      }
    } catch (e) {
      console.error("Error updating address:", e);
      alert("Erreur lors de la mise à jour de l'adresse");
    }
  };

  const handleAddressSearch = (val: string) => {
    setTempAddress(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn("Search fetch failed", e);
        }
      }
    }, 400); // 400ms debounce
  };

  const selectSuggestion = async (s: any) => {
    const newAddr = s.display_name.split(',').slice(0, 3).join(',');
    const newCoords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    
    // Close UI immediately and LOCK sync
    setAddressSuggestions([]);
    setIsEditingAddress(false);
    isUpdatingRef.current = true;
    
    // Optimistic UI update
    setJob((prev: any) => ({ ...prev, location: newAddr, locationCoords: newCoords }));

    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: jobId, 
          location: newAddr,
          locationCoords: newCoords
        }),
      });

      if (res.ok) {
        // Keep the lock for a bit to let Firestore background sync catch up
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 2000);
      } else {
        isUpdatingRef.current = false;
      }
    } catch (e) {
      console.error("Failed to sync address change to server", e);
      isUpdatingRef.current = false;
    }
  };

  if (!mounted) return null; // Avoid Hydration mismatch
  
  if (loading) return (
     <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', color: '#86868b' }}>
       <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', height: '40px', border: '3px solid #e5e5ea', borderTopColor: '#007AFF', 
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' 
          }} />
          <div style={{ fontSize: '15px', fontWeight: '500' }}>Chargement...</div>
       </div>
       <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
     </div>
  );

  if (!job) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Commande introuvable</h2>
          <p style={{ color: '#86868b', marginBottom: '24px', fontSize: '15px' }}>Cette commande n'existe pas ou a été annulée.</p>
          <button onClick={() => router.push('/')} style={{ width: '100%', padding: '16px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600' }}>Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  const getStatusLabel = () => {
    switch(job.status) {
      case 'open': return 'Recherche d\'un livreur...';
      case 'taken': return 'Courses en cours';
      case 'delivering': return 'Livraison en cours';
      case 'completed': return 'Livraison terminée';
      case 'delivered': return 'Livraison terminée';
      case 'cancelled': return 'Commande annulée';
      default: return 'Suivi de commande';
    }
  };

  const stepIndex = job.status === 'open' ? 0 : (['taken', 'delivering'].includes(job.status) ? 1 : 2);

  return (
    <div style={{
      minHeight: '100vh',
      color: '#1d1d1f',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      overflow: 'hidden' // Prevent root bounce
    }}>
      
      {/* 1. BACKGROUND MAP - FULLSCREEN & FIXED */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        background: '#e5e3df'
      }}>
        <TrackingMap status={job.status || 'open'} clientCoords={job.locationCoords} />
      </div>

      {/* 2. FLOATING HEADER */}
      <div style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 20px)',
        left: 0, right: 0,
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              width: '44px', height: '44px',
              borderRadius: '22px',
              background: 'white',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT AREA */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Transparent top half to show map */}
        <div style={{ height: '40vh', flexShrink: 0 }} />

        {/* The "Sheet" Container */}
        <div style={{
          minHeight: '100vh',
          background: 'white',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.08)',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%',
          padding: '32px 24px 120px 24px',
          position: 'relative',
          flex: 1
        }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  {getStatusLabel()}
                </h1>
                {['taken', 'delivering'].includes(job.status) && (
                  <div style={{ 
                    background: '#E8F5E9', padding: '4px 10px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    animation: 'pulse 2s infinite'
                  }}>
                    <div style={{ width: '6px', height: '6px', background: '#34C759', borderRadius: '50%' }}></div>
                    <span style={{ color: '#248A3D', fontWeight: '700', fontSize: '13px' }}>~{eta} min</span>
                  </div>
                )}
              </div>
              <p style={{ color: '#86868b', fontSize: '15px' }}>
                {job.status === 'open' 
                  ? 'Nous prévenons les livreurs à proximité...' 
                  : job.status === 'cancelled' 
                    ? 'Cette commande a été annulée.' 
                    : `Livreur : ${job.driverName || 'En route'}`
                }
              </p>
            </div>
            
            {job.status !== 'open' && job.status !== 'cancelled' && (
              <button 
                onClick={() => setShowChat(true)}
                style={{
                  width: '48px', height: '48px',
                  borderRadius: '24px',
                  background: '#F2F2F7',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#007AFF',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={22} />
              </button>
            )}
          </div>

          {/* Progress Bar Container */}
          {job.status !== 'cancelled' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: '6px', borderRadius: '3px',
                  background: i <= stepIndex ? '#007AFF' : '#F2F2F7',
                  transition: 'background 0.5s ease'
                }} />
              ))}
            </div>
          )}

          {/* INSET CARDS SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Command Detail Cell */}
            <div 
              style={{
                background: '#F9F9FB',
                borderRadius: '24px',
                padding: '16px',
                transition: 'all 0.2s ease',
                border: '1px solid #F2F2F7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: '16px',
                  background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <ShoppingBag size={24} color="#007AFF" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '17px' }}>
                    {job.type === 'colis' ? 'Mon Colis' : 'Ma commande'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#86868b' }}>
                    {job.items?.length || 0} articles • {job.location?.split(',')[0]}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '800', fontSize: '18px' }}>{job.reward}</span>
                </div>
              </div>

              {/* Always visible Item List */}
              {job.items && job.items.length > 0 && (
                <div style={{ 
                  marginTop: '16px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid #E5E5EA',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  {job.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500' }}>{typeof item === 'string' ? item : item.name}</span>
                      {item.price && <span style={{ color: '#86868b' }}>{item.price.toFixed(2)}€</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Pricing Breakdown */}
            <div style={{
              background: '#F9F9FB', borderRadius: '24px', padding: '16px',
              border: '1px solid #F2F2F7'
            }}>
              <div style={{ fontSize: '12px', color: '#86868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Détail du prix
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {job.items && job.items.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#86868b' }}>Panier estimé ({job.items.length} art.)</span>
                    <span style={{ fontWeight: '600' }}>
                      {job.items.reduce((acc: number, i: any) => acc + (typeof i === 'string' ? 0 : (i.price || 0) * (i.quantity || 1)), 0).toFixed(2)}€
                    </span>
                  </div>
                )}
                {job.deliveryFee != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#86868b' }}>Frais de livraison</span>
                    <span style={{ fontWeight: '600' }}>{Number(job.deliveryFee).toFixed(2)}€</span>
                  </div>
                )}
                {job.tip > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#86868b' }}>Pourboire</span>
                    <span style={{ fontWeight: '600', color: '#34C759' }}>{Number(job.tip).toFixed(2)}€</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <span style={{ fontWeight: '700' }}>Total</span>
                  <span style={{ fontWeight: '800' }}>{job.totalAmount ? Number(job.totalAmount).toFixed(2) : job.reward}€</span>
                </div>
              </div>
            </div>

            {/* 3. Delivery Address Cell */}
            <div 
              style={{
                background: '#F9F9FB',
                borderRadius: '24px',
                padding: '16px',
                border: '1px solid #F2F2F7',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: '16px',
                  background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <Navigation size={24} color="#34C759" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#86868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Adresse de livraison
                  </div>
                  {isEditingAddress ? (
                    <div style={{ position: 'relative', marginTop: '4px' }}>
                      <input 
                        value={tempAddress}
                        onChange={(e) => handleAddressSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveAddress()}
                        autoFocus
                        style={{
                          width: '100%', padding: '10px 12px',
                          borderRadius: '12px', border: '2px solid #007AFF',
                          fontSize: '15px', fontWeight: '600', outline: 'none'
                        }}
                      />
                      {addressSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', borderRadius: '16px', marginTop: '8px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 50,
                          overflow: 'hidden', border: '1px solid #F2F2F7'
                        }}>
                          {addressSuggestions.map((s, i) => (
                            <div 
                              key={i}
                              onClick={() => selectSuggestion(s)}
                              style={{ 
                                padding: '12px 16px', borderBottom: '1px solid #F2F2F7',
                                cursor: 'pointer' 
                              }}
                            >
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.display_name.split(',')[0]}</div>
                              <div style={{ fontSize: '12px', color: '#86868b' }}>{s.display_name.split(',').slice(1,3).join(',')}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '2px' }}>
                      {job.location}
                    </div>
                  )}
                </div>

                {job.status === 'open' && (
                  <button 
                    onClick={() => isEditingAddress ? saveAddress() : setIsEditingAddress(true)}
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '18px',
                      background: 'white',
                      border: '1px solid #E5E5EA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#007AFF',
                      cursor: 'pointer'
                    }}
                  >
                    {isEditingAddress ? <Check size={18} /> : <Pencil size={18} />}
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Proof (if available) */}
            {job.deliveryProofUrl && (
              <div style={{
                background: '#F9F9FB', borderRadius: '24px', padding: '16px',
                border: '1px solid #F2F2F7'
              }}>
                <div style={{ fontSize: '12px', color: '#86868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  Preuve de livraison
                </div>
                <img src={job.deliveryProofUrl} alt="Preuve" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
            )}

            {/* 4. Driver Context (If taken) */}
            {job.status !== 'open' && job.driverName && (
              <div style={{
                background: '#F9F9FB',
                borderRadius: '24px',
                padding: '16px',
                border: '1px solid #F2F2F7',
                display: 'flex', gap: '16px', alignItems: 'center'
              }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: '28px',
                  background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden'
                }}>
                  <User size={30} color="#AEAEB2" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{job.driverName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#FF9500' }}>
                    <Star size={14} fill="#FF9500" />
                    <span style={{ fontWeight: '600' }}>4.9 • Votre livreur Hopla</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Payment Context */}
            <div style={{
              background: '#F9F9FB',
              borderRadius: '24px',
              padding: '16px',
              border: '1px solid #F2F2F7',
              display: 'flex', gap: '16px', alignItems: 'center'
            }}>
              <div style={{
                width: '56px', height: '56px',
                borderRadius: '16px',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {job.paymentMethod === 'cash' ? <Wallet size={24} color="#FF9500" /> : <CreditCard size={24} color="#007AFF" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#86868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mode de paiement
                </div>
                <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '2px' }}>
                  {job.paymentMethod === 'cash' ? 'Espèces (à la livraison)' : 'Carte Bancaire (Payé)'}
                </div>
              </div>
            </div>
            
          </div>

          {/* Cancellation section */}
          {['open', 'taken'].includes(job.status) && (
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
              <button 
                onClick={cancelJob}
                style={{
                  background: 'none', border: 'none',
                  color: '#8E8E93', fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer', opacity: 0.8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
              >
                Annuler ma commande
              </button>
            </div>
          )}

        </div>
      </div>

      {/* OVERLAYS */}
      {showChat && (
        <JobChat jobId={jobId} role="client" onClose={() => setShowChat(false)} />
      )}

      {showTipModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(10px)', zIndex: 2000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
            <div className="animate-slide-up" style={{
              background: 'white', width: '100%', maxWidth: '500px', 
              borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
              padding: '40px 24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              maxHeight: '90vh', overflowY: 'auto'
            }}>
              {showThankYou ? (
                <div className="animate-enter" style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', marginTop: '20px' }}>Merci !</h2>
                  <p style={{ color: '#86868b', fontSize: '17px', lineHeight: '1.5', marginBottom: '32px' }}>
                    Votre commande est terminée. {selectedTip ? `Votre pourboire de ${selectedTip}€ a bien été transmis.` : ''}<br/>
                    À bientôt sur <strong>Hopla</strong> !
                  </p>
                  <button 
                    onClick={() => router.push('/')} 
                    style={{
                      width: '100%', background: '#007AFF', color: 'white', border: 'none', 
                      borderRadius: '18px', height: '60px', fontSize: '18px', fontWeight: '700',
                      boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)'
                    }}
                  >
                    Retour à l&apos;accueil
                  </button>
                </div>
              ) : ratingStep === 'rate' ? (
                <div className="animate-enter">
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📦</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Livraison réussie !</h2>
                    <p style={{ color: '#86868b', fontSize: '15px' }}>Évaluez votre expérience</p>
                  </div>
                  <DeliveryRating
                    jobId={jobId}
                    role="client"
                    onComplete={() => { setHasRated(true); setRatingStep('tip'); }}
                  />
                  <button
                    onClick={() => setRatingStep('tip')}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      color: '#86868b', fontSize: '14px', fontWeight: '500',
                      marginTop: '12px', cursor: 'pointer'
                    }}
                  >
                    Passer
                  </button>
                </div>
              ) : (
                <div className="animate-enter" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>💝</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Un pourboire ?</h2>
                    <p style={{ color: '#86868b', fontSize: '15px' }}>Encouragez votre livreur</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                     {[0, 2, 5, 10].map(val => (
                       <button 
                        key={val} 
                        onClick={() => setSelectedTip(val)} 
                        style={{
                          height: '60px', borderRadius: '18px', border: '1.5px solid',
                          borderColor: selectedTip === val ? '#007AFF' : '#E5E5EA',
                          background: selectedTip === val ? '#F5FAFF' : 'white',
                          color: selectedTip === val ? '#007AFF' : '#1D1D1F',
                          fontWeight: '700', fontSize: '17px',
                          transition: 'all 0.2s'
                        }}
                       >
                         {val === 0 ? 'Non' : `${val}€`}
                       </button>
                     ))}
                  </div>

                  <button 
                    onClick={async () => { 
                      if (selectedTip && selectedTip > 0) {
                        setIsTipping(true);
                        try {
                          await fetch('/api/jobs', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              id: jobId, 
                              postTip: selectedTip
                            }),
                          });
                          await new Promise(r => setTimeout(r, 800));
                        } catch (e) {
                          console.error("Tip update failed", e);
                        } finally {
                          setIsTipping(false);
                        }
                      }
                      setShowThankYou(true); 
                    }} 
                    disabled={isTipping}
                    style={{
                      width: '100%', background: '#007AFF', color: 'white', border: 'none', 
                      borderRadius: '18px', height: '60px', fontSize: '18px', fontWeight: '700',
                      boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)',
                      opacity: isTipping ? 0.7 : 1
                    }}
                  >
                    {isTipping ? 'Paiement sécurisé...' : 'Valider'}
                  </button>
                </div>
              )}
            </div>
        </div>
      )}

      <style jsx global>{`
        .animate-enter { animation: enter 0.3s ease-out; }
        @keyframes enter { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
