'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Camera, Check } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface DriverProfile {
  displayName: string;
  photoURL?: string | null;
}

interface DriverOnboardingProps {
  uid: string;
  initialProfile?: DriverProfile | null;
  onComplete: (profile: DriverProfile) => void;
}

export default function DriverOnboarding({ uid, initialProfile, onComplete }: DriverOnboardingProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(initialProfile?.photoURL || null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(initialProfile?.displayName || '');
    setPhotoURL(initialProfile?.photoURL || null);
  }, [initialProfile]);

  const pickPhoto = () => fileRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    const name = displayName.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      let finalPhotoURL: string | null = photoURL;

      const file = fileRef.current?.files?.[0];
      if (file) {
        const storageRef = ref(storage, `driver-avatars/${uid}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, file);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await setDoc(
        doc(db, 'users', uid),
        {
          role: 'driver',
          displayName: name,
          photoURL: finalPhotoURL || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      onComplete({ displayName: name, photoURL: finalPhotoURL || null });
    } catch (e) {
      console.error('Driver onboarding save failed', e);
      alert('Erreur lors de la sauvegarde du profil livreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(10px)',
      zIndex: 20000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'white',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        padding: '28px 20px 26px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🚚</div>
          <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.3px' }}>Profil Livreur</div>
          <div style={{ color: '#86868b', fontSize: '13px', marginTop: '6px' }}>
            Pour accepter des missions, indique ton nom (et une photo si tu veux).
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onFile}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '22px',
            background: '#F2F2F7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid #E5E5EA',
            flexShrink: 0
          }}>
            {preview || photoURL ? (
              <img src={preview || photoURL || ''} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={28} color="#86868b" />
            )}
          </div>

          <button
            onClick={pickPhoto}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '16px',
              border: '1.5px solid #E5E5EA',
              background: '#F9F9FB',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Camera size={18} />
            Ajouter une photo
          </button>
        </div>

        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ton prénom / pseudo"
          style={{
            width: '100%',
            padding: '14px 14px',
            borderRadius: '16px',
            border: '1.5px solid #E5E5EA',
            background: '#F9F9FB',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '16px'
          }}
        />

        <button
          onClick={save}
          disabled={submitting || !displayName.trim()}
          style={{
            width: '100%',
            height: '54px',
            borderRadius: '18px',
            border: 'none',
            background: '#34C759',
            color: 'white',
            fontSize: '16px',
            fontWeight: '900',
            boxShadow: '0 10px 20px rgba(52,199,89,0.25)',
            opacity: submitting ? 0.7 : 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Check size={18} />
          {submitting ? 'Sauvegarde...' : 'Continuer'}
        </button>
      </div>
    </div>
  );
}
