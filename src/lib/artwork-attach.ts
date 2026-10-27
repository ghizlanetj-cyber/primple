/**
 * Client-safe helpers for linking uploaded artwork to an order. The actual
 * link runs in one database transaction (attach_order_files) that checks
 * order ownership and every file, so either all files link or none do.
 */
export type ArtworkRef = { path: string; guestToken?: string };

export function artworkRefs(
  items: { artworkPath?: string | undefined; artworkGuestToken?: string | undefined }[],
): ArtworkRef[] {
  const seen = new Map<string, ArtworkRef>();
  for (const item of items) {
    const path = item.artworkPath?.trim();
    if (!path || seen.has(path)) continue;
    seen.set(path, item.artworkGuestToken ? { path, guestToken: item.artworkGuestToken } : { path });
  }
  return [...seen.values()];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateArtworkRefs(input: unknown): ArtworkRef[] {
  if (!Array.isArray(input) || input.length > 30) throw new Error("Invalid artwork list.");
  const refs = artworkRefs(
    input.map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const path = String(r["path"] ?? "").trim();
      const guestToken = r["guestToken"] == null ? "" : String(r["guestToken"]).trim();
      if (!path || path.length > 500 || path.includes("..")) throw new Error("Invalid artwork upload.");
      if (guestToken && !UUID.test(guestToken)) throw new Error("Invalid artwork upload.");
      return guestToken ? { artworkPath: path, artworkGuestToken: guestToken } : { artworkPath: path };
    }),
  );
  return refs;
}

export const ATTACH_FAILED =
  "Your order is saved, but your artwork could not be linked to it. Please try again.";

const ATTACH_ERRORS: Record<string, string> = {
  file_missing: "One of your files could not be found. Remove it from the cart and upload it again.",
  file_forbidden: "One of your files belongs to another session. Upload it again to continue.",
  file_already_attached: "One of your files is already linked to another order. Upload it again to continue.",
};

/** Maps a database error to a customer-safe message; never leaks internals. */
export function attachErrorMessage(error: { message?: string } | null | undefined): string {
  const key = Object.keys(ATTACH_ERRORS).find((k) => error?.message?.includes(k));
  return key ? ATTACH_ERRORS[key]! : ATTACH_FAILED;
}

/** Zero or partial counts never count as success. */
export function assertAllAttached(expected: number, attached: unknown) {
  if (typeof attached !== "number" || attached !== expected) throw new Error(ATTACH_FAILED);
}

type Rpc = (
  fn: "attach_order_files",
  args: { _order: string; _user: string | null; _claim: string | null; _files: ArtworkRef[] },
) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;

/** Server-side: run the transactional link and verify every file was attached. */
export async function attachArtwork(
  rpc: Rpc,
  args: { orderId: string; userId: string | null; claimToken: string | null; files: ArtworkRef[] },
): Promise<{ attached: number }> {
  if (args.files.length === 0) return { attached: 0 };
  const { data, error } = await rpc("attach_order_files", {
    _order: args.orderId,
    _user: args.userId,
    _claim: args.claimToken,
    _files: args.files,
  });
  if (error) {
    console.error("[artwork] attach failed", error.message?.slice(0, 60));
    throw new Error(attachErrorMessage(error));
  }
  assertAllAttached(args.files.length, data);
  return { attached: data as number };
}
