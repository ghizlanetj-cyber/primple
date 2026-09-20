/**
 * Pure access rules for orders placed without an account.
 * Kept free of any server/database import so both the payment function and the
 * claim function share exactly one rule set — and so it can be unit tested.
 */

export type ClaimableOrder = {
  user_id: string | null;
  guest_email: string | null;
  claim_token: string | null;
};

/** A guest may pay an order only while it is unclaimed and the token matches. */
export function canPayOrder(
  order: { user_id: string | null; claim_token: string | null },
  caller: { userId?: string | null; claimToken?: string | null },
): boolean {
  const isOwner = Boolean(caller.userId) && order.user_id === caller.userId;
  const isGuest =
    !order.user_id && Boolean(order.claim_token) && caller.claimToken === order.claim_token;
  return isOwner || isGuest;
}

/**
 * An order moves to an account only when it is still unclaimed, the one-time
 * token matches and the verified account email matches the order email.
 */
export function canClaimOrder(
  order: ClaimableOrder | null | undefined,
  caller: { userId: string; email?: string | null; claimToken: string },
): boolean {
  if (!order) return false;
  if (order.user_id) return false;
  if (!order.claim_token || order.claim_token !== caller.claimToken) return false;
  const email = (caller.email ?? "").trim().toLowerCase();
  const orderEmail = (order.guest_email ?? "").trim().toLowerCase();
  if (email && orderEmail && email !== orderEmail) return false;
  return true;
}
