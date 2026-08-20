import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { executeInternalSettlement } from "../packages/simulator/src/internal-provider";

describe("provider event contract", () => {
  it("produces a stable payload hash for webhook ingestion", () => {
    const result = executeInternalSettlement(
      "contract-1",
      {
        id: "internal-route",
        providerId: "INTERNAL",
        name: "Shadecode Internal",
        cost: { amount: "0", currency: "USD" },
        estimatedArrivalMinutes: 0,
        reliabilityScore: 1,
        quote: {
          id: "internal-quote",
          source: { amount: "100", currency: "USD" },
          destination: { amount: "100", currency: "USD" },
          exchangeRate: "1",
          fees: {
            provider: { amount: "0", currency: "USD" },
            network: { amount: "0", currency: "USD" },
            platform: { amount: "0", currency: "USD" },
            total: { amount: "0", currency: "USD" },
          },
          effectiveRate: "1",
          expiresAt: "2099-01-01T00:00:00.000Z",
          providerId: "INTERNAL",
          routeId: "internal-route",
        },
      },
      { amount: "100", currency: "USD" },
    );
    const event = result.events.at(-1);
    expect(event).toBeDefined();
    const canonical = JSON.stringify(event?.payload);
    expect(createHash("sha256").update(canonical).digest("hex")).toHaveLength(64);
    expect(event?.providerId).toBe("INTERNAL");
    expect(event?.providerReference).toBe("internal_contract-1");
  });
});
