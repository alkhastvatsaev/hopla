
'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe (use your publishable key here)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface CheckoutFormProps {
  amount: number;
  onSuccess: () => void;
}

function CheckoutForm({ amount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Just return to home for now to avoid redirects to non-existent pages that might 404
        return_url: `${window.location.origin}`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message || "Une erreur est survenue");
      setLoading(false);
    } else {
      // Payment successful
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <PaymentElement />
      {errorMessage && <div style={{ color: '#ff3b30', marginTop: '12px', fontSize: '14px' }}>{errorMessage}</div>}
      <button 
        disabled={loading || !stripe} 
        style={{
          width: '100%', background: '#007AFF',
          color: 'white', border: 'none', borderRadius: '16px', padding: '18px',
          fontSize: '17px', fontWeight: '700', transition: 'all 0.3s',
          marginTop: '24px', opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Traitement...' : `Payer ${amount.toFixed(2)}€`}
      </button>
    </form>
  );
}

interface StripePaymentProps {
  amount: number;
  onSuccess: () => void;
}

export default function StripePayment({ amount, onSuccess }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch client secret from the server
    setErrorMessage(null);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur serveur (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Secret client manquant dans la réponse");
        }
      })
      .catch((err) => {
        console.error("Payment initialization error:", err);
        setErrorMessage(err.message || "Impossible d'initialiser le paiement");
      });
  }, [amount]);

  if (errorMessage) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fff5f5', borderRadius: '24px', border: '1px solid #fee2e2' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '8px' }}>Erreur de configuration</div>
        <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '12px' }}>{errorMessage}</div>
        <div style={{ fontSize: '12px', color: '#ef4444' }}>Veuillez vérifier vos clés Stripe dans le fichier .env</div>
      </div>
    );
  }

  if (!clientSecret) return <div style={{ textAlign: 'center', padding: '20px', color: '#86868b' }}>Initialisation du paiement sécurisé...</div>;

  return (
    <>
      <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <CheckoutForm amount={amount} onSuccess={onSuccess} />
      </Elements>
    </>
  );
}
