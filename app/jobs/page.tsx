
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, MapPin, Camera, ArrowRight, Package, Wallet, TrendingUp, History, TrendingDown, ChevronRight, ShoppingBag, MessageCircle, Upload, Navigation, Filter, SlidersHorizontal, Map } from 'lucide-react';
import dynamic from 'next/dynamic';
import JobChat from '../components/JobChat';
import ProofOfDelivery from '../components/ProofOfDelivery';
import { RequireAuth } from '../components/RouteGuards';
import { useAuth } from '../components/AuthProvider';
import DriverOnboarding from '../components/DriverOnboarding';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DriverMap = dynamic(() => import('../components/DriverMap'), { ssr: false });

export default function JobsPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputTicket, setInputTicket] = useState<{ [key: string]: string }>({});
  const [photoProof, setPhotoProof] = useState<{ [key: string]: boolean }>({});
  const [showAccounting, setShowAccounting] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'colis'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'card' | 'cash'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'reward' | 'distance'>('recent');
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [driverProfile, setDriverProfile] = useState<{ displayName: string; photoURL?: string | null } | null>(null);
  const [loadingDriverProfile, setLoadingDriverProfile] = useState(true);



  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setJobs(data.reverse()); 
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setDriverProfile(null);
        setLoadingDriverProfile(false);
        return;
      }
      setLoadingDriverProfile(true);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.displayName) {
            setDriverProfile({ displayName: data.displayName, photoURL: data.photoURL || null });
          } else {
            setDriverProfile(null);
          }
        } else {
          setDriverProfile(null);
        }
      } catch (e) {
        console.warn('Failed to load driver profile', e);
        setDriverProfile(null);
      } finally {
        setLoadingDriverProfile(false);
      }
    };
    load();
  }, [user?.uid]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn('Geolocation denied')
      );
    }
  }, []);

  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const openNavigation = (coords: {lat: number, lng: number}, address: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${coords.lat},${coords.lng}&q=${encodeURIComponent(address)}`);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`);
    }
  };

  const acceptJob = async (id: string, e: any) => {
    e.stopPropagation();
    if (!user?.uid) return;
    if (!driverProfile?.displayName) {
      alert('Complétez votre profil livreur avant d\'accepter une mission.');
      return;
    }
    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'taken',
          driverId: user.uid,
          driverName: driverProfile.displayName,
          driverPhotoUrl: driverProfile.photoURL || null,
        }),
      });

      if (res.status === 409) {
        const errorData = await res.json();
        alert(errorData.error);
        fetchJobs(); 
        return;
      }

      if (!res.ok) throw new Error('Failed to accept job');
      fetchJobs(); 
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'acceptation");
    }
  };

  const acceptCombo = async (combo: any[], e: any) => {
    e.stopPropagation();
    try {
      for (const job of combo) {
        await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: job.id, status: 'taken' }),
        });
      }
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'acceptation du Combo");
    }
  };

  const validateReceipt = async (id: string, reward: string) => {
    const price = inputTicket[id] || "0";
    const rewardVal = parseFloat(reward.replace('€', '').replace(',', '.'));
    const ticketVal = parseFloat(price.replace(',', '.'));
    const totalToCollect = (rewardVal + ticketVal).toFixed(2);

    try {
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: 'delivering', 
          ticketPrice: ticketVal, 
          totalToCollect 
        }),
      });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const completeJob = async (id: string, e: any) => {
    e.stopPropagation();
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    const isCash = job.paymentMethod === 'cash';
    const message = isCash 
      ? `Confirmez-vous avoir reçu ${job.totalToCollect}€ en espèces ?`
      : "Confirmez-vous avoir livré la commande ? Le client sera débité automatiquement.";

    try {
      if (confirm(message)) {
        await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'completed', isPaid: true }),
        });
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stats Logic
  const completedJobs = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs]);
  const totalEarnings = useMemo(() => {
    return completedJobs.reduce((acc, j) => {
      const base = parseFloat(j.reward.replace('€', '').replace(',', '.'));
      const tip = j.postTip ? parseFloat(j.postTip) : 0;
      return acc + base + tip;
    }, 0).toFixed(2);
  }, [completedJobs]);

  const cancelJob = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir annuler cette mission ? Elle sera remise en ligne.')) return;
    try {
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'open' }),
      });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const earningsByDay = useMemo(() => {
    // Mock simulation: split completed jobs into today and yesterday
    const today = completedJobs.slice(0, Math.ceil(completedJobs.length / 2));
    return today.reduce((acc, j) => {
      const base = parseFloat(j.reward.replace('€', '').replace(',', '.'));
      const tip = j.postTip ? parseFloat(j.postTip) : 0;
      return acc + base + tip;
    }, 0).toFixed(2);
  }, [completedJobs]);

  const myActiveJobs = useMemo(() => {
    const uid = user?.uid;
    return jobs
      .filter(j => ['taken', 'delivering'].includes(j.status))
      .filter(j => (uid ? j.driverId === uid : true))
      .slice(0, 5);
  }, [jobs, user?.uid]);

  const availableJobs = useMemo(() => {
    let filtered = jobs.filter(j => j.status === 'open');
    if (filterType !== 'all') filtered = filtered.filter(j => j.type === filterType);
    if (filterPayment !== 'all') filtered = filtered.filter(j => j.paymentMethod === filterPayment);

    if (sortBy === 'distance' && driverLocation) {
      filtered.sort((a, b) => {
        const distA = a.locationCoords ? getDistanceKm(driverLocation.lat, driverLocation.lng, a.locationCoords.lat, a.locationCoords.lng) : 999;
        const distB = b.locationCoords ? getDistanceKm(driverLocation.lat, driverLocation.lng, b.locationCoords.lat, b.locationCoords.lng) : 999;
        return distA - distB;
      });
    } else if (sortBy === 'reward') {
      filtered.sort((a, b) => {
        const rA = parseFloat(String(a.reward || '0').replace('€', '').replace(',', '.'));
        const rB = parseFloat(String(b.reward || '0').replace('€', '').replace(',', '.'));
        return rB - rA;
      });
    }

    return filtered.slice(0, 40);
  }, [jobs, filterType, filterPayment, sortBy, driverLocation]);

  const comboJobs = useMemo(() => {
    const combos: any[] = [];
    const usedIds = new Set<string>();
    const eligibleJobs = availableJobs.filter(j => j.locationCoords);
    
    for (let i = 0; i < eligibleJobs.length; i++) {
        const job1 = eligibleJobs[i];
        if (usedIds.has(job1.id)) continue;
        
        for (let j = i + 1; j < eligibleJobs.length; j++) {
            const job2 = eligibleJobs[j];
            if (usedIds.has(job2.id)) continue;
            
            const dist = getDistanceKm(job1.locationCoords.lat, job1.locationCoords.lng, job2.locationCoords.lat, job2.locationCoords.lng);
            if (dist < 1.5) { // Less than 1.5 km apart means a great combo
                combos.push([job1, job2]);
                usedIds.add(job1.id);
                usedIds.add(job2.id);
                break; // Find pairs only
            }
        }
    }
    return combos;
  }, [availableJobs]);

  return (
    <RequireAuth>
    <div style={{
      minHeight: '100vh', 
      background: '#f5f5f7', 
      color: '#1d1d1f', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* Discreet Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px'}}>
        <button onClick={() => showAccounting ? setShowAccounting(false) : router.push('/')} style={{
          background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
           <ArrowLeft size={20} color="#1d1d1f" />
        </button>
        <div style={{fontWeight: '700', fontSize: '17px'}}>{showAccounting ? 'Comptabilité' : 'Missions'}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              try {
                await logout();
              } finally {
                router.push('/');
              }
            }}
            style={{
              background: 'white', border: 'none', borderRadius: '16px', padding: '10px 12px',
              fontWeight: '700', fontSize: '12px', color: '#007AFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            Déconnexion
          </button>
          {!showAccounting && (
            <button onClick={() => setShowAccounting(true)} style={{
              background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
               <Wallet size={20} color="#007AFF" />
            </button>
          )}
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
        
        {myActiveJobs.length === 0 && availableJobs.length === 0 && !showAccounting && (
          <div style={{ 
            textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>☕️</div>
            <div style={{ fontWeight: '700', fontSize: '17px', color: '#1d1d1f', marginBottom: '4px' }}>Calme plat à Strasbourg</div>
            <div style={{ fontSize: '14px', color: '#86868b' }}>Aucune nouvelle mission pour le moment. Reposez-vous bien !</div>
          </div>
        )}

        {showAccounting ? (
          <div className="animate-enter">
            {/* ACCOUNTING HUB */}
            {/* ACCOUNTING HUB */}
            <div style={{ background: 'white', borderRadius: '28px', padding: '32px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', marginBottom: '24px', textAlign: 'center', position: 'relative' }}>
                <button 
                  onClick={async () => {
                    if(!confirm('SUPPRIMER TOUTES LES COMMANDES ? (Action irréversible)')) return;
                    try {
                      await fetch('/api/jobs', { method: 'DELETE' });
                      fetchJobs();
                    } catch(e) { console.error(e); }
                  }}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: '#fff1f0', color: '#ff3b30', border: 'none',
                    padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700'
                  }}>
                  PURGER TOUT
                </button>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#86868b', marginBottom: '8px' }}>Solde disponible</div>
                <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1px', color: '#1d1d1f' }}>{totalEarnings}€</div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', color: '#34c759', background: '#f2fcf5', padding: '8px 16px', borderRadius: '20px', width: 'fit-content', margin: '20px auto 0 auto' }}>
                  <TrendingUp size={16} />
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>+{earningsByDay}€ aujourd'hui</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#86868b', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Missions</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{completedJobs.length}</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#86868b', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Dist. est.</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{completedJobs.length * 4.2}km</div>
              </div>
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', marginLeft: '4px' }}>Historique récent</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedJobs.map(job => (
                <div key={job.id} style={{ background: 'white', padding: '16px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', background: '#f2f2f7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {job.type === 'colis' ? <Package size={20} color="#86868b" /> : <ShoppingBag size={20} color="#86868b" />}
                     </div>
                     <div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{job.type === 'colis' ? 'Livraison Colis' : 'Courses'}</div>
                        <div style={{ fontSize: '12px', color: '#86868b' }}>
                          Terminée • {job.location.split(',')[0]}
                          {job.deliveryFee && ` • Frais: ${job.deliveryFee.toFixed(2)}€`}
                        </div>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#1d1d1f' }}>
                      {(parseFloat(job.reward.replace('€', '').replace(',', '.')) + (job.postTip || 0)).toFixed(2)}€
                    </div>
                    {job.postTip > 0 && (
                      <div style={{ fontSize: '10px', color: '#34c759', fontWeight: '700' }}>+ {job.postTip}€ Tip</div>
                    )}
                  </div>
                </div>
              ))}
              {completedJobs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#86868b' }}>
                   Aucune mission terminée pour le moment.
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* SECTION: MISSION EN COURS */}
            {myActiveJobs.length > 0 && (
              <div>
                <div style={{fontSize: '13px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px'}}>
                  Mission en cours
                </div>
                {myActiveJobs.map((job) => (
                   <div key={job.id} style={{
                     background: 'white', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden',
                     boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)'
                   }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{fontSize: '15px', color: '#86868b'}}>{job.user}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={(e) => cancelJob(job.id, e)} style={{
                                background: '#fef2f2', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30'
                              }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                              {/* Navigation Button */}
                              {job.locationCoords && (
                                <button onClick={() => openNavigation(job.locationCoords, job.location)} style={{
                                  background: '#e8f5e9', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34c759'
                                }}>
                                  <Navigation size={18} />
                                </button>
                              )}
                              {/* Chat Button */}
                              <button onClick={() => setActiveChatId(job.id)} style={{
                                border: activeChatId === job.id ? '2px solid #007AFF' : 'none',
                                background: '#f2f2f7', borderRadius: '50%', width: '38px', height: '38px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF'
                              }}>
                                <MessageCircle size={18} />
                                {activeChatId !== job.id && (
                                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ff3b30', borderRadius: '50%', border: '2px solid white' }}></div>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {job.type === 'colis' ? (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
                                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#007AFF' }}></div>
                                 <div style={{ width: '1px', height: '20px', background: '#d2d2d7' }}></div>
                                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759' }}></div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>{job.pickupLocation}</div>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{job.location}</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#007AFF', fontWeight: '600', marginBottom: '16px'}}>
                                <MapPin size={16} /> {job.location}
                              </div>
                              
                              <div style={{ background: '#f5f5f7', borderRadius: '16px', padding: '16px', marginBottom: '8px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <ShoppingBag size={12} /> Liste de courses ({job.items?.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {job.items?.map((item: any, idx: number) => (
                                    <div key={idx} style={{ fontSize: '14px', fontWeight: '500', color: '#1d1d1f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ width: '4px', height: '4px', background: '#d2d2d7', borderRadius: '50%' }}></div>
                                      {typeof item === 'string' ? item : item.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{fontSize: '24px', fontWeight: '800', marginLeft: '12px'}}>{job.reward}</div>
                      </div>

                      {job.status === 'taken' ? (
                        <div style={{background: '#f2f2f7', borderRadius: '16px', padding: '16px', textAlign: 'center'}}>
                           {job.type === 'colis' ? (
                             <button onClick={() => validateReceipt(job.id, job.reward)} style={{
                               width: '100%', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: '700',
                               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                             }}>
                               <Package size={20} /> Colis Récupéré
                             </button>
                           ) : (
                             !inputTicket[job.id] ? (
                               <div onClick={() => {
                                 const itemTotal = job.items?.reduce((acc: number, i: any) => acc + (typeof i === 'string' ? 3 : (i.price || 3)), 0) || 5;
                                 const variance = (Math.random() * 0.2) + 0.9;
                                 const realisticTotal = (itemTotal * variance).toFixed(2);
                                 setInputTicket({...inputTicket, [job.id]: realisticTotal});
                               }} style={{cursor: 'pointer'}}>
                                  <Camera size={32} style={{margin: '0 auto 8px auto', display: 'block'}} color="#86868b" />
                                  <div style={{fontSize: '14px', fontWeight: '600', color: '#1d1d1f'}}>Scanner le ticket</div>
                               </div>
                             ) : (
                               <>
                                 <div style={{fontSize: '28px', fontWeight: '800', color: '#007AFF', marginBottom: '12px'}}>{inputTicket[job.id]} €</div>
                                 <button onClick={() => validateReceipt(job.id, job.reward)} style={{
                                   width: '100%', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '600'
                                 }}>Valider le prix</button>
                               </>
                             )
                           )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ background: job.paymentMethod === 'cash' ? '#fff9eb' : '#f2f2f7', borderRadius: '16px', padding: '16px', border: job.paymentMethod === 'cash' ? '1px solid #ffeeba' : 'none' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                               <div style={{ fontSize: '13px', fontWeight: '600', color: job.paymentMethod === 'cash' ? '#b8860b' : '#86868b' }}>
                                 {job.paymentMethod === 'cash' ? 'À ENCAISSER (ESPÈCES)' : 'Total Client (Payé par Carte)'}
                               </div>
                               {job.paymentMethod === 'cash' && <Wallet size={16} color="#b8860b" />}
                             </div>
                             <div style={{ fontSize: '24px', fontWeight: '800', color: job.paymentMethod === 'cash' ? '#b8860b' : '#1d1d1f' }}>{job.totalToCollect}€</div>
                          </div>
                          
                          {/* Photo Proof Section */}
                          <ProofOfDelivery
                            jobId={job.id}
                            onPhotoUploaded={(url) => setPhotoProof({...photoProof, [job.id]: true})}
                          />

                          <button 
                            disabled={!photoProof[job.id]}
                            onClick={(e) => completeJob(job.id, e)} 
                            style={{
                              width: '100%', background: photoProof[job.id] ? '#34c759' : '#d2d2d7', 
                              color: 'white', border: 'none', borderRadius: '16px', padding: '16px', fontWeight: '700', fontSize: '16px',
                              transition: 'background 0.3s'
                          }}>
                            Confirmer la Livraison
                          </button>
                        </div>
                      )}
                   </div>
                ))}
              </div>
            )}

            {/* SECTION: FILTERS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{fontSize: '13px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '4px'}}>
                  Missions disponibles ({availableJobs.length})
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')} style={{
                    background: viewMode === 'map' ? '#007AFF' : 'white', color: viewMode === 'map' ? 'white' : '#007AFF',
                    border: 'none', borderRadius: '12px', padding: '8px 12px',
                    fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer'
                  }}>
                    {viewMode === 'map' ? <ShoppingBag size={14} /> : <Map size={14} />} {viewMode === 'map' ? 'Liste' : 'Carte'}
                  </button>
                  <button onClick={() => setShowFilters(!showFilters)} style={{
                    background: showFilters ? '#007AFF' : 'white', color: showFilters ? 'white' : '#007AFF',
                    border: 'none', borderRadius: '12px', padding: '8px 12px',
                    fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer'
                  }}>
                    <SlidersHorizontal size={14} /> Filtres
                  </button>
                </div>
              </div>

              {showFilters && (
                <div style={{ background: 'white', borderRadius: '20px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Type filter */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px' }}>Type</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([['all', 'Tout'], ['courses', 'Courses'], ['colis', 'Colis']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setFilterType(val)} style={{
                          flex: 1, padding: '10px', borderRadius: '12px',
                          border: filterType === val ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                          background: filterType === val ? '#EBF5FF' : 'white',
                          color: filterType === val ? '#007AFF' : '#1d1d1f',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {/* Payment filter */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px' }}>Paiement</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([['all', 'Tout'], ['card', 'Carte'], ['cash', 'Espèces']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setFilterPayment(val)} style={{
                          flex: 1, padding: '10px', borderRadius: '12px',
                          border: filterPayment === val ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                          background: filterPayment === val ? '#EBF5FF' : 'white',
                          color: filterPayment === val ? '#007AFF' : '#1d1d1f',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {/* Sort */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px' }}>Trier par</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([['recent', 'Récent'], ['reward', 'Récompense'], ['distance', 'Distance']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setSortBy(val)} disabled={val === 'distance' && !driverLocation} style={{
                          flex: 1, padding: '10px', borderRadius: '12px',
                          border: sortBy === val ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                          background: sortBy === val ? '#EBF5FF' : 'white',
                          color: sortBy === val ? '#007AFF' : (val === 'distance' && !driverLocation) ? '#d2d2d7' : '#1d1d1f',
                          fontSize: '13px', fontWeight: '600', cursor: (val === 'distance' && !driverLocation) ? 'default' : 'pointer'
                        }}>{label}</button>
                      ))}
                    </div>
                    {sortBy === 'distance' && !driverLocation && (
                      <div style={{ fontSize: '11px', color: '#FF9500', marginTop: '6px' }}>Activez la géolocalisation pour trier par distance</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: MISSIONS DISPONIBLES ET COMBOS */}
            {availableJobs.length > 0 && (
              <div>
                {viewMode === 'map' ? (
                  <div style={{ marginBottom: '24px' }} className="animate-enter">
                     <DriverMap jobs={availableJobs} driverPos={driverLocation} />
                  </div>
                ) : (
                  <>
                    {/* COMBOS (Smart Batching) */}
                {comboJobs.length > 0 && filterType === 'all' && sortBy === 'recent' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginLeft: '4px' }}>
                      <div style={{ background: '#FF3B30', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>NOUVEAU</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#1d1d1f', textTransform: 'uppercase' }}>
                        Combos Simultanés 🔥
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {comboJobs.map((combo, idx) => {
                         const rewardTotal = combo.reduce((acc: number, j: any) => acc + parseFloat(String(j.reward).replace('€', '').replace(',', '.')), 0).toFixed(2);
                         return (
                           <div key={`combo-${idx}`} style={{
                             background: 'linear-gradient(135deg, #1d1d1f 0%, #434343 100%)',
                             borderRadius: '24px', padding: '20px', color: 'white',
                             boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
                           }}>
                             <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '100px', opacity: 0.05, transform: 'rotate(15deg)' }}>🔥</div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                               <div>
                                 <div style={{ fontSize: '12px', color: '#a1a1a6', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Double Livraison (Quartier proche)</div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                   {combo.map((j: any, i: number) => (
                                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                                       <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{i + 1}</div>
                                       {j.location.split(',')[0]}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFD60A' }}>{rewardTotal}€</div>
                                 <div style={{ fontSize: '11px', color: '#a1a1a6', fontWeight: '600' }}>Gain optimisé</div>
                               </div>
                             </div>
                             
                             <button onClick={(e) => acceptCombo(combo, e)} style={{
                               width: '100%', background: 'white', color: '#1d1d1f', border: 'none', borderRadius: '14px', padding: '14px',
                               fontSize: '15px', fontWeight: '800', cursor: 'pointer', position: 'relative', zIndex: 1,
                               boxShadow: '0 4px 12px rgba(255,255,255,0.2)'
                             }}>
                               Accepter le Combo
                             </button>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}

                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {availableJobs.map((job) => (
                    <div key={job.id} style={{
                      background: 'white', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)'
                    }}>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{fontSize: '12px', color: '#86868b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                        {job.user}
                        {driverLocation && job.locationCoords && (
                          <span style={{ fontSize: '11px', color: '#007AFF', fontWeight: '600' }}>
                            {getDistanceKm(driverLocation.lat, driverLocation.lng, job.locationCoords.lat, job.locationCoords.lng).toFixed(1)} km
                          </span>
                        )}
                      </div>
                        {job.type === 'colis' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{job.pickupLocation}</span>
                            <ArrowRight size={12} color="#d2d2d7" />
                            <span style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{job.location}</span>
                          </div>
                        ) : (
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1d1d1f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} color="#007AFF" /> 
                            <span>{job.location ? job.location.split(',')[0] : 'Adresse inconnue'}</span>
                            <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '500' }}>({job.items?.length || 0} art.)</span>
                          </div>
                        )}
                      </div>
                      <div style={{textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{fontWeight: '700', color: '#34c759', fontSize: '15px'}}>{job.reward}</div>
                          <div style={{fontSize: '10px', fontWeight: '700', color: job.paymentMethod === 'cash' ? '#FF9500' : '#007AFF', textTransform: 'uppercase'}}>
                            {job.paymentMethod === 'cash' ? 'Espèces' : 'Carte'}
                          </div>
                        </div>
                        <button onClick={(e) => acceptJob(job.id, e)} style={{
                          background: '#1d1d1f', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: '600'
                        }}>Prendre</button>
                      </div>
                    </div>
                  ))}
                </div>
                </>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {activeChatId && (
        <JobChat jobId={activeChatId} role="driver" onClose={() => setActiveChatId(null)} />
      )}

      {user?.uid && !loadingDriverProfile && !driverProfile?.displayName && (
        <DriverOnboarding
          uid={user.uid}
          initialProfile={driverProfile}
          onComplete={(profile) => setDriverProfile(profile)}
        />
      )}
    </div>
    </RequireAuth>
  );
}
