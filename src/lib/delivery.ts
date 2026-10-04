/**
 * Conservative arrival estimate: production THEN delivery, counted in working
 * days (Saturday and Sunday skipped). It is an estimate from the moment payment
 * and artwork are approved, never a courier guarantee.
 */
export function addWorkingDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let left = Math.max(0, Math.floor(days));
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

export function estimatedArrival(from: Date, productionDays: number, deliveryMaxDays: number): string {
  return addWorkingDays(from, productionDays + deliveryMaxDays).toISOString().slice(0, 10);
}
