import { createHmac, timingSafeEqual } from "node:crypto";

export type OpayConfig = {
  merchantId: string;
  publicKey: string;
  privateKey: string;
  environment: "test" | "live";
};

export type OpayCreatePaymentInput = {
  reference: string;
  amountMinor: number;
  currency: "NGN";
  productName: string;
  productDescription: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  returnUrl: string;
  callbackUrl: string;
  cancelUrl: string;
  expireAtMinutes?: number;
};

export type OpayCreatePaymentResult = {
  reference: string;
  orderNo: string;
  cashierUrl: string;
  status: "INITIAL" | "PENDING" | "SUCCESS" | "FAIL" | "CLOSE";
  amountMinor: number;
  currency: string;
};

type OpayEnvelope<T> = { code: string; message?: string; data?: T };

const PATHS = {
  create: "/api/v1/international/cashier/create",
  status: "/api/v1/international/cashier/status",
  refund: "/api/v1/international/payment/refund/create"
} as const;

function httpsUrl(value: string, label: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(label + " must use HTTPS");
  return url.toString().replace(/\/$/, "");
}

function safeReference(value: string): void {
  if (!/^[A-Za-z0-9._=-]{8,100}$/.test(value)) throw new Error("OPay reference is invalid");
}

function hmac(algorithm: "sha512" | "sha3-512", body: string, key: string): string {
  return createHmac(algorithm, key).update(body, "utf8").digest("hex");
}

function equalHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{128}$/i.test(left) || !/^[a-f0-9]{128}$/i.test(right)) return false;
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyOpayCallbackSignature(
  payload: {
    amount: string | number;
    currency: string;
    reference: string;
    refunded: boolean;
    status: string;
    timestamp: string;
    token?: string | null;
    transactionId: string;
  },
  signature: string | undefined,
  privateKey: string
): boolean {
  if (!signature || !privateKey || !payload || typeof payload.reference !== "string") return false;
  const content = `{Amount:"${payload.amount}",Currency:"${payload.currency}",Reference:"${payload.reference}",Refunded:${payload.refunded ? "t" : "f"},Status:"${payload.status}",Timestamp:"${payload.timestamp}",Token:"${payload.token ?? ""}",TransactionID:"${payload.transactionId}"}`;
  return equalHex(hmac("sha3-512", content, privateKey), signature);
}

export class OpayClient {
  private readonly config: OpayConfig;
  private readonly baseUrl: string;

  constructor(config: OpayConfig) {
    if (!config.merchantId || !config.publicKey || !config.privateKey) {
      throw new Error("OPay merchant ID, public key and private key are required");
    }
    this.config = config;
    this.baseUrl = config.environment === "live"
      ? "https://liveapi.opaycheckout.com"
      : "https://testapi.opaycheckout.com";
  }

  private async post<T>(path: string, body: Record<string, unknown>, auth: "public" | "signature"): Promise<T> {
    const serialized = JSON.stringify(body);
    const authorization = auth === "public"
      ? this.config.publicKey
      : hmac("sha512", serialized, this.config.privateKey);
    const response = await fetch(httpsUrl(this.baseUrl, "OPay API base URL") + path, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + authorization,
        MerchantId: this.config.merchantId,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: serialized,
      signal: AbortSignal.timeout(12_000)
    });
    let envelope: OpayEnvelope<T>;
    try {
      envelope = await response.json() as OpayEnvelope<T>;
    } catch {
      throw new Error("OPay returned an invalid response");
    }
    if (!response.ok || envelope.code !== "00000" || envelope.data === undefined) {
      throw new Error("OPay request failed (" + (envelope.code || response.status) + ")");
    }
    return envelope.data;
  }

  async createPayment(input: OpayCreatePaymentInput): Promise<OpayCreatePaymentResult> {
    safeReference(input.reference);
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("Payment amount must be a positive integer in minor units");
    }
    if (input.currency !== "NGN") throw new Error("OPay Nigeria checkout currently requires NGN");
    if (!input.productName.trim() || !input.productDescription.trim()) {
      throw new Error("Product name and description are required");
    }
    const returnUrl = httpsUrl(input.returnUrl, "OPay return URL");
    const callbackUrl = httpsUrl(input.callbackUrl, "OPay callback URL");
    const cancelUrl = httpsUrl(input.cancelUrl, "OPay cancel URL");
    const data = await this.post<{
      reference: string;
      orderNo: string;
      cashierUrl: string;
      status: OpayCreatePaymentResult["status"];
      amount: { total: number | string; currency: string };
    }>(PATHS.create, {
      country: "NG",
      reference: input.reference,
      amount: { total: input.amountMinor, currency: "NGN" },
      returnUrl,
      callbackUrl,
      cancelUrl,
      expireAt: input.expireAtMinutes ?? 30,
      product: { name: input.productName, description: input.productDescription },
      ...(input.customerEmail || input.customerName || input.customerPhone || input.customerId
        ? { userInfo: {
            ...(input.customerEmail ? { userEmail: input.customerEmail } : {}),
            ...(input.customerName ? { userName: input.customerName } : {}),
            ...(input.customerPhone ? { userMobile: input.customerPhone } : {}),
            ...(input.customerId ? { userId: input.customerId } : {})
          } }
        : {})
    }, "public");
    const cashier = new URL(data.cashierUrl);
    const allowedHosts = new Set(["cashier.opaycheckout.com", "sandboxcashier.opaycheckout.com"]);
    if (cashier.protocol !== "https:" || !allowedHosts.has(cashier.hostname)) {
      throw new Error("OPay returned an unexpected checkout URL");
    }
    if (data.reference !== input.reference || !data.orderNo || !Number.isSafeInteger(Number(data.amount.total)) ||
        Number(data.amount.total) !== input.amountMinor || data.amount.currency !== input.currency) {
      throw new Error("OPay returned transaction details that do not match the requested payment");
    }
    return {
      reference: data.reference,
      orderNo: data.orderNo,
      cashierUrl: cashier.toString(),
      status: data.status,
      amountMinor: Number(data.amount.total),
      currency: data.amount.currency
    };
  }

  async verifyPayment(reference: string): Promise<{
    reference: string;
    status: string;
    amountMinor: number;
    currency: string;
    transactionId?: string;
  }> {
    safeReference(reference);
    const data = await this.post<{
      reference: string;
      status: string;
      amount: { total: number | string; currency: string };
      transactionId?: string;
    }>(PATHS.status, { country: "NG", reference }, "signature");
    return {
      reference: data.reference,
      status: data.status,
      amountMinor: Number(data.amount.total),
      currency: data.amount.currency,
      ...(data.transactionId ? { transactionId: data.transactionId } : {})
    };
  }
}
