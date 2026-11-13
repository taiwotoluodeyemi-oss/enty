import { describe, expect, it } from "vitest";
import { consumeFixedWindowRateLimit, type RateLimitBucket } from "../src/domain/fixedWindowRateLimit.js";

describe("fixed-window rate limiter", () => {
  it("allows requests up to the configured limit", () => {
    const buckets = new Map<string, RateLimitBucket>();
    expect(consumeFixedWindowRateLimit(buckets, "client", 2, 60_000, 1000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(consumeFixedWindowRateLimit(buckets, "client", 2, 60_000, 1001)).toMatchObject({ allowed: true, remaining: 0 });
    expect(consumeFixedWindowRateLimit(buckets, "client", 2, 60_000, 1002)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("starts a new window after expiry", () => {
    const buckets = new Map<string, RateLimitBucket>();
    consumeFixedWindowRateLimit(buckets, "client", 1, 1000, 1000);
    expect(consumeFixedWindowRateLimit(buckets, "client", 1, 1000, 2000)).toMatchObject({ allowed: true, remaining: 0, resetAt: 3000 });
  });

  it("isolates clients", () => {
    const buckets = new Map<string, RateLimitBucket>();
    consumeFixedWindowRateLimit(buckets, "one", 1, 1000, 1000);
    expect(consumeFixedWindowRateLimit(buckets, "two", 1, 1000, 1000).allowed).toBe(true);
  });

  it("rejects invalid configuration", () => {
    expect(() => consumeFixedWindowRateLimit(new Map(), "client", 0, 1000, 1000)).toThrow();
    expect(() => consumeFixedWindowRateLimit(new Map(), "client", 1, 0, 1000)).toThrow();
  });
});
