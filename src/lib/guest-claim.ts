/**
 * A guest who paid can attach that order to an account created afterwards.
 * We keep the reference, its one-time claim token and the order email in the
 * browser only; the server checks the token and the verified email before
 * moving the order.
 */
const KEY = "primpel-order-claim";

export type GuestClaim = { reference: string; claimToken: string; email: string };

export function saveGuestClaim(claim: GuestClaim) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(claim));
  } catch {
    /* storage unavailable */
  }
}

export function readGuestClaim(): GuestClaim | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestClaim;
    if (!parsed?.reference || !parsed?.claimToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuestClaim() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
