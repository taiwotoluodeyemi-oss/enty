export type PaymentProviderName = "opay" | "paystack";

export type PaymentProviderPolicy = {
  primary: PaymentProviderName;
  secondary: PaymentProviderName;
  opayEnabled: boolean;
  paystackReady: boolean;
};

/**
 * Server-side provider policy. OPay is always the primary Nigeria route.
 * Paystack is deliberately not an automatic retry after an OPay timeout:
 * the OPay reference must be reconciled first to avoid double charging.
 */
export function getPaymentProviderPolicy(
  env: Record<string, string | undefined> = process.env
): PaymentProviderPolicy {
  const primary = (env.PAYMENT_PRIMARY_PROVIDER ?? "opay").toLowerCase();
  const secondary = (env.PAYMENT_SECONDARY_PROVIDER ?? "paystack").toLowerCase();
  if (primary !== "opay" || secondary !== "paystack") {
    throw new Error("EVTY payment routing is fixed to OPay primary and Paystack secondary");
  }
  return {
    primary: "opay",
    secondary: "paystack",
    // Sandbox credentials become usable as soon as they are supplied.
    // An explicit false always disables OPay. LIVE additionally requires
    // the separate merchant-approval gate to prevent accidental live charging.
    opayEnabled: env.OPAY_ENABLED !== "false" &&
      Boolean(env.OPAY_MERCHANT_ID && env.OPAY_PUBLIC_KEY && env.OPAY_PRIVATE_KEY) &&
      (env.OPAY_ENV !== "live" || env.OPAY_LIVE_MODE_READY === "true"),
    paystackReady: Boolean(env.PAYSTACK_SECRET_KEY && env.PAYSTACK_WEBHOOK_SECRET)
  };
}

export function assertPrimaryPaymentProviderAvailable(
  policy: PaymentProviderPolicy
): "opay" {
  if (!policy.opayEnabled) {
    throw new Error("OPAY_PRIMARY_PROVIDER_NOT_CONFIGURED");
  }
  return "opay";
}
