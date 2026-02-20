import { NextResponse } from "next/server";
import Stripe from "stripe";

const getStripe = () => {
  const rawKey = process.env.STRIPE_SECRET_KEY;
  const key = rawKey?.trim();

  if (!key) {
    console.error("STRIPE_SECRET_KEY is missing or empty!");
    throw new Error(
      "La clé secrète Stripe (STRIPE_SECRET_KEY) est manquante dans les variables d'environnement.",
    );
  }

  if (rawKey && /[\r\n\t]/.test(rawKey)) {
    console.error("STRIPE_SECRET_KEY contains invalid whitespace/control characters");
    throw new Error(
      "La clé secrète Stripe contient un caractère invalide (retour à la ligne / tabulation). Supprimez et recréez STRIPE_SECRET_KEY dans Vercel en collant la clé sur une seule ligne (sans guillemets).",
    );
  }

  if (/\s/.test(key)) {
    console.error("STRIPE_SECRET_KEY contains whitespace");
    throw new Error(
      "La clé secrète Stripe contient des espaces. Recollez la valeur sans espaces ni guillemets dans Vercel.",
    );
  }

  if (!key.startsWith("sk_")) {
    console.error("STRIPE_SECRET_KEY has an invalid format!");
    throw new Error(
      "La clé secrète Stripe a un format invalide (doit commencer par sk_).",
    );
  }

  if (key.startsWith("sk_test")) {
    console.log("Using Stripe TEST key");
  } else if (key.startsWith("sk_live")) {
    console.log("Using Stripe LIVE key");
  }

  return new Stripe(key, {
    apiVersion: "2024-06-20" as any,
  });
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const amount = parseFloat(body.amount);
    const jobId = body.jobId;

    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid amount received:", body.amount);
      return NextResponse.json(
        { error: "Le montant du paiement est invalide (NaN ou <= 0)." },
        { status: 400 }
      );
    }

    // Create a PaymentIntent for the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: { jobId: jobId || "no_job_id" },
      capture_method: "automatic",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    // On renvoie un message plus descriptif si possible
    const errorMessage =
      err.message ||
      "Une erreur est survenue lors de l'initialisation du paiement";
    return NextResponse.json(
      {
        error: errorMessage,
        code: err.code,
        type: err.type,
      },
      { status: 500 },
    );
  }
}
