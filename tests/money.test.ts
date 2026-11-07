import { describe, expect, it } from "vitest";
import { addMoney, calculateBasisPointFee } from "../src/domain/money.js";

describe("money arithmetic", () => {
  it("adds same-currency integer minor units", () => {
    expect(addMoney({ amountMinor: 100, currency: "NGN" }, { amountMinor: 25, currency: "NGN" }))
      .toEqual({ amountMinor: 125, currency: "NGN" });
  });
  it("rejects currency mixing", () => {
    expect(() => addMoney({ amountMinor: 100, currency: "NGN" }, { amountMinor: 25, currency: "USD" }))
      .toThrow("Cannot add different currencies");
  });
  it("calculates a deterministic basis-point fee", () => {
    expect(calculateBasisPointFee(10001, 250)).toBe(250);
  });
  it("rejects invalid values", () => {
    expect(() => calculateBasisPointFee(-1, 100)).toThrow();
    expect(() => calculateBasisPointFee(100, 10001)).toThrow();
  });
});
