import { createHmac, timingSafeEqual } from "node:crypto";

export type PaystackInitializeInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitialization = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaystackVerification = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customerEmail: string | null;
};

type PaystackEnvelope<T> = {
  status: boolean;
  message?: string;
  data?: T;
};

function requireHttpsUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Paystack API base URL must use HTTPS");
  return url.toString().replace(/\/$/, "");
}

export class PaystackClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(secretKey: string, baseUrl = "https://api.paystack.co") {
    if (!secretKey || !/^(sk_test_|sk_live_)/.test(secretKey)) {
      throw new Error("A Paystack test or live secret key is required");
    }
    this.secretKey = secretKey;
    this.baseUrl = requireHttpsUrl(baseUrl);
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      ...init,
      headers: {
        Authorization: "Bearer " + this.secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers
      },
      signal: AbortSignal.timeout(12_000)
    });
    const body = await response.json() as PaystackEnvelope<T>;
    if (!response.ok || !body.status || body.data === undefined) {
      throw new Error("Paystack request failed: " + (body.message || "provider error"));
    }
    return body.data;
  }

  async initialize(input: PaystackInitializeInput): Promise<PaystackInitialization> {
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("Payment amount must be a positive integer in minor units");
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("Currency must be an ISO 4217 code");
    if (!/^[A-Za-z0-9.=\-]{8,100}$/.test(input.reference)) throw new Error("Payment reference is invalid");
    if (!input.email || input.email.length > 254) throw new Error("A valid customer email is required");
    const data = await this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountMinor),
        currency: input.currency,
        reference: input.reference,
        ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
        ...(input.metadata ? { metadata: JSON.stringify(input.metadata) } : {})
      })
    });
    const authorization = new URL(data.authorization_url);
    if (authorization.protocol !== "https:" || authorization.hostname !== "checkout.paystack.com") {
      throw new Error("Paystack returned an unexpected checkout URL");
    }
    if (data.reference !== input.reference || !data.access_code) {
      throw new Error("Paystack returned an inconsistent transaction reference");
    }
    return {
      authorizationUrl: authorization.toString(),
      accessCode: data.access_code,
      reference: data.reference
    };
  }

  async verify(reference: string): Promise<PaystackVerification> {
    if (!/^[A-Za-z0-9.=\-]{8,100}$/.test(reference)) throw new Error("Payment reference is invalid");
    const data = await this.request<{
      status: string;
      reference: string;
      amount: number;
      currency: string;
      customer?: { email?: string };
    }>("/transaction/verify/" + encodeURIComponent(reference), { method: "GET" });
    return {
      status: data.status,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      customerEmail: data.customer?.email ?? null
    };
  }
}

export function verifyPaystackWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  signingSecrets: string[],
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
): boolean {
  if (!signatureHeader || signingSecrets.length === 0) return false;
  const fields = signatureHeader.split(",").map((part) => part.trim());
  const timestampField = fields.find((part) => part.startsWith("t="));
  const timestamp = timestampField ? Number(timestampField.slice(2)) : NaN;
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const signatures = fields.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3).split(":").at(-1) || "");
  if (!signatures.length || signatures.some((value) => !/^[a-f0-9]{128}$/i.test(value))) return false;
  return signingSecrets.some((secret) => {
    if (!secret) return false;
    const expected = createHmac("sha512", secret).update(String(timestamp) + ".").update(rawBody).digest();
    return signatures.some((signature) => {
      const actual = Buffer.from(signature, "hex");
      return actual.length === expected.length && timingSafeEqual(expected, actual);
    });
  });
}
