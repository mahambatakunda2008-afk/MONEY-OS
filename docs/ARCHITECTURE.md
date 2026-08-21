# Shadecode Money Architecture

## System boundary

Shadecode Money is designed as a provider-agnostic money orchestration system. The customer-facing product is for real-money workflows; the simulator is developer-only infrastructure and is never a source of customer balances or settlement truth.

```text
User
  ↓
Navigator UI
  ↓
Intent normalization
  ↓
Validation + identity + policy
  ↓
Quote / FX / fee calculation
  ↓
Route engine
  ↓
Payment Orchestrator
  ├── Mobile money providers
  ├── Bank providers
  ├── Card providers
  ├── QR / merchant providers
  └── Future rails
          ↓
     Provider API
          ↓
   Signed provider webhook
          ↓
  Normalization + idempotency
          ↓
   Reconciliation boundary
          ↓
      Double-entry ledger
          ↓
       Wallet state
```

Provider credentials, webhook secrets and service-role credentials are server-side only. The browser never talks directly to provider APIs and never writes authoritative financial state.

## Domain flow

`MoneyIntent → MoneyPlan → Authorization → SettlementAttempt → ProviderEvent → Reconciliation → Ledger → Receipt`

An intent may produce multiple candidate plans. A selected plan produces one or more settlement attempts. Provider events are normalized before they can affect transaction state.

## Financial primitives

- HOLD
- MOVE
- CONVERT
- SEND
- RECEIVE
- PAY
- SCHEDULE
- SPLIT
- REFUND

## State model

```text
PENDING
   ↓
AUTHORIZED
   ↓
COMMITTED
   ↓
SETTLED

AUTHORIZED → RELEASED
AUTHORIZED → FAILED
COMMITTED  → FAILED / REFUNDED
FAILED     → RETRY / ROUTE_SWITCH / REFUND
```

Every transition is explicit and validated. UI code cannot mutate financial state directly.

## Provider orchestration

`PaymentOrchestrator` selects an eligible rail and dispatches a `PaymentInstruction` to a registered provider adapter. `SettlementAdapterRegistry` verifies webhook signatures and converts provider-specific payloads into a normalized `NormalizedProviderEvent`.

Providers are intentionally adapters. Adding another provider must not require rewriting the Send UI, wallet accounting or transaction state machine.

## Multi-provider routing

The route engine considers:

- country
- currency
- operation capability
- provider availability
- fees
- FX
- reliability
- limits
- risk policy
- customer/provider eligibility

The rail model supports BANK, CARD, MOBILE_MONEY, QR, CASH and OTHER rail types.

## Reconciliation

A provider saying `SUCCESS` is not itself a ledger mutation. Shadecode must verify the event, enforce idempotency, match it to the settlement/transaction, validate the amount/currency/reference, and only then apply the authoritative ledger transition.

## Simulation

The existing simulator package remains useful for automated tests and developer workflows, but it is not exposed as the production money source. The simulator is separated from the core provider boundary so production adapters can use the same contracts without pretending simulated money is real.

## Security boundary

- provider secrets: server-side only
- webhook secrets: server-side only
- Supabase service-role key: server-side only
- publishable Supabase key: browser-safe
- idempotency: mandatory for money mutations
- webhook signatures: mandatory before reconciliation
- ledger mutations: server/database boundary only

## AI boundary

AI can convert natural-language requests into candidate intent data and explain deterministic results. It cannot be the source of truth for balances, rates, fees, limits, authorization, provider events, execution state or settlement.
