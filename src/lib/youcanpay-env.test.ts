import { describe, expect, it } from "vitest";

import { keyEnvironment, pairEnvironment } from "./youcanpay-env";

describe("YouCan Pay key environment", () => {
  it("classifies sandbox and live prefixes", () => {
    expect(keyEnvironment("pub_sandbox_x", "pub")).toBe("sandbox");
    expect(keyEnvironment("pri_sandbox_x", "pri")).toBe("sandbox");
    expect(keyEnvironment("pub_x", "pub")).toBe("live");
    expect(keyEnvironment("pri_x", "pri")).toBe("live");
    expect(keyEnvironment("pri_x", "pub")).toBeNull();
    expect(keyEnvironment(undefined, "pri")).toBeNull();
  });

  it("returns the shared environment for a matching pair", () => {
    expect(pairEnvironment("pub_sandbox_a", "pri_sandbox_b")).toBe("sandbox");
    expect(pairEnvironment("pub_a", "pri_b")).toBe("live");
  });

  it("refuses mixed or missing keys", () => {
    expect(() => pairEnvironment("pub_a", "pri_sandbox_b")).toThrow(/different environments/);
    expect(() => pairEnvironment("pub_sandbox_a", "pri_b")).toThrow(/different environments/);
    expect(() => pairEnvironment(undefined, "pri_b")).toThrow(/not configured/);
  });
});
