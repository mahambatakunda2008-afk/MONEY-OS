import { describe, expect, it } from "vitest";
import { ProviderRegistry, validateProviderResult, type PaymentRailProvider } from "../packages/money-core/src/providers";

const provider: PaymentRailProvider = { id: "bank-demo", railType: "BANK", execute: async () => ({ status: "ACCEPTED", providerReference: "p-1" }) };

describe("payment providers", () => {
  it("registers and resolves providers", () => {
    const registry = new ProviderRegistry();
    registry.register(provider);
    expect(registry.get("bank-demo")).toBe(provider);
  });
  it("rejects duplicate provider IDs", () => {
    const registry = new ProviderRegistry();
    registry.register(provider);
    expect(() => registry.register(provider)).toThrow("already registered");
  });
  it("requires references for accepted results", () => {
    expect(() => validateProviderResult({ status: "ACCEPTED" })).toThrow("provider reference");
    expect(validateProviderResult({ status: "PENDING" }).status).toBe("PENDING");
  });
});
