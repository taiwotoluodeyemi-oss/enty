import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyLegacyPaystackWebhookSignature, verifyPaystackWebhookSignature } from "../src/domain/payments/paystack.js";

describe("Paystack webhook signature verification", () => {
  const secret = "whsec_test_secret";
  const rawBody = Buffer.from('{"event":"charge.success","data":{"reference":"EVTY-12345678"}}');

  function signature(timestamp: number) {
    const digest = createHmac("sha512", secret).update(String(timestamp) + ".").update(rawBody).digest("hex");
    return "t=" + timestamp + ",v1=whk_test:" + digest;
  }

  it("accepts a valid signature inside the replay window", () => {
    expect(verifyPaystackWebhookSignature(rawBody, signature(1000), [secret], 1100)).toBe(true);
  });

  it("rejects a modified body", () => {
    expect(verifyPaystackWebhookSignature(Buffer.from(rawBody.toString() + " "), signature(1000), [secret], 1100)).toBe(false);
  });

  it("rejects signatures outside the replay window", () => {
    expect(verifyPaystackWebhookSignature(rawBody, signature(1000), [secret], 1400)).toBe(false);
  });

  it("supports secret rotation during the overlap window", () => {
    expect(verifyPaystackWebhookSignature(rawBody, signature(1000), ["old-secret", secret], 1000)).toBe(true);
  });

  it("verifies the legacy x-paystack-signature format", () => {
    const legacy = createHmac("sha512", "sk_test_example").update(rawBody).digest("hex");
    expect(verifyLegacyPaystackWebhookSignature(rawBody, legacy, "sk_test_example")).toBe(true);
    expect(verifyLegacyPaystackWebhookSignature(Buffer.from("tampered"), legacy, "sk_test_example")).toBe(false);
  });

  it("rejects malformed or missing headers", () => {
    expect(verifyPaystackWebhookSignature(rawBody, undefined, [secret], 1000)).toBe(false);
    expect(verifyPaystackWebhookSignature(rawBody, "t=1000,v1=bad", [secret], 1000)).toBe(false);
  });
});
