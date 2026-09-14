/** Client-safe YouCan Pay helpers. No keys live here — the public key comes from the server. */

export const YOUCANPAY_SCRIPT_URL = "https://youcanpay.com/yp.js";

export type YouCanPayLocale = "en" | "fr" | "ar";

export interface YouCanPayResult {
  status: string;
  transaction?: { id?: string };
  error?: { message?: string };
}

export interface YouCanPayElement {
  mount: () => Promise<void>;
  confirm: () => Promise<YouCanPayResult>;
}

type YouCanPayFactory = (
  publicKey: string,
  options?: { locale?: YouCanPayLocale },
) => { elements: (options: { token: string; container: string | HTMLElement }) => YouCanPayElement };

declare global {
  interface Window {
    yp?: YouCanPayFactory;
  }
}

let scriptPromise: Promise<YouCanPayFactory> | null = null;

/** Loads yp.js once and resolves with the global factory. */
export function loadYouCanPay(): Promise<YouCanPayFactory> {
  if (typeof window === "undefined") return Promise.reject(new Error("yp.js requires a browser"));
  if (window.yp) return Promise.resolve(window.yp);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<YouCanPayFactory>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${YOUCANPAY_SCRIPT_URL}"]`);
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.yp) resolve(window.yp);
      else reject(new Error("yp.js loaded without exposing window.yp"));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("yp.js failed to load")), { once: true });

    if (!existing) {
      script.src = YOUCANPAY_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    } else if (window.yp) {
      onLoad();
    }
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export function formatMinorUnits(amountCents: number, currency: string, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountCents / 100);
}
