# Money OS Security Boundary

M0.1 is simulation-only. No customer funds, bank credentials, payment credentials, or provider production secrets belong in the repository.

## Rules

1. Never place provider secrets in client-side code.
2. Never trust client-provided balances, fees, rates, route availability, or transaction state.
3. Use idempotency keys for every future execution request.
4. Treat financial state transitions as explicit server-side operations.
5. Keep an append-only audit trail for future real-money operations.
6. Separate identity, authorization, risk, execution, and reconciliation responsibilities.
7. Require explicit user authorization before any real-money operation.
8. AI output is untrusted input and must be validated before it becomes a MoneyIntent.
9. Real-money features require threat modeling, fraud controls, compliance review, regulated partners/licensing, reconciliation, and incident response before launch.

## Data minimization

M0.1 should use synthetic identities and synthetic transactions. Production integrations must collect only the data required for the specific regulated service and jurisdiction.
