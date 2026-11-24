import { describe, expect, it } from "vitest";
import { cartLineError, eurosToCents, safeInternalPath, listedUnitPrice } from "./checkout";
import { planLineFulfillment, saleSplit } from "../server/checkout";

describe("checkout helpers", () => {
  it("keeps internal redirect paths and rejects open redirects", () => {
    expect(safeInternalPath("/checkout")).toBe("/checkout");
    expect(safeInternalPath("/login?redirect=/checkout")).toBe("/login?redirect=/checkout");
    expect(safeInternalPath("https://evil.example")).toBe("/");
    expect(safeInternalPath("//evil.example")).toBe("/");
    expect(safeInternalPath(null)).toBe("/");
  });

  it("converts euros to cents", () => {
    expect(eurosToCents(220)).toBe(22000);
    expect(eurosToCents(10.5)).toBe(1050);
    expect(() => eurosToCents(0)).toThrow();
  });

  it("rejects items that cannot be purchased", () => {
    const listed = {
      status: "listed",
      sellerId: "seller",
      marchantId: "reseller",
      approvedPrice: "220",
    };
    expect(cartLineError(listed, "buyer")).toBeNull();
    expect(cartLineError(listed, "seller")).toBe("own_item");
    expect(cartLineError({ ...listed, status: "approved" }, "buyer")).toBe("not_listed");
    expect(cartLineError({ ...listed, marchantId: null }, "buyer")).toBe("no_reseller");
    expect(cartLineError(undefined, "buyer")).toBe("not_found");
    expect(listedUnitPrice({ minPrice: "15" })).toBe(15);
  });

  it("splits a sale and skips a repeated webhook for the same payment", () => {
    expect(saleSplit(220, 55, 35)).toEqual({ sellerAmt: 121, marchantAmt: 77, platformAmt: 22 });
    expect(planLineFulfillment({ paymentId: 4, itemStatus: "listed", existingPaymentId: null })).toBe("create");
    expect(planLineFulfillment({ paymentId: 4, itemStatus: "sold", existingPaymentId: 4 })).toBe("skip");
    expect(planLineFulfillment({ paymentId: 4, itemStatus: "sold", existingPaymentId: 2 })).toBe("attach");
  });
});
