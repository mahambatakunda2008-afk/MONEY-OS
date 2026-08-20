import { describe, expect, it } from "vitest";
import { addDecimal, compareDecimal } from "../packages/money-core/src/decimal";
import { assertTransition, canTransition } from "../packages/money-core/src/index";

describe("decimal arithmetic", () => {
  it("adds decimal values without floating point drift", () => {
    expect(addDecimal("0.1", "0.2")).toBe("0.3");
    expect(addDecimal("10.25", "2.75")).toBe("13.00");
  });

  it("compares decimals by value", () => {
    expect(compareDecimal("10.10", "10.1")).toBe(0);
    expect(compareDecimal("9.99", "10")).toBe(-1);
  });
});

describe("money state machine", () => {
  it("allows the normal settlement path", () => {
    expect(canTransition("AVAILABLE", "RESERVED")).toBe(true);
    expect(canTransition("RESERVED", "PENDING")).toBe(true);
    expect(canTransition("PENDING", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "COMMITTED")).toBe(true);
    expect(canTransition("COMMITTED", "SETTLED")).toBe(true);
  });

  it("rejects impossible terminal transitions", () => {
    expect(canTransition("SETTLED", "AVAILABLE")).toBe(false);
    expect(() => assertTransition("SETTLED", "PENDING")).toThrow();
  });
});
