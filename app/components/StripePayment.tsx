
'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
  ExpressCheckoutElement
} from '@stripe/react-stripe-js';
import type { CheckoutQuoteInput } from '../lib/checkout';

// Initialize Stripe (use your publishable key here)
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
}

function CheckoutForm({ amount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Just return to home for now as state recovery is complex
        return_url: `${window.location.origin}/create-list?stripe_redirect=true`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message || "Une erreur est survenue");
      setLoading(false);
    } else {
      // Payment successful
      try {
        if (!paymentIntent || paymentIntent.status !== 'succeeded') {
          throw new Error("Le paiement n'a pas pu être vérifié.");
        }
        await onSuccess(paymentIntent.id);
      } catch (err: any) {
        setErrorMessage(err.message || "Le paiement a réussi mais la commande n'a pas pu être créée.");
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Express Checkout (Apple Pay / Google Pay) */}
      <ExpressCheckoutElement 
        onConfirm={() => {
          // Additional logic if needed prior to confirmation, 
          // but Stripe handles the confirmation automatically for Express Checkout.
          // Note: Express Checkout will redirect or trigger payment success,
          // then we might want to trigger onSuccess manually or listen to Stripe events.
        }}
        options={{
          buttonTheme: {
            applePay: 'black'
          }
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
        <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>OU</div>
        <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
      </div>

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
    </div>
  );
}

interface StripePaymentProps {
  amount: number;
  quote: CheckoutQuoteInput;
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
}

export default function StripePayment({ amount, quote, onSuccess }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const quoteKey = JSON.stringify(quote);

  useEffect(() => {
    // Fetch client secret from the server
    setErrorMessage(null);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: quoteKey,
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
  }, [quoteKey]);

  if (errorMessage) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fff5f5', borderRadius: '24px', border: '1px solid #fee2e2' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '8px' }}>Problème de Configuration</div>
        <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '16px', lineHeight: '1.4' }}>{errorMessage}</div>
        <div style={{ fontSize: '13px', color: '#666', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #eee' }}>
          💡 <b>Action requise :</b> Vérifiez que vos clés Stripe sont bien configurées dans Vercel (Variables d'environnement) ou dans votre fichier .env.local localement.
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fff5f5', borderRadius: '24px', border: '1px solid #fee2e2' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔑</div>
        <div style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '8px' }}>Clé Publique Manquante</div>
        <div style={{ fontSize: '14px', color: '#dc2626' }}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n'est pas définie.</div>
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
