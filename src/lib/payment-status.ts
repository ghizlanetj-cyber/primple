/**
 * Pure post-payment rules shared by checkout, payment retry and tests.
 * Only the server-side order status (written by the signed webhook) decides
 * "confirmed"; the browser widget result alone never does.
 */
export type VerifyView = "verifying" | "delayed" | "confirmed" | "failed";

export const POLL_MS = 2500;
export const SLOW_POLL_MS = 10_000;
export const VERIFY_TIMEOUT_MS = 45_000;

export function verifyView(
  status: string | null | undefined,
  elapsedMs: number,
  timeoutMs = VERIFY_TIMEOUT_MS,
): VerifyView {
  if (status === "paid") return "confirmed";
  if (status === "failed") return "failed";
  return elapsedMs >= timeoutMs ? "delayed" : "verifying";
}

/** Keeps polling after the timeout, just less often, so a late webhook still lands. */
export function pollDelay(view: VerifyView): number | null {
  if (view === "verifying") return POLL_MS;
  if (view === "delayed") return SLOW_POLL_MS;
  return null;
}

/** Same-origin path only; blocks protocol-relative and absolute URLs. */
export function safeInternalPath(candidate: string | null | undefined, fallback = "/dashboard"): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }
  return candidate;
}

export function dashboardOrderPath(reference: string, paid = true): string {
  const params = new URLSearchParams({ order: reference });
  if (paid) params.set("paid", "1");
  return `/dashboard?${params.toString()}`;
}

export const PRINT_REFERENCE = /^PRM-\d{4,8}$/;
