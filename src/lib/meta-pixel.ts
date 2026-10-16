export const META_PIXEL_ID = "2086841301952485";
export const MARKETING_CONSENT_KEY = "primple-marketing-consent-v1";
export const META_SCRIPT_ID = "primple-meta-pixel";

export type MarketingConsent = "granted" | "denied" | null;
export type PixelPage = { href: string; referrer: string };

const publicHosts = new Set(["primple.ma", "www.primple.ma"]);
const privatePaths = /^\/(?:admin|api|auth|login|signup|dashboard|checkout|cart|payment)(?:[/.]|$)|^\/shop\/(?:checkout|confirmation)(?:\/|$)/i;
const publicPaths = /^(?:\/|\/(?:products|packs|shop|blog)(?:\/[a-z0-9-]+)?\/?|\/(?:about|contact|platform|pricing|help|design-services|services|enterprise|partners|designers|privacy|terms|security)\/?)$/i;

/** An explicit public-page allowlist excludes account/order/payment URLs. */
export function isPublicMarketingPage(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" && publicHosts.has(url.hostname) && !privatePaths.test(url.pathname) && publicPaths.test(url.pathname);
  } catch {
    return false;
  }
}

function safeTrackingUrl(href: string): boolean {
  if (!isPublicMarketingPage(href)) return false;
  const url = new URL(href);
  // Meta reads the browser URL itself: never load on tokens, contact details or
  // arbitrary form parameters. Ordinary advertising attribution stays supported.
  return !url.hash && [...url.searchParams].every(([key, value]) =>
    /^(?:utm_(?:source|medium|campaign|term|content|id)|fbclid|gclid|gbraid|wbraid|msclkid)$/i.test(key) &&
    value.length <= 512 && !value.includes("@"),
  );
}

export function canTrackMetaPage(page: PixelPage): boolean {
  if (!safeTrackingUrl(page.href)) return false;
  if (!page.referrer) return true;
  try {
    const referrer = new URL(page.referrer);
    // document.referrer can contain a same-site account/order URL after sign-in.
    if (publicHosts.has(referrer.hostname) || referrer.hostname === "primple.team" || referrer.hostname === "www.primple.team") {
      return safeTrackingUrl(page.referrer);
    }
    return true;
  } catch {
    return false;
  }
}

export function parseMarketingConsent(value: string | null): MarketingConsent {
  return value === "granted" || value === "denied" ? value : null;
}

export type PixelAdapter = {
  page: () => PixelPage;
  load: (onReady: () => void) => void;
  send: (...args: unknown[]) => void;
  clearCookies: () => void;
};

/** No SDK request before consent; re-check the current URL after async load. */
export function createMetaTracker(adapter: PixelAdapter) {
  let started = false;
  let ready = false;
  let active = false;
  let consent = false;
  let lastPage: string | null = null;

  const update = (allowed: boolean) => {
    consent = allowed;
    const page = adapter.page();
    if (!consent || !canTrackMetaPage(page)) {
      if (started) adapter.send("consent", "revoke");
      if (started && (active || !consent)) adapter.clearCookies();
      active = false;
      lastPage = null;
      return;
    }
    if (!started) {
      started = true;
      adapter.load(() => {
        ready = true;
        update(consent);
      });
    }
    if (!ready) return;
    if (!active) adapter.send("consent", "grant");
    active = true;
    if (lastPage === page.href) return;
    lastPage = page.href;
    adapter.send("trackSingle", META_PIXEL_ID, "PageView");
  };
  return { update };
}

type PixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: PixelFunction;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: PixelFunction;
    _fbq?: PixelFunction;
  }
}

let browserTracker: ReturnType<typeof createMetaTracker> | undefined;

export function getBrowserMetaTracker() {
  if (browserTracker) return browserTracker;
  browserTracker = createMetaTracker({
    page: () => ({ href: window.location.href, referrer: document.referrer }),
    send: (...args) => window.fbq?.(...args),
    clearCookies: () => {
      for (const name of ["_fbp", "_fbc"]) {
        for (const domain of ["", "; domain=primple.ma", "; domain=.primple.ma", `; domain=${window.location.hostname}`]) {
          document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax; Secure`;
        }
      }
    },
    load: (onReady) => {
      if (!window.fbq) {
        const fbq: PixelFunction = Object.assign(function (...args: unknown[]) {
          if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
          else fbq.queue.push(args);
        }, { queue: [] as unknown[][], loaded: true, version: "2.0" }) as PixelFunction;
        fbq.push = fbq;
        window.fbq = fbq;
        window._fbq ??= fbq;
      }
      window.fbq("consent", "revoke");
      window.fbq("set", "autoConfig", false, META_PIXEL_ID);
      window.fbq("init", META_PIXEL_ID);
      const script = document.createElement("script");
      script.id = META_SCRIPT_ID;
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.referrerPolicy = "origin";
      script.onload = () => {
        script.dataset["loaded"] = "true";
        onReady();
      };
      document.head.appendChild(script);
    },
  });
  return browserTracker;
}
