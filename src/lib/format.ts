export function mad(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} MAD`;
}

export function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Per-unit prices can be small, so keep two decimals when needed. */
export function madUnit(value: number) {
  const rounded = value < 100 ? Number(value.toFixed(2)) : Math.round(value);
  return `${rounded.toLocaleString("en-US", { maximumFractionDigits: 2 })} MAD`;
}
