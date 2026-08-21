# Production Money Environment

## Browser-safe

Only these belong in the Navigator browser environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Server-only

Never expose these through `NEXT_PUBLIC_*`, client components, browser bundles or URLs:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MONEY_PROVIDER_WEBHOOK_SECRET`
- provider API keys/tokens
- provider integration IDs/keys
- signing keys
- encryption secrets
- reconciliation credentials

## Paynow

Paynow requires merchant integration credentials before live integration can be enabled. Store the integration ID/key server-side only. Paynow's official documentation describes server-to-server integration and explicitly warns that integration keys must not appear in client-visible pages or URLs.

Suggested server variables:

- `PAYNOW_INTEGRATION_ID`
- `PAYNOW_INTEGRATION_KEY`
- `PAYNOW_RESULT_URL`
- `PAYNOW_RETURN_URL`

## EcoCash

EcoCash production API access requires approved developer credentials. Store the production API credentials and callback verification material server-side only.

Suggested server variables:

- `ECOCASH_API_BASE_URL`
- `ECOCASH_API_KEY`
- `ECOCASH_BEARER_TOKEN`
- `ECOCASH_CALLBACK_SECRET`

Do not invent production credentials or treat a provider's public website as an API credential source.

## Activation rule

A provider adapter may be registered in production only when:

1. its credentials are present;
2. its webhook verification is configured;
3. its supported rails/currencies/countries are explicitly configured;
4. reconciliation is enabled;
5. the provider contract permits the intended operation (funding, payout, payment, refund, etc.);
6. a successful controlled live verification has been completed.

Until those conditions are satisfied, the route must remain unavailable for real-money execution rather than silently falling back to simulated money.
