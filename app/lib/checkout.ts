import { PRICE_DB } from "./db";

export const CHECKOUT_QUOTE_VERSION = "2026-07-16";

export type CheckoutQuoteInput = {
  type: "courses" | "colis";
  items: Array<{ name: string }>;
  distanceKm: number;
  tip: number;
};

export type CheckoutQuote = {
  amountCents: number;
  itemTotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  tipCents: number;
};

const eurosToCents = (value: number) => Math.round(value * 100);

export function calculateCheckoutQuote(input: CheckoutQuoteInput): CheckoutQuote {
  if (input.type !== "courses" && input.type !== "colis") {
    throw new Error("Unsupported delivery type");
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) {
    throw new Error("An order must contain between 1 and 100 items");
  }

  const distanceKm = Number(input.distanceKm);
  const tip = Number(input.tip);
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 50) {
    throw new Error("Distance must be between 0 and 50 km");
  }
  if (!Number.isFinite(tip) || tip < 0 || tip > 100) {
    throw new Error("Tip must be between €0 and €100");
  }

  const isParcel = input.type === "colis";
  const itemTotal = input.items.reduce((total, item) => {
    const name = typeof item?.name === "string" ? item.name.trim().toLowerCase() : "";
    if (!name || name.length > 120) throw new Error("Each item must have a valid name");
    return total + (isParcel ? 0 : (PRICE_DB[name] ?? 3));
  }, 0);

  const deliveryFee = Math.max(
    4,
    2.5 + distanceKm * 0.9 + input.items.length * 0.15 + (isParcel ? 3 : 0),
  );
  const itemTotalCents = eurosToCents(itemTotal);
  const deliveryFeeCents = eurosToCents(deliveryFee);
  const serviceFeeCents = isParcel ? 0 : eurosToCents(itemTotal * 0.1);
  const tipCents = eurosToCents(tip);
  const amountCents =
    itemTotalCents + deliveryFeeCents + serviceFeeCents + tipCents;

  if (amountCents < 50 || amountCents > 100_000) {
    throw new Error("Order total is outside the supported payment range");
  }

  return {
    amountCents,
    itemTotalCents,
    deliveryFeeCents,
    serviceFeeCents,
    tipCents,
  };
}
