# Money OS Core Architecture

## System boundary

M0.1 is a deterministic, simulator-first planning system. It must not move real customer funds.

```text
User
  ↓
Navigator UI
  ↓
Intent normalization
  ↓
Validation
  ↓
Plan generation
  ├── FX engine
  ├── Fee engine
  └── Route engine
          ↓
      Money Graph
          ↓
   Risk / policy boundary
          ↓
   Provider simulator
          ↓
 Timeline + Receipt
```

## Domain flow

`MoneyIntent → MoneyPlan → MoneyExecution → MoneyTimeline → MoneyReceipt`

One intent may create multiple plans, and one plan may contain multiple execution steps. Split operations create child intents. Schedules create future intents without directly executing them in M0.1.

## Financial primitives

- HOLD
- MOVE
- CONVERT
- SEND
- RECEIVE
- PAY
- SCHEDULE
- SPLIT

## State model

```text
DRAFT → READY → APPROVED → EXECUTING → COMPLETED
                         ↘ USER_ACTION_REQUIRED
EXECUTING → FAILED → RETRY / ROUTE_SWITCH / WAIT / REFUND
```

State transitions must be explicit and validated. UI code must not mutate financial state directly.

## Calculation rule

All authoritative money calculations have one source of truth. Amounts must use decimal-safe arithmetic, never ordinary binary floating-point arithmetic for financial results.

## Provider abstraction

The core engine knows provider capabilities, quotes, limits, routes, and status through interfaces. The simulator implements those interfaces in M0.1. Real provider adapters are a later phase and must sit behind the same boundary.

## AI boundary

AI can convert natural-language requests into candidate intent data and explain deterministic results. It cannot be the source of truth for rates, fees, balances, limits, authorization, execution state, or settlement.
