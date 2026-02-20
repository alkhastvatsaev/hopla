
'use client';

import { useState, useRef } from 'react';
import { Camera, Check, Upload } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProofOfDeliveryProps {
  jobId: string;
  onPhotoUploaded: (url: string) => void;
}

export default function ProofOfDelivery({ jobId, onPhotoUploaded }: ProofOfDeliveryProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!preview || !fileRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const file = fileRef.current.files[0];
      const storageRef = ref(storage, `delivery-proofs/${jobId}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, deliveryProofUrl: url }),
      });

      setUploaded(true);
      onPhotoUploaded(url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div style={{
        background: '#e4f9e9', border: '1px solid #34c759', borderRadius: '16px', padding: '14px',
        display: 'flex', alignItems: 'center', gap: '10px', color: '#34c759', fontWeight: '600', fontSize: '14px'
      }}>
        <div style={{ width: '28px', height: '28px', background: '#34c759', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={16} color="white" strokeWidth={3} />
        </div>
        Preuve de livraison envoyée
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #007AFF' }}>
          <img src={preview} alt="Proof" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'white' }}>
            <button
              onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1.5px solid #E5E5EA', background: 'white',
                fontSize: '14px', fontWeight: '600', color: '#86868b', cursor: 'pointer'
              }}
            >
              Reprendre
            </button>
            <button
              onClick={uploadPhoto}
              disabled={uploading}
              style={{
                flex: 2, padding: '12px', borderRadius: '12px',
                border: 'none', background: '#007AFF',
                fontSize: '14px', fontWeight: '700', color: 'white', cursor: 'pointer',
                opacity: uploading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Upload size={16} />
              {uploading ? 'Envoi...' : 'Confirmer'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed #d2d2d7', borderRadius: '16px', padding: '24px',
            textAlign: 'center', cursor: 'pointer', color: '#86868b',
            fontSize: '14px', background: '#f9f9f9', transition: 'all 0.2s'
          }}
        >
          <Camera size={28} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
          <div style={{ fontWeight: '600', color: '#1d1d1f' }}>Prendre une photo</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Preuve de dépôt pour le client</div>
        </div>
      )}
    </div>
  );
}
