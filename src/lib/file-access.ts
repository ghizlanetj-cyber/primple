export type GuestArtworkAccess = {
  path: string;
  guestToken: string;
};

export function guestArtworkFolder(guestToken: string) {
  return `guests/${guestToken}`;
}

export function canAccessGuestArtwork(
  artwork: GuestArtworkAccess,
  candidate: GuestArtworkAccess,
) {
  return (
    artwork.guestToken === candidate.guestToken &&
    artwork.path === candidate.path &&
    artwork.path.startsWith(`${guestArtworkFolder(artwork.guestToken)}/`)
  );
}