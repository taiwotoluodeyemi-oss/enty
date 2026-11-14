import { describe, expect, it } from "vitest";
import { assertPrimaryPaymentProviderAvailable, getPaymentProviderPolicy } from "../src/domain/payments/provider-policy.js";

describe("EVTY payment provider policy", () => {
  it("defaults to OPay primary and Paystack secondary without enabling either provider", () => {
    expect(getPaymentProviderPolicy({})).toEqual({
      primary: "opay",
      secondary: "paystack",
      opayEnabled: false,
      paystackReady: false
    });
  });

  it("enables OPay only when explicitly enabled and all merchant credentials exist", () => {
    const policy = getPaymentProviderPolicy({
      OPAY_ENABLED: "true",
      OPAY_MERCHANT_ID: "merchant",
      OPAY_PUBLIC_KEY: "public",
      OPAY_PRIVATE_KEY: "private",
      PAYSTACK_SECRET_KEY: "sk_test_example",
      PAYSTACK_WEBHOOK_SECRET: "whsec_example"
    });
    expect(policy.opayEnabled).toBe(true);
    expect(policy.paystackReady).toBe(true);
    expect(assertPrimaryPaymentProviderAvailable(policy)).toBe("opay");
  });

  it("does not silently fall back to Paystack when OPay is unavailable", () => {
    const policy = getPaymentProviderPolicy({
      PAYSTACK_SECRET_KEY: "sk_test_example",
      PAYSTACK_WEBHOOK_SECRET: "whsec_example"
    });
    expect(policy.paystackReady).toBe(true);
    expect(() => assertPrimaryPaymentProviderAvailable(policy)).toThrow("OPAY_PRIMARY_PROVIDER_NOT_CONFIGURED");
  });

  it("rejects environment overrides that reverse provider priority", () => {
    expect(() => getPaymentProviderPolicy({ PAYMENT_PRIMARY_PROVIDER: "paystack" })).toThrow("fixed to OPay primary");
  });
});
