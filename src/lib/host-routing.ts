/**
 * Hostname routing applied before the app handles a request. The host only
 * changes which pages are reachable; it never grants access. /admin still
 * requires a signed-in staff account checked on the server.
 */
export const PUBLIC_ORIGIN = "https://primple.ma";
const INTERNAL_HOSTS = new Set(["primple.team", "www.primple.team"]);

/** Paths the internal dashboard host keeps serving. Everything else goes to primple.ma. */
const INTERNAL_ROUTES = ["/admin", "/login", "/signup", "/auth"];
const INTERNAL_PREFIXES = [
  "/auth.",
  "/api/",
  "/lovable/",
  "/_serverFn",
  "/_build",
  "/assets/",
  "/@",
  "/src/",
  "/node_modules/",
  "/favicon",
];

export type HostDecision =
  | { type: "pass"; noindex: boolean }
  | { type: "redirect"; location: string; status: 301 | 302 }
  | { type: "robots"; body: string };

export function hostDecision(host: string | null, pathname: string, search: string): HostDecision {
  const h = (host ?? "").toLowerCase().split(":")[0] ?? "";
  // Keep the canonical public host even if the primary-domain setting changes later.
  if (h === "www.primple.ma") return { type: "redirect", location: `${PUBLIC_ORIGIN}${pathname}${search}`, status: 301 };
  if (!INTERNAL_HOSTS.has(h)) return { type: "pass", noindex: false };
  if (pathname === "/robots.txt") return { type: "robots", body: "User-agent: *\nDisallow: /\n" };
  if (pathname === "/" || pathname === "") return { type: "redirect", location: "/admin", status: 302 };
  const internal =
    INTERNAL_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`)) ||
    INTERNAL_PREFIXES.some((p) => pathname.startsWith(p));
  if (internal) return { type: "pass", noindex: true };
  return { type: "redirect", location: `${PUBLIC_ORIGIN}${pathname}${search}`, status: 302 };
}
