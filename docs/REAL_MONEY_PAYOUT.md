# Real-Money Payout Activation

## Server-side Supabase functions

The live payout path is now split into three boundaries:

- `money-settlement-dispatch-v4` authenticates the customer, creates the settlement attempt, then invokes the trusted worker.
- `money-provider-worker-v4` is service-role-only and calls the external payout provider.
- `money-provider-status-v1` is service-role-only and reconciles Paynow disbursement status using the provider's documented disbursement list endpoint.

## Paynow Disbursement API

Paynow's current public Disbursement API documentation shows:

- `POST /api/login` for a bearer token.
- `POST /api/disbursement` to create a disbursement.
- `GET /api/disbursements` to retrieve disbursements for a date range.
- Channels including EcoCash, OneMoney, Telecash, Omari, InnBucks and CBZ.
- Provider statuses `Pending`, `Processing`, `Flagged`, `Success`, and `Failed`.

Shadecode maps those provider states into its internal settlement states. The provider's public documentation should remain the source of truth for production credentials, channel names and account eligibility.

## Supabase Edge Function secrets

Configure these as **Supabase Edge Function secrets**, not browser or `NEXT_PUBLIC_*` variables:

- `PAYNOW_DISBURSEMENT_BASE_URL`
- `PAYNOW_DISBURSEMENT_EMAIL`
- `PAYNOW_DISBURSEMENT_PASSWORD`
- `PAYNOW_DISBURSEMENT_SOURCE_ACCOUNT`
- `PAYNOW_DISBURSEMENT_CHANNEL`

`SUPABASE_SERVICE_ROLE_KEY` is already used only by trusted server-side functions. It must never be exposed to the browser.

## Production activation checklist

1. Obtain Paynow Disbursement production merchant access.
2. Confirm the production base URL supplied for the merchant account.
3. Confirm the permitted source account.
4. Confirm which channels and currencies are enabled.
5. Configure the secrets above.
6. Enable only the corresponding `money_provider_adapters` / `money_rails` records.
7. Run a controlled low-value live verification.
8. Verify the provider reference appears in the settlement attempt.
9. Verify status reconciliation changes the attempt and settlement correctly.
10. Verify failure releases the reserved funds and records the failure.

Until these credentials and provider approvals are configured, the system fails closed with `Paynow disbursement is not configured` rather than silently using simulation.
