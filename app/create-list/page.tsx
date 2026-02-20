
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, ShoppingBag, CreditCard, Smartphone, ShieldCheck, Search, Package, ShoppingCart, ArrowRight, HeartPulse, TrendingUp, RefreshCw, Wallet, Mic } from 'lucide-react';
import { PRICE_DB } from '../lib/db';
import StripePayment from '../components/StripePayment';
import { createJob } from '../lib/firebaseService';

export default function CreateListing() {
  const router = useRouter();
  
  const [stage, setStage] = useState(1);
  const [items, setItems] = useState<{name: string, price: number}[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [isTypingPickup, setIsTypingPickup] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [tip, setTip] = useState(0);
  const [dist, setDist] = useState(0);

  const isColis = items[0]?.name === 'Colis Personnalisé';

  const [submitting, setSubmitting] = useState(false);
  const [budget, setBudget] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  // STRIPE REDIRECT RECOVERY (3D SECURE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentIntent = params.get('payment_intent');
      const redirectStatus = params.get('redirect_status');
      
      if (paymentIntent && redirectStatus === 'succeeded' && !submitting) {
        setSubmitting(true);
        const savedPayload = localStorage.getItem('hopla_pending_job');
        if (savedPayload) {
          try {
            const payload = JSON.parse(savedPayload);
            fetch('/api/jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).then(r => r.json()).then(newJob => {
              if (newJob?.id) {
                localStorage.removeItem('hopla_pending_job');
                window.location.href = `/tracking/${newJob.id}`;
              } else {
                setSubmitting(false); // allow retry
              }
            }).catch(e => {
              console.error(e);
              setSubmitting(false);
            });
          } catch(e) {
            console.error(e);
            setSubmitting(false);
          }
        }
      }
    }
  }, []);

  const fetchAddresses = async (text: string, isPickup = false) => {
    if (isPickup) {
      setPickupLocation(text);
      if (text.length < 3) return setPickupSuggestions([]);
    } else {
      setLocation(text);
      if (text.length < 3) return setLocationSuggestions([]);
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        if (isPickup) setPickupSuggestions(data || []);
        else setLocationSuggestions(data || []);
      }
    } catch(e) {
      console.warn('Geocoding fail on type', e);
    }
  };

  // Auto-locate on mount (with Safari safety)
  useEffect(() => {
    if (!location && !isColis) {
      // Small delay for Safari to be ready
      setTimeout(() => handleGeo('delivery'), 500);
    }
  }, []);

  // Simulate distance when moving forward (handles stage skips)
  useEffect(() => {
    if (stage >= 2 && dist === 0) {
      // Realistic Strasbourg journey:
      // 1. Driver -> Store (approx 0.8 - 2.5km)
      // 2. Store -> Client (approx 1.5 - 4.5km)
      const toStore = Math.random() * (2.5 - 0.8) + 0.8;
      const toClient = Math.random() * (4.5 - 1.5) + 1.5;
      setDist(parseFloat((toStore + toClient).toFixed(1)));
    }
  }, [stage]); // Removed 'dist' from dependencies to prevent infinite loop

  const deliveryFee = useMemo(() => {
    const base = 2.50; // Plus bas pour le "last-mile"
    const distRate = 0.90; // Récompensé au KM
    const itemRate = 0.15; // Volume
    const complexity = isColis ? 3.00 : 0;
    
    // Minimum delivery fee of 4€
    return Math.max(4.0, parseFloat((base + (dist * distRate) + (items.length * itemRate) + complexity).toFixed(2)));
  }, [dist, items.length, isColis]);

  const totalReward = (deliveryFee + tip).toFixed(2) + '€';

  // Suggestions Logic with improved matching
  const suggestions = useMemo(() => {
    if (!inputVal.trim() || inputVal.length < 1) return [];
    
    const searchTerms = inputVal.toLowerCase().split(' ');
    
    return Object.keys(PRICE_DB)
      .filter(k => {
        const key = k.toLowerCase();
        return searchTerms.every(term => key.includes(term));
      })
      .slice(0, 10); // Show more suggestions
  }, [inputVal]);

  const trendingItems = useMemo(() => {
    const pool = [
      'Doliprane 1000mg tab', 'Lait Demi-ecreme', 'Oeufs x12', 'Bananes 1kg', 
      'Jambon blanc x4 (Lidl)', 'Papier toilette Lotus x12', 'Baguette', 
      'Eau Cristalline 6x1.5L', 'Beurre Lidl', 'Pates Penne 500g', 
      'Coca-Cola 1.5L', 'Chips Lidl', 'Yaourt nature x4', 'Camembert Lidl'
    ];
    return pool.filter(item => {
      // Don't show if already in the list
      return !items.some(i => i.name.toLowerCase() === item.toLowerCase());
    }).slice(0, 6); // Always show 6 suggestions
  }, [items]);

  const estimatePrice = (name: string) => {
    const key = name.toLowerCase().trim();
    // 1. Try exact match
    if (PRICE_DB[key]) return PRICE_DB[key];
    
    // 2. Try to find if user input contains a DB key (e.g. "Pack de lait" contains "lait")
    // or if a DB key starts with user input
    const match = Object.keys(PRICE_DB).find(k => key.includes(k) || k.startsWith(key));
    return match ? PRICE_DB[match] : 0; 
  };

  const addItem = (e?: any, nameOverride?: string) => {
    e?.preventDefault();
    const nameToAdd = nameOverride || inputVal;
    if (nameToAdd.trim()) {
      const price = estimatePrice(nameToAdd);
      setItems([...items, { name: nameToAdd, price: price || 3 }]); // Default to 3€ if not in DB
      setInputVal('');
      setShowSuggestions(false);
    }
  };

  const estimatedTotal = items.reduce((acc, item) => acc + (item.price || 3), 0);

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputVal(transcript);
      setShowSuggestions(true);
      // Wait for user to confirm or we could auto-add
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleGeo = (target: 'pickup' | 'delivery', retry = true) => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    // Check if we are on a secure context (Safari block geo on non-HTTPS)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn("Geolocation requires HTTPS on real devices.");
    }

    if (target === 'pickup') setPickupLocation("Localisation...");
    else setLocation("Localisation...");

    const options = {
      enableHighAccuracy: retry, // First attempt with GPS, second without if retry is true
      timeout: 8000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: { 
              'Accept-Language': 'fr',
              // Note: Browser normally doesn't let you set User-Agent, but we'll ensure headers are clean
            }
          }).catch(err => {
            console.warn("Retrying geocoding in 1s due to network error...");
            return null;
          });

          if (!response || !response.ok) {
            // Fallback: If Nominatim fails, we just don't set the address string but keep the coordinates
            if (target === 'pickup') setPickupLocation("Adresse trouvée par GPS");
            else setLocation("Ma position (GPS)");
            return;
          }
          const data = await response.json();
          
          if (data && data.address) {
            const a = data.address;
            const house = a.house_number ? a.house_number + ' ' : '';
            const road = a.road || a.pedestrian || a.suburb || 'Strasbourg';
            const suburb = a.suburb || a.city_district || a.city || '';
            const fullAddr = `${house}${road}, ${suburb}`.trim();
            
            if (target === 'pickup') {
              setPickupLocation(fullAddr);
              setPickupCoords({ lat: latitude, lng: longitude });
            } else {
              setLocation(fullAddr);
              setLocationCoords({ lat: latitude, lng: longitude });
            }
          }
        } catch (e) {
          console.error("Geo API error:", e);
        }
      },
      (err) => {
        if (retry && err.code !== err.PERMISSION_DENIED) {
          // Fallback: retry without high accuracy (better for indoors/weak signals)
          handleGeo(target, false);
        } else {
          if (err.code === err.PERMISSION_DENIED) {
            alert("Veuillez autoriser l'accès à votre position dans les réglages de votre iPhone.");
          }
          if (target === 'pickup') setPickupLocation("");
          else setLocation("");
        }
      },
      options
    );
  };

  const handlePost = async () => {
    console.log("🔴 [handlePost] INITIATED", { submitting, items, location, paymentMethod });
    
    // Fallback: If it's maliciously stuck, we force it to proceed for this debug
    setSubmitting(true);

    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === '') {
      alert("Erreur Fatale Vercel: Les clés Firebase (NEXT_PUBLIC_FIREBASE_...) sont absentes ! Le site ne peut donc pas se connecter à la base de données. Allez dans les réglages de Vercel et ajoutez vos variables d'environnement.");
      setSubmitting(false);
      return;
    }

    let finalLocationCoords = locationCoords;
    let finalPickupCoords = pickupCoords;

    // FORWARD GEOCODING FALLBACK
    try {
      if (!finalLocationCoords && location) {
        const query = encodeURIComponent(location + ', Strasbourg');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        if (res.ok) {
           const data = await res.json();
           if (data && data[0]) finalLocationCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
      if (isColis && !finalPickupCoords && pickupLocation) {
        const query = encodeURIComponent(pickupLocation + ', Strasbourg');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        if (res.ok) {
           const data = await res.json();
           if (data && data[0]) finalPickupCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      console.warn("Geocoding failed, using fallback", e);
    }

    // Default to Strasbourg Center if still nothing
    if (!finalLocationCoords) finalLocationCoords = { lat: 48.5734, lng: 7.7521 };

    try {
      // Calculate Total Amount Safe and Simple
      const itemsTotal = items.reduce((acc, item) => {
        const p = parseFloat(String(item.price)) || 3;
        return acc + p;
      }, 0);
      const serviceFee = isColis ? 0 : itemsTotal * 0.10;
      const deliveryFeeNum = parseFloat(String(deliveryFee)) || 0;
      const tipNum = parseFloat(String(tip)) || 0;
      const totalAmt = parseFloat((itemsTotal + serviceFee + deliveryFeeNum + tipNum).toFixed(2));
      const rewardStr = `${(deliveryFeeNum + tipNum).toFixed(2)}€`;

      const payload = {
        type: isColis ? 'colis' : 'courses',
        items,
        location,
        locationCoords: finalLocationCoords,
        pickupLocation: isColis ? pickupLocation : null,
        pickupCoords: isColis ? finalPickupCoords : null,
        reward: rewardStr,
        deliveryFee: deliveryFeeNum,
        tip: tipNum,
        paymentMethod,
        isPaid: paymentMethod === 'card',
        totalAmount: totalAmt, 
        user: `Client #${Math.floor(Math.random() * 1000)}`
      };

    // Save for Stripe 3D Secure redirect recovery (very important on mobile/Vercel)
    if (typeof window !== 'undefined' && paymentMethod === 'card') {
      localStorage.setItem('hopla_pending_job', JSON.stringify(payload));
    }

    // Proceed With Payload natively across Firebase Web SDK (fixes Vercel function timeout)
    const newJob = await createJob(payload);
    
    if (!newJob || !newJob.id) throw new Error("Erreur de création du job");

      // Save last order ID to local storage for recovery
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderId', newJob.id);
        localStorage.removeItem('hopla_pending_job'); // We successfully returned without redirect loop
      }

      // Send confirmation email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alkhastvatsaev@gmail.com', // Using user provided email for now
            trackingId: newJob.id,
            deliveryFee: deliveryFee,
            total: rewardStr,
            items: items
          })
        });
      } catch (emailErr) {
        console.warn("Email failed but order created", emailErr);
      }

      router.push(`/tracking/${newJob.id}`); 
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', 
      background: '#f5f5f7',
      color: '#1d1d1f',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      padding: '20px'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => stage > 1 ? setStage(stage - 1) : router.back()} style={{
          background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
           <ArrowLeft size={20} color="#1d1d1f" />
        </button>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              width: stage === s ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: stage === s ? '#1d1d1f' : '#d2d2d7',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* Top-right Location Badge - Prominent and verifiable */}
        <div 
          onClick={() => handleGeo('delivery')}
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '6px 6px 6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid ' + (location === 'Localisation en cours...' ? '#007AFF' : '#f2f2f7'),
            cursor: 'pointer',
            maxWidth: '180px',
            animation: location === 'Localisation en cours...' ? 'pulse 2s infinite' : 'none'
          }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: '#86868b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Livrer à
            </div>
            <div style={{ 
              fontSize: '13px', fontWeight: '700', color: location === 'Localisation en cours...' ? '#007AFF' : '#1d1d1f',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
            }}>
              {location || 'Ma position...'}
            </div>
          </div>
          <div style={{ 
            width: '32px', height: '32px', background: '#eef2ff', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={16} color="#007AFF" />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '0 auto', width: '100%' }} className="animate-enter">
        
        {stage === 1 && (
          <>
            <h1 style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              {isColis ? 'Envoyer' : 'Commander'}
            </h1>
            <p style={{ color: '#86868b', fontSize: '17px', marginBottom: '32px' }}>
              {isColis ? 'Décrivez votre colis' : 'Ajoutez vos articles'}
            </p>

            <div style={{
              background: '#e3e3e8', padding: '3px', borderRadius: '12px', display: 'flex', marginBottom: '24px'
            }}>
              <button 
                onClick={() => setItems([])}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600',
                  background: !isColis ? 'white' : 'transparent',
                  boxShadow: !isColis ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  color: !isColis ? '#1d1d1f' : '#8e8e93',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <ShoppingCart size={14} /> Courses
              </button>
              <button 
                onClick={() => setItems([{name: 'Colis Personnalisé', price: 0}])}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600',
                  background: isColis ? 'white' : 'transparent',
                  boxShadow: isColis ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  color: isColis ? '#1d1d1f' : '#8e8e93',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Package size={14} /> Colis
              </button>
            </div>

            {!isColis ? (
              <>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{
                    background: 'white', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}>
                    <Search size={20} color="#86868b" />
                    <form onSubmit={addItem} style={{ flex: 1 }}>
                      <input 
                        value={inputVal}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          setInputVal(e.target.value);
                          setShowSuggestions(true);
                        }}
                        placeholder="Lait, Pain, Fraises..."
                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '17px' }}
                      />
                    </form>
                    <button 
                      type="button"
                      onClick={startListening}
                      style={{ 
                        background: isListening ? '#ffebee' : '#f2f2f7', 
                        border: 'none', borderRadius: '12px', padding: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isListening ? '#ff3b30' : '#007AFF', cursor: 'pointer',
                        animation: isListening ? 'pulse 1.5s infinite' : 'none'
                      }}
                    >
                      <Mic size={18} />
                    </button>
                  </div>
                  
                  {/* Real-time Suggestions Dropdown */}
                  {showSuggestions && inputVal.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', 
                      borderRadius: '16px', marginTop: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      zIndex: 50, overflowY: 'auto', maxHeight: '350px', border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f5f5f7' }}>
                        Bibliothèque d'articles
                      </div>
                      {suggestions.map((s) => {
                        const isPharma = [
                          'doliprane', 'ibuprofène', 'pansem', 'gel hydro', 'masque', 'vitam', 'magnés', 
                          'sirop', 'pastil', 'thermom', 'serum', 'efferalgan', 'advil', 'nurofen', 'spasfon', 
                          'gaviscon', 'smecta', 'biseptine', 'berocca', 'brosse a dents', 'dentifrice', 
                          'posay', 'avene', 'eucerin', 'dexeryl', 'biafine', 'preservatif', 'grossesse', 
                          'biberon', 'liniment', 'couche pampers'
                        ].some(p => s.toLowerCase().includes(p));
                        return (
                          <button 
                            key={s}
                            onClick={() => addItem(null, s)}
                            style={{
                              width: '100%', padding: '16px', border: 'none', background: 'transparent',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontSize: '16px', fontWeight: '500', color: '#1d1d1f', borderBottom: '1px solid #f2f2f7',
                              textAlign: 'left', cursor: 'pointer'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {isPharma ? <HeartPulse size={16} color="#ff3b30" /> : <ShoppingBag size={16} color="#007AFF" />}
                              <span style={{ textTransform: 'capitalize' }}>{s}</span>
                            </div>
                            <span style={{ color: '#007AFF', fontWeight: '700' }}>{PRICE_DB[s].toFixed(2)}€</span>
                          </button>
                        );
                      })}
                      {suggestions.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#86868b', fontSize: '14px' }}>
                          Aucun article trouvé dans la bibliothèque.<br/>Appuyez sur 'Entrée' pour l'ajouter manuellement.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: inputVal.length === 0 ? '32px' : '10px' }}>
                  {items.map((it, i) => (
                    <div key={i} onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{
                      background: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: '500',
                      border: '1px solid #e3e3e8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                      <span style={{ textTransform: 'capitalize' }}>{it.name}</span>
                      <span style={{ color: '#86868b', fontSize: '18px' }}>×</span>
                    </div>
                  ))}
                </div>

                {/* Trending Suggestions - Only visible when not searching */}
                {inputVal.length === 0 && (
                  <div className="animate-enter" style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} /> Articles populaires
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {trendingItems.map((item) => (
                        <button
                          key={item}
                          onClick={() => addItem(null, item)}
                          style={{
                            background: 'white', border: '1px solid #f2f2f7', borderRadius: '16px', padding: '14px',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
                            textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>{item}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#007AFF' }}>{PRICE_DB[item.toLowerCase()]?.toFixed(2) || '3.00'}€</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                  <Package size={40} color="#007AFF" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Livraison Directe</h2>
                <p style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.4' }}>
                  Faites livrer n'importe quel objet <br/> (clés, sac, chargeur...) à Strasbourg.
                </p>
              </div>
            )}
          </>
        )}

        {stage === 2 && (
          <>
            <h1 style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              {isColis ? 'Adresses' : 'Destination'}
            </h1>
            <p style={{ color: '#86868b', fontSize: '17px', marginBottom: '32px' }}>
              {isColis ? 'Où doit-on passer et livrer ?' : 'Où devons-nous livrer ?'}
            </p>

            {isColis && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Point de retrait</label>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <input 
                    value={pickupLocation}
                    onChange={(e) => {
                      fetchAddresses(e.target.value, true);
                      setIsTypingPickup(true);
                    }}
                    onFocus={() => setIsTypingPickup(true)}
                    placeholder="Adresse de départ..."
                    style={{
                      width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: 'white',
                      fontSize: '17px', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                  />
                  <button onClick={() => handleGeo('pickup')} style={{ position: 'absolute', right: '12px', top: '12px', background: '#f2f2f7', border: 'none', borderRadius: '12px', padding: '8px' }}>
                    <MapPin size={18} color="#007AFF" />
                  </button>
                  {isTypingPickup && pickupSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 50, borderRadius: '16px', marginTop: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                      {pickupSuggestions.map((s, i) => (
                        <div key={i} onClick={() => {
                          const a = s.address || {};
                          const house = a.house_number ? a.house_number + ' ' : '';
                          const road = a.road || a.pedestrian || a.suburb || s.name || '';
                          const suburb = a.suburb || a.city_district || a.city || '';
                          const finalString = `${house}${road}, ${suburb}`.trim();
                          setPickupLocation(finalString.replace(/^,\s*/, ''));
                          setPickupCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                          setPickupSuggestions([]);
                          setIsTypingPickup(false);
                        }} style={{ padding: '16px', borderBottom: '1px solid #f2f2f7', cursor: 'pointer', fontSize: '15px', color:'#1d1d1f' }}>
                          {s.display_name.split(',').slice(0, 3).join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px', display: isColis ? 'block' : 'none' }}>Point de livraison</label>
              <div style={{ position: 'relative', zIndex: 5 }}>
                <input 
                  value={location}
                  onChange={(e) => {
                    fetchAddresses(e.target.value, false);
                    setIsTypingLocation(true);
                  }}
                  onFocus={() => setIsTypingLocation(true)}
                  placeholder={isColis ? "Adresse d'arrivée..." : "Saisir votre adresse..."}
                  style={{
                    width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: 'white',
                    fontSize: '17px', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                />
                <button onClick={() => handleGeo('delivery')} style={{ position: 'absolute', right: '12px', top: '12px', background: '#f2f2f7', border: 'none', borderRadius: '12px', padding: '8px' }}>
                  <MapPin size={18} color="#007AFF" />
                </button>
                {isTypingLocation && locationSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 50, borderRadius: '16px', marginTop: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {locationSuggestions.map((s, i) => (
                      <div key={i} onClick={() => {
                        const a = s.address || {};
                        const house = a.house_number ? a.house_number + ' ' : '';
                        const road = a.road || a.pedestrian || a.suburb || s.name || '';
                        const suburb = a.suburb || a.city_district || a.city || '';
                        const finalString = `${house}${road}, ${suburb}`.trim();
                        setLocation(finalString.replace(/^,\s*/, ''));
                        setLocationCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                        setLocationSuggestions([]);
                        setIsTypingLocation(false);
                      }} style={{ padding: '16px', borderBottom: '1px solid #f2f2f7', cursor: 'pointer', fontSize: '15px', color:'#1d1d1f' }}>
                        {s.display_name.split(',').slice(0, 3).join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!isColis && (
               <button onClick={() => handleGeo('delivery')} style={{
                background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                width: '100%', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginTop: '16px'
              }}>
                <div style={{ width: '44px', height: '44px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} color="#4f46e5" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>Position actuelle</div>
                  <div style={{ fontSize: '13px', color: '#86868b' }}>Géolocalisation automatique</div>
                </div>
              </button>
            )}
          </>
        )}

        {stage === 3 && (
          <>
            {/* NEW CLIENT-CENTRIC SUMMARY */}
            <div style={{ 
              background: 'white', borderRadius: '24px', padding: '24px', 
              marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              maxWidth: '600px', margin: '0 auto 24px auto', width: '100%'
            }}>
              
              {/* HEADER: TRAJET & TEMPS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#eef2ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Smartphone size={24} color="#007AFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '600' }}>Estimation</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d1d1f' }}>
                        {dist === 0 ? '25 - 40' : Math.ceil(15 + (dist * 4))} - {dist === 0 ? '40' : Math.ceil(30 + (dist * 4))} min
                      </div>
                    </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '600' }}>Distance</div>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>{dist} km</div>
                 </div>
              </div>

              {/* TRAJET VISUAL */}
              <div style={{ position: 'relative', paddingLeft: '20px', marginBottom: '24px' }}>
                 <div style={{ position: 'absolute', left: '0', top: '4px', bottom: '4px', width: '2px', background: '#e5e5ea' }}></div>
                 
                 <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-24px', top: '2px', width: '10px', height: '10px', background: '#007AFF', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#86868b', marginBottom: '2px' }}>DEPUIS</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f' }}>
                      {isColis ? pickupLocation.split(',')[0] : 'Magasin / Supermarché'}
                    </div>
                 </div>

                 <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-24px', top: '2px', width: '10px', height: '10px', background: '#34c759', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#86868b', marginBottom: '2px' }}>VERS</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f' }}>
                      {location.split(',')[0]}
                    </div>
                 </div>
              </div>

              {/* DETAILS COMMANDE - Transparent Breakdown */}
              <div style={{ background: '#f5f5f7', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#86868b' }}>Articles ({items.length})</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{estimatedTotal.toFixed(2)}€</span>
                 </div>
                 {!isColis && (
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#86868b' }}>Service (Commission 10%)</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{(estimatedTotal * 0.10).toFixed(2)}€</span>
                   </div>
                 )}
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#86868b' }}>Livraison Rapide</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{deliveryFee.toFixed(2)}€</span>
                 </div>
                 {tip > 0 && (
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#86868b' }}>Pourboire Livreur</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{tip.toFixed(2)}€</span>
                   </div>
                 )}
                 <div style={{ height: '1px', background: '#e5e5ea', margin: '4px 0' }}></div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>Total à payer</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#007AFF' }}>
                      {(estimatedTotal * (isColis ? 1 : 1.10) + deliveryFee + tip).toFixed(2)}€
                    </span>
                 </div>
              </div>



              {/* PAYMENT TOGGLE */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', marginTop: '24px' }}>
                 <button 
                   onClick={() => setPaymentMethod('card')} 
                   style={{
                     flex: 1, height: '48px', borderRadius: '12px', border: '1.5px solid',
                     borderColor: paymentMethod === 'card' ? '#007AFF' : '#f2f2f7',
                     background: paymentMethod === 'card' ? '#f5faff' : '#fafafa',
                     color: paymentMethod === 'card' ? '#007AFF' : '#8e8e93',
                     fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                     transition: 'all 0.2s', cursor: 'pointer', outline: 'none'
                   }}
                 >
                   <CreditCard size={18} /> Carte Web
                 </button>
                 <button 
                   onClick={() => setPaymentMethod('cash')} 
                   style={{
                     flex: 1, height: '48px', borderRadius: '12px', border: '1.5px solid',
                     borderColor: paymentMethod === 'cash' ? '#34c759' : '#f2f2f7',
                     background: paymentMethod === 'cash' ? '#f2fcf5' : '#fafafa',
                     color: paymentMethod === 'cash' ? '#34c759' : '#8e8e93',
                     fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                     transition: 'all 0.2s', cursor: 'pointer', outline: 'none'
                   }}
                 >
                   <Wallet size={18} /> Espèces
                 </button>
              </div>

              <div>
                {paymentMethod === 'card' ? (
                  <StripePayment 
                    amount={parseFloat((estimatedTotal * (isColis ? 1 : 1.10) + deliveryFee + tip).toFixed(2))}
                    onSuccess={() => handlePost()}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handlePost()}
                    style={{
                    width: '100%', background: '#34c759', color: 'white', border: 'none', borderRadius: '16px', padding: '18px',
                    fontSize: '17px', fontWeight: '700', boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}>
                    Payer {(estimatedTotal * (isColis ? 1 : 1.10) + deliveryFee + tip).toFixed(2)}€ à la livraison
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {stage < 3 && (
        <div className="mobile-fixed-footer">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button 
              disabled={stage === 1 && items.length === 0 || stage === 2 && (!location || (isColis && !pickupLocation))}
              onClick={() => {
                if (stage === 1) {
                  if (location && !isColis) setStage(3);
                  else setStage(2);
                } else {
                  setStage(3);
                }
              }}
              style={{
                width: '100%', background: (stage === 1 && items.length === 0 || stage === 2 && (!location || (isColis && !pickupLocation))) ? '#d2d2d7' : '#007AFF',
                color: 'white', border: 'none', borderRadius: '16px', padding: '18px',
                fontSize: '17px', fontWeight: '700', transition: 'all 0.3s',
                boxShadow: (stage === 1 && items.length === 0 || stage === 2 && (!location || (isColis && !pickupLocation))) ? 'none' : '0 10px 20px rgba(0, 122, 255, 0.2)',
                cursor: 'pointer'
              }}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay Removed */}

      <div style={{ textAlign: 'center', fontSize: '10px', color: '#ccc', padding: '10px' }}>v2.0 DEBUG MODE</div>

    </div>
  );
}
