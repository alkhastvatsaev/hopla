import "server-only";

import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new Error("Stripe is not configured");
  }
  if (key.startsWith("sk_live_") && process.env.STRIPE_LIVE_PAYMENTS_ENABLED !== "true") {
    throw new Error("Live Stripe payments are disabled");
  }

  stripe ??= new Stripe(key);
  return stripe;
}
