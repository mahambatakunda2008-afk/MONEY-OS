import type { MoneyGraph } from "./index";

export const demoMoneyGraph: MoneyGraph = {
  providers: [
    { id: "sim-alpha", name: "Alpha Sim", active: true, countries: ["ZW", "ZA", "GB", "US"], currencies: ["USD", "ZAR", "GBP", "ZWG"] },
    { id: "sim-beta", name: "Beta Sim", active: true, countries: ["ZW", "ZA", "GB", "US"], currencies: ["USD", "ZAR", "GBP", "ZWG"] },
    { id: "sim-gamma", name: "Gamma Sim", active: true, countries: ["ZW", "ZA", "GB", "US"], currencies: ["USD", "ZAR", "GBP", "ZWG"] },
  ],
  nodes: [
    { id: "currency-usd", type: "CURRENCY", currency: "USD" },
    { id: "currency-zar", type: "CURRENCY", currency: "ZAR" },
    { id: "currency-gbp", type: "CURRENCY", currency: "GBP" },
    { id: "currency-zwg", type: "CURRENCY", currency: "ZWG" },
    { id: "country-zw", type: "COUNTRY", country: "ZW" },
    { id: "country-za", type: "COUNTRY", country: "ZA" },
    { id: "country-gb", type: "COUNTRY", country: "GB" },
    { id: "country-us", type: "COUNTRY", country: "US" },
  ],
  routes: [
    { id: "alpha-usd-zar", providerId: "sim-alpha", name: "Alpha USD → ZAR", sourceCurrency: "USD", destinationCurrency: "ZAR", cost: { amount: "7.40", currency: "USD" }, estimatedArrivalMinutes: 20, reliabilityScore: 0.98, active: true },
    { id: "beta-usd-zar", providerId: "sim-beta", name: "Beta USD → ZAR", sourceCurrency: "USD", destinationCurrency: "ZAR", cost: { amount: "4.10", currency: "USD" }, estimatedArrivalMinutes: 90, reliabilityScore: 0.99, active: true },
    { id: "gamma-usd-zar", providerId: "sim-gamma", name: "Gamma USD → ZAR", sourceCurrency: "USD", destinationCurrency: "ZAR", cost: { amount: "2.90", currency: "USD" }, estimatedArrivalMinutes: 300, reliabilityScore: 0.95, active: true },
    { id: "alpha-usd-usd", providerId: "sim-alpha", name: "Alpha USD domestic", sourceCurrency: "USD", destinationCurrency: "USD", cost: { amount: "3.00", currency: "USD" }, estimatedArrivalMinutes: 10, reliabilityScore: 0.99, active: true },
    { id: "beta-usd-usd", providerId: "sim-beta", name: "Beta USD domestic", sourceCurrency: "USD", destinationCurrency: "USD", cost: { amount: "1.50", currency: "USD" }, estimatedArrivalMinutes: 25, reliabilityScore: 0.995, active: true },
  ],
};
