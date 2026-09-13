/** Single money source of truth: everything is computed on integer centimes. */
export function toCents(value: number) {
  return Math.round(value * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}

/** Snap a floating amount to the nearest centime so totals always add up. */
export function roundMoney(value: number) {
  return fromCents(toCents(value));
}

type MoneyLocale = "en-US" | "fr-FR" | "ar-MA";

let moneyLocale: MoneyLocale = "fr-FR";

/** Kept in sync with the active UI language by the i18n provider. */
export function setMoneyLocale(lang: "en" | "fr" | "ar") {
  moneyLocale = lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-MA" : "en-US";
}

function amount(value: number, maximumFractionDigits = 2) {
  return roundMoney(value).toLocaleString(moneyLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });
}

/** Order amounts: always two decimals, grouped for the active language. */
export function mad(value: number) {
  return `${amount(value)} MAD`;
}

export function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Per-unit prices use the same two-decimal money format. */
export function madUnit(value: number) {
  return `${amount(value)} MAD`;
}
