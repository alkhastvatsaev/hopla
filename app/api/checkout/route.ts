import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("STRIPE_SECRET_KEY is missing!");
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in the environment variables.",
    );
  }
  
  if (key.startsWith('sk_test')) {
    console.log("Using Stripe TEST key");
  } else if (key.startsWith('sk_live')) {
    console.log("Using Stripe LIVE key");
  } else {
    console.error("STRIPE_SECRET_KEY has an invalid format!");
  }

  // On utilise la dernière version stable supportée par le SDK
  return new Stripe(key);
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { amount, jobId } = await request.json();

    // Create a PaymentIntent for the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "eur",
      metadata: { jobId },
      capture_method: 'manual', 
      payment_method_options: {
        card: {
          capture_method: 'manual',
        },
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    // On renvoie un message plus descriptif si possible
    const errorMessage = err.message || "Une erreur est survenue lors de l'initialisation du paiement";
    return NextResponse.json({ 
      error: errorMessage,
      code: err.code,
      type: err.type
    }, { status: 500 });
  }
}
