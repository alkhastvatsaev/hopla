
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface DeliveryRatingProps {
  jobId: string;
  role: 'client' | 'driver';
  onComplete: () => void;
}

const CLIENT_TAGS = ['Rapide', 'Poli', 'Soigneux', 'Communique bien', 'Recommandé'];
const DRIVER_TAGS = ['Facile à trouver', 'Sympathique', 'Généreux', 'Clair'];

export default function DeliveryRating({ jobId, role, onComplete }: DeliveryRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tags = role === 'client' ? CLIENT_TAGS : DRIVER_TAGS;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const submitRating = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'ratings'), {
        jobId,
        raterRole: role,
        rating,
        tags: selectedTags,
        comment: comment.trim() || null,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(onComplete, 1200);
    } catch (err) {
      console.error('Rating submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
        <div style={{ fontWeight: '700', fontSize: '18px' }}>Merci pour votre évaluation !</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px' }}>
          {role === 'client' ? 'Comment était votre livreur ?' : 'Comment était votre client ?'}
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', transition: 'transform 0.15s',
                transform: (hoveredStar >= star || rating >= star) ? 'scale(1.15)' : 'scale(1)'
              }}
            >
              <Star
                size={36}
                color="#FF9500"
                fill={(hoveredStar >= star || rating >= star) ? '#FF9500' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: '#86868b', height: '18px' }}>
          {rating === 1 && 'Décevant'}
          {rating === 2 && 'Moyen'}
          {rating === 3 && 'Correct'}
          {rating === 4 && 'Très bien'}
          {rating === 5 && 'Excellent !'}
        </div>
      </div>

      {/* Tags */}
      {rating > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#86868b', marginBottom: '10px' }}>
            Qu&apos;est-ce qui vous a plu ?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: selectedTags.includes(tag) ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                  background: selectedTags.includes(tag) ? '#EBF5FF' : 'white',
                  color: selectedTags.includes(tag) ? '#007AFF' : '#1d1d1f',
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment */}
      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Un commentaire ? (optionnel)"
          rows={2}
          style={{
            width: '100%', padding: '12px 14px',
            borderRadius: '14px', border: '1.5px solid #E5E5EA',
            fontSize: '14px', resize: 'none', outline: 'none',
            fontFamily: 'inherit', marginBottom: '16px',
            background: '#F9F9FB', boxSizing: 'border-box'
          }}
        />
      )}

      {/* Submit */}
      <button
        onClick={submitRating}
        disabled={rating === 0 || submitting}
        style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', border: 'none',
          background: rating > 0 ? '#007AFF' : '#E5E5EA',
          color: rating > 0 ? 'white' : '#86868b',
          fontSize: '15px', fontWeight: '700',
          cursor: rating > 0 ? 'pointer' : 'default',
          opacity: submitting ? 0.7 : 1,
          transition: 'all 0.2s'
        }}
      >
        {submitting ? 'Envoi...' : 'Envoyer l\'évaluation'}
      </button>
    </div>
  );
}
