import { NextResponse } from "next/server";
import {
  calculateCheckoutQuote,
  CHECKOUT_QUOTE_VERSION,
  type CheckoutQuoteInput,
} from "../../lib/checkout";
import { getStripe } from "../../lib/stripe";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CheckoutQuoteInput;
    const quote = calculateCheckoutQuote(input);

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: quote.amountCents,
      currency: "eur",
      metadata: { quoteVersion: CHECKOUT_QUOTE_VERSION },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: quote.amountCents / 100,
    });
  } catch (error) {
    const isValidationError =
      error instanceof Error &&
      !["Stripe is not configured", "Live Stripe payments are disabled"].includes(error.message);
    console.error("Stripe checkout initialization failed");
    return NextResponse.json(
      { error: isValidationError ? error.message : "Payment service is unavailable" },
      { status: isValidationError ? 400 : 503 },
    );
  }
}
