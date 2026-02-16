import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in the environment variables.",
    );
  }
  return new Stripe(key, {
    apiVersion: "2025-01-27-acacia" as any,
  });
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { amount, jobId } = await request.json();

    // Create a PaymentIntent for the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: "eur",
      metadata: { jobId },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
