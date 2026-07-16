import { describe, expect, it } from "vitest";

import { calculateCheckoutQuote } from "./checkout";

describe("calculateCheckoutQuote", () => {
  it("prices catalog items and applies the minimum delivery fee", () => {
    expect(
      calculateCheckoutQuote({
        type: "courses",
        items: [{ name: "Lait entier" }],
        distanceKm: 0,
        tip: 0,
      }),
    ).toEqual({
      amountCents: 538,
      itemTotalCents: 125,
      deliveryFeeCents: 400,
      serviceFeeCents: 13,
      tipCents: 0,
    });
  });

  it("does not charge an item or service fee for parcels", () => {
    expect(
      calculateCheckoutQuote({
        type: "colis",
        items: [{ name: "Colis Personnalisé" }],
        distanceKm: 0,
        tip: 0,
      }).amountCents,
    ).toBe(565);
  });

  it("rejects abusive quote inputs", () => {
    expect(() =>
      calculateCheckoutQuote({
        type: "courses",
        items: [{ name: "Milk" }],
        distanceKm: 51,
        tip: 0,
      }),
    ).toThrow("Distance");
  });
});
