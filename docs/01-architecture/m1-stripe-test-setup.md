# M1 Stripe Test Mode Setup

Status: `DEPLOYED_FOR_FOUNDER_TEST`

Last updated: 2026-08-11

Production Test Mode deployment:

- Stripe account: `acct_1U35I2K1UJsctvou` (`Pairvu`)
- Worker version: `9d870e51-6ced-43ca-894e-f1fdac2a6ee7`
- D1 migration: `0009_stripe_billing.sql` applied
- Webhook endpoint: `we_1U35jkK1UJsctvouodLHF9rn`
- Webhook URL: `https://pairvu.com/api/billing/webhook`
- Customer Portal configuration: `bpc_1U35qOK1UJsctvoufNVAUSzu`
- Checkout access: restricted by the `STRIPE_TESTER_EMAILS` Worker secret
- Live payments remain disabled pending founder acceptance.

## Boundary

This phase uses Stripe Test Mode only. Do not enable live payments until subscribe,
renew, payment-failure, cancellation, webhook replay, credits, and retention all
pass founder verification.

## Products And Monthly Prices

Create three recurring monthly prices in Stripe Test Mode:

| Product | Price | Included checks | Retention |
| --- | ---: | ---: | ---: |
| Pairvu Starter | USD 19/month | 150 | 30 days |
| Pairvu Growth | USD 49/month | 600 | 30 days |
| Pairvu Agency | USD 99/month | 1,500 | 30 days |

Test Mode Stripe objects in the Pairvu account:

| Plan | Product ID | Price ID |
| --- | --- | --- |
| Starter | `prod_V3BuRSaq4CUjF9` | `price_1U35YlK1UJsctvoueIcIpZr3` |
| Growth | `prod_V3BuQCBsxJ2zjX` | `price_1U35YlK1UJsctvou7ZnB1USO` |
| Agency | `prod_V3BuRMYp1ejq5j` | `price_1U35YlK1UJsctvouKZXXKcVk` |

Free remains internal at 10 checks per UTC calendar month and 7-day image retention.

## Required Variables

Configure these locally in `.dev.vars` and in the production Worker secrets or
variables. Never commit their real values.

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_AGENCY=price_...
STRIPE_TESTER_EMAILS=founder@example.com
```

## Local Webhook Test

1. Run `pnpm run db:migrate:local`.
2. Run `stripe login` once if the CLI is not authenticated.
3. Start Pairvu with `pnpm run dev`.
4. In another terminal run:

```bash
stripe listen --forward-to http://localhost:3000/api/billing/webhook
```

5. Put the displayed `whsec_...` value in `.dev.vars`, then restart Pairvu.
6. Sign in, open `/account`, choose Starter, and use card `4242 4242 4242 4242`
   with any future expiry and CVC.
7. Confirm the account shows Starter, 150 checks, and 30-day retention.
8. Open Manage billing and verify the Customer Portal loads.

## Production Webhook

After local success, add an endpoint in Stripe Test Mode:

```text
https://pairvu.com/api/billing/webhook
```

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy that endpoint's signing secret into production `STRIPE_WEBHOOK_SECRET`.

## Founder Acceptance Matrix

| Scenario | Expected |
| --- | --- |
| First paid checkout | Plan, monthly allowance, and 30-day retention update |
| Duplicate webhook delivery | No duplicate credit grant |
| Upgrade | Allowance changes once for the Stripe period |
| Payment failure | Account shows payment attention; checks are blocked until active |
| Customer Portal | Payment method, plan, and cancellation controls open |
| Cancellation at period end | Paid access remains until Stripe reports cancellation |
| Final cancellation | Workspace returns to Free and 7-day retention |
| Signed-out access | Checkout and portal return authentication required |

Existing retained assets are not retroactively deleted on plan change. New
retention applies to new assets; scheduled deletion continues to honor each
asset's persisted expiry.
## M1-2 Founder Acceptance

The production Test Mode walkthrough passed on 2026-08-11:

- Starter checkout activated the Pairvu workspace at 150 monthly checks;
- one completed paid analysis settled exactly one check;
- the resulting balance was 149 available, 1 used, and 0 reserved;
- the workspace received 30-day retention for new uploads;
- Stripe Customer Portal access worked;
- signing out removed workspace result access and signing back in restored account state.

Run the read-only operator report with:

```bash
pnpm run audit:m1:billing
```

The first four result sets should contain zero rows. The final result set is an
operational summary by plan and subscription status. The command never updates
production data. In CI or another non-interactive shell, set a Cloudflare API
token with D1 read access as `CLOUDFLARE_API_TOKEN` before running it. Interactive
Wrangler OAuth may be used from a normal terminal.
