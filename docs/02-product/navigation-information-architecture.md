# Pairvu Navigation And Information Architecture

Status: `ACTIVE_STANDARD`

Last updated: 2026-08-14

## 1. Objective

Pairvu has two different navigation jobs:

1. help a public visitor understand the product and reach the checker;
2. help an authenticated user operate a workspace.

These jobs must not be mixed into one flat list. Public content taxonomy belongs
to the marketing navigation. Repeated work, saved results, billing, and future
workflow features belong to the workspace navigation.

## 2. Global Navigation

The persistent public header is:

```text
Pairvu | Product | Learn | Solutions | Account | Check image
```

### Product

- How Pairvu works
- Product checks
- Batch checking

### Learn

- AI product photography
- Comparison examples
- Guides

### Solutions

- Product categories
- Use cases

`Check image` is the only primary header action. `Account` becomes `Sign in`
when no authenticated session exists. Mobile uses an explicit Menu control and
an in-flow expanded panel; the header must never require horizontal scrolling.

## 3. Workspace Navigation

The signed-in workspace currently uses:

```text
Overview | Batches | New batch
```

Single-image checking is not repeated here because it is already the persistent
global action. Batch history is named `Batches` because the destination includes
active, completed, canceled, and failed batches rather than history alone.

Future capabilities are added here only after their product gate is approved:

```text
M2: Products
M3: Rankings
M4: Rules
M6: Monitoring
```

They must not be added to the global header merely because they appear on the
roadmap.

## 4. Breadcrumb Rules

Breadcrumbs communicate hierarchy, not the current tab twice.

- No breadcrumb on workspace Overview.
- No breadcrumb on the Batches index.
- No breadcrumb on New batch.
- A saved batch detail uses `Batches / Batch status`.
- Future product detail uses `Products / Product name`.
- Future nested rule detail uses `Rules / Rule set / Rule`.

Public SEO pages retain visible breadcrumbs and matching `BreadcrumbList`
structured data because their content hierarchy is useful to readers and search
engines.

## 5. Route Ownership

| User intent | Route family | Navigation owner |
| --- | --- | --- |
| Run a single check | `/#checker` | Global primary action |
| Understand checks | `/checks/*` | Product |
| Run/review batches | `/account/batches/*` | Product entry + workspace |
| Learn from evidence | `/examples/*` | Learn |
| Learn workflows | `/guides/*`, `/ai-product-photography` | Learn |
| Find category/platform fit | `/categories/*`, `/use-cases/*` | Solutions |
| Manage plan and history | `/account` | Workspace |

## 6. UX And Accessibility Gates

- No horizontal page or navigation overflow at 390px.
- Menu, account links, tabs, and CTAs have at least 44px mobile targets.
- Menu state exposes `aria-expanded` and references its controlled panel.
- Active workspace location uses `aria-current="page"`.
- Keyboard focus remains visible.
- All destinations remain ordinary crawlable links; menus do not hide routes
  behind JavaScript-only navigation.
- The global header should remain stable as content pages grow. New SEO pages
  join an existing hub instead of becoming new top-level links.

## 7. Change Boundary

Adding a new top-level global item requires a distinct, durable user intent that
cannot fit Product, Learn, Solutions, Account, or the primary checker action.
Adding a workspace item requires a shipped capability with a repeat-use job.
Neither SEO page count nor an unvalidated roadmap idea is sufficient.
