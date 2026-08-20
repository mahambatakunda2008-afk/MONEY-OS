# MONEY OS

A simulator-first financial intelligence platform for planning, comparing, routing, and explaining money movement across currencies and providers.

> **M0.1 is simulation only. No real-money execution.**

## Core idea

**The user chooses the outcome. The system handles the complexity. The user retains control.**

Money OS models financial intent as:

`Intent → Plan → Quote → Route → Execution → Timeline → Receipt`

The first release focuses on deterministic financial logic, provider simulation, route comparison, holds, plans, schedules, splits, and recovery scenarios.

## Safety boundary

AI may interpret natural-language requests and explain system decisions, but it does not invent rates, calculate authoritative balances, authorize transactions, or execute money movement. Real-money functionality requires appropriate regulated partners, controls, licensing, and compliance review.

## Repository structure

- `packages/money-core` - domain contracts and state machine
- `packages/fx-engine` - deterministic FX calculations
- `packages/fee-engine` - fee calculation
- `packages/money-graph` - currencies, providers, rails, and routes
- `packages/route-engine` - route scoring and recommendation
- `packages/intent-engine` - intent normalization and validation
- `packages/simulator` - synthetic providers and execution simulation
- `apps/navigator` - first user-facing Money Navigator
- `tests` - domain, integration, property, and scenario tests
- `docs` - architecture, security, regulatory boundary, and roadmap

## M0.1 acceptance scenarios

1. Send enough money so Mum receives $300.
2. Convert $500 USD to ZAR.
3. Hold $200 for emergencies.
4. Plan a hotel payment in South Africa.
5. Schedule a monthly $300 transfer.
6. Split $1,000 between multiple recipients.
7. Plan £5,000 for university by a deadline.
8. Choose the cheapest route.
9. Choose the fastest route.
10. Recover from a simulated provider failure.
