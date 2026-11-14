import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpayClient, verifyOpayCallbackSignature } from "../src/domain/payments/opay.js";

describe("OPay payment adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  const config = {
    merchantId: "merchant-test",
    publicKey: "public-test",
    privateKey: "private-test",
    environment: "test" as const
  };

  it("creates a hosted checkout using OPay test credentials and validates returned details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "00000",
      data: {
        reference: "EVTY-ORDER-0001",
        orderNo: "OPAY-ORDER-1",
        cashierUrl: "https://sandboxcashier.opaycheckout.com/checkout?token=test",
        status: "INITIAL",
        amount: { total: 125000, currency: "NGN" }
      }
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new OpayClient(config);
    const result = await client.createPayment({
      reference: "EVTY-ORDER-0001",
      amountMinor: 125000,
      currency: "NGN",
      productName: "EVTY event ticket",
      productDescription: "Admission ticket",
      returnUrl: "https://evty-web.onrender.com/payment/return",
      callbackUrl: "https://evty-api.onrender.com/api/v1/payments/opay/webhook",
      cancelUrl: "https://evty-web.onrender.com/payment/cancel"
    });
    expect(result.cashierUrl).toContain("sandboxcashier.opaycheckout.com");
    expect(result.amountMinor).toBe(125000);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://testapi.opaycheckout.com/api/v1/international/cashier/create");
    expect((request.headers as Record<string, string>).Authorization).toBe("Bearer public-test");
  });

  it("signs status verification requests with HMAC-SHA512", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "00000",
      data: { reference: "EVTY-ORDER-0001", status: "SUCCESS", amount: { total: 125000, currency: "NGN" } }
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new OpayClient(config);
    const result = await client.verifyPayment("EVTY-ORDER-0001");
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = String(request.body);
    const expected = createHmac("sha512", config.privateKey).update(body).digest("hex");
    expect((request.headers as Record<string, string>).Authorization).toBe("Bearer " + expected);
    expect(result.status).toBe("SUCCESS");
  });

  it("verifies OPay callback SHA3-512 signatures", () => {
    const payload = {
      amount: "125000",
      currency: "NGN",
      reference: "EVTY-ORDER-0001",
      refunded: false,
      status: "SUCCESS",
      timestamp: "2026-11-14T12:00:00Z",
      token: "token-1",
      transactionId: "transaction-1"
    };
    const content = `{Amount:"${payload.amount}",Currency:"${payload.currency}",Reference:"${payload.reference}",Refunded:f,Status:"${payload.status}",Timestamp:"${payload.timestamp}",Token:"${payload.token}",TransactionID:"${payload.transactionId}"}`;
    const signature = createHmac("sha3-512", config.privateKey).update(content).digest("hex");
    expect(verifyOpayCallbackSignature(payload, signature, config.privateKey)).toBe(true);
    expect(verifyOpayCallbackSignature(payload, signature, "wrong-secret")).toBe(false);
  });

  it("rejects non-NGN amounts, invalid references and insecure return URLs", async () => {
    const client = new OpayClient(config);
    const base = {
      reference: "EVTY-ORDER-0001",
      amountMinor: 100,
      currency: "NGN" as const,
      productName: "Ticket",
      productDescription: "Admission",
      returnUrl: "http://insecure.example/return",
      callbackUrl: "https://api.example/webhook",
      cancelUrl: "https://web.example/cancel"
    };
    await expect(client.createPayment(base)).rejects.toThrow("HTTPS");
    await expect(client.createPayment({ ...base, reference: "bad" })).rejects.toThrow("reference");
  });

  it("rejects a cashier URL outside OPay's documented checkout hosts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: "00000",
      data: {
        reference: "EVTY-ORDER-0001",
        orderNo: "OPAY-ORDER-1",
        cashierUrl: "https://evil.example/collect",
        status: "INITIAL",
        amount: { total: 100, currency: "NGN" }
      }
    }), { status: 200, headers: { "content-type": "application/json" } })));
    const client = new OpayClient(config);
    await expect(client.createPayment({
      reference: "EVTY-ORDER-0001", amountMinor: 100, currency: "NGN",
      productName: "Ticket", productDescription: "Admission",
      returnUrl: "https://web.example/return", callbackUrl: "https://api.example/webhook",
      cancelUrl: "https://web.example/cancel"
    })).rejects.toThrow("unexpected checkout URL");
  });
});
