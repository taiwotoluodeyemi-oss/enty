/** Financial amounts are integer minor units (for example, kobo), never floating point. */
export type Money = Readonly<{ amountMinor: number; currency: string }>;

export function assertMoney(value: Money): void {
  if (!Number.isSafeInteger(value.amountMinor)) {
    throw new RangeError("Money amount must be a safe integer in minor units");
  }
  if (!/^[A-Z]{3}$/.test(value.currency)) {
    throw new TypeError("Currency must be a three-letter uppercase ISO code");
  }
}

export function addMoney(left: Money, right: Money): Money {
  assertMoney(left);
  assertMoney(right);
  if (left.currency !== right.currency) throw new TypeError("Cannot add different currencies");
  const amountMinor = left.amountMinor + right.amountMinor;
  if (!Number.isSafeInteger(amountMinor)) throw new RangeError("Money sum exceeds safe integer range");
  return { amountMinor, currency: left.currency };
}

export function calculateBasisPointFee(amountMinor: number, rateBasisPoints: number): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new RangeError("Amount must be a non-negative safe integer");
  if (!Number.isSafeInteger(rateBasisPoints) || rateBasisPoints < 0 || rateBasisPoints > 10000) {
    throw new RangeError("Rate must be an integer from 0 to 10000 basis points");
  }
  // Deterministic integer rounding: half-up.
  return Math.floor((amountMinor * rateBasisPoints + 5000) / 10000);
}
