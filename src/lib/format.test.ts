import { afterEach, describe, expect, it } from "vitest";
import { mad, madOffer, setMoneyLocale } from "./format";

afterEach(() => setMoneyLocale("fr"));

describe("compact offer money", () => {
  it("omits decimals only for whole MAD amounts", () => {
    setMoneyLocale("en");
    expect(madOffer(60)).toBe("60 MAD");
    expect(madOffer(60.25)).toBe("60.25 MAD");
    expect(madOffer(1.6)).toBe("1.60 MAD");
  });

  it("keeps checkout amounts at two decimals", () => {
    setMoneyLocale("en");
    expect(mad(60)).toBe("60.00 MAD");
    expect(madOffer(60.256)).toBe("60.26 MAD");
  });
});