import { describe, expect, it } from "vitest";
import { demoMoneyGraph } from "./demo-graph";
import { findRoutes } from "./index";

describe("demo money graph", () => {
  it("finds active USD to ZAR routes for Zimbabwe to South Africa", () => {
    const routes = findRoutes(
      demoMoneyGraph,
      { country: "ZW", currency: "USD" },
      { country: "ZA", currency: "ZAR" },
    );

    expect(routes.map((route) => route.id)).toEqual([
      "alpha-usd-zar",
      "beta-usd-zar",
      "gamma-usd-zar",
    ]);
  });

  it("does not return inactive or unsupported routes", () => {
    const routes = findRoutes(
      { ...demoMoneyGraph, routes: demoMoneyGraph.routes.map((r) => r.id === "beta-usd-zar" ? { ...r, active: false } : r) },
      { country: "ZW", currency: "USD" },
      { country: "ZA", currency: "ZAR" },
    );

    expect(routes.map((route) => route.id)).not.toContain("beta-usd-zar");
  });
});
