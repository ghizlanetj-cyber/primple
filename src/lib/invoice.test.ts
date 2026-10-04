import { describe, expect, it } from "vitest";
import { paymentSummary } from "@/lib/invoice";

const base = { paymentStatus: "unpaid" as const, depositPaid: false, depositAmount: 0, total: 200, status: "Order placed" as const };

describe("paymentSummary", () => {
  it("never calls a 50% advance a full payment", () => {
    const s = paymentSummary({ ...base, paymentMethod: "deposit_50_cod", depositPaid: true, depositAmount: 100 }, "fr");
    expect(s.label).toBe("Avance de 50 % reçue");
    expect(s.received).toBe(100);
    expect(s.balance).toBe(100);
  });
  it("marks manual payments as pending confirmation", () => {
    expect(paymentSummary({ ...base, paymentMethod: "bank_transfer" }, "fr").label).toContain("confirmation du paiement en attente");
  });
  it("shows full card payment with no balance", () => {
    const s = paymentSummary({ ...base, paymentMethod: "card_youcanpay", paymentStatus: "paid" }, "en");
    expect(s.label).toBe("Paid in full");
    expect(s.balance).toBe(0);
  });
});
