# Pairvu Check Page Quality Standard

Status: `ACTIVE`

Owner: Founder / Product / Growth

Effective date: 2026-08-03

## Purpose

Check pages answer one high-intent product-review question across categories. They are not example pages, category pages, generic articles, or alternate versions of the homepage checker.

The page family uses `/checks/<attribute>` and helps a reviewer decide:

- what the attribute means in a product-image approval workflow;
- which visible facts are required;
- when the evidence supports PASS, REVIEW, or FAIL;
- how to distinguish the attribute from adjacent concepts;
- what corrective action follows each result.

Every proposed check page defaults to `planned` and `indexable: false`. Publication requires this standard, `pnpm run test:check-content`, founder approval, and verified public evidence.

## Intent Boundaries

| Page family | Question answered |
| --- | --- |
| Homepage | Can I compare my two images now? |
| Example | What happened in this one controlled pair? |
| Category | What must remain faithful for this product category? |
| Guide | How do I run a broader review workflow? |
| Check | How should this one visible attribute be evaluated across products? |
| Use case | Where does Pairvu fit for this team or publishing context? |

A check page must not target a synonym of `AI product image checker`. It must own a narrower attribute-level intent such as product quantity, label text, packaging, logo, color, components, or observability.

## Mandatory Content

| Requirement | Minimum |
| --- | ---: |
| Explicit user and decision job | 1 |
| Direct answer near the top | 1 |
| Scope and adjacent-concept distinction | 1 |
| Attribute model or diagnostic dimensions | 4 |
| PASS / REVIEW / FAIL decision rows | 6 |
| Controlled evidence cases | 4 |
| Product-change evidence | 1 |
| Harmless hard-negative evidence | 1 |
| Observability evidence | 1 |
| PASS / REVIEW / FAIL represented in evidence | all 3 |
| Diagnostic questions | 5 |
| Common failure modes with consequence | 5 |
| Operational workflow steps | 5 |
| Explicit limitations | 6 |
| Attribute-specific FAQs | 5 |
| Structured English content | 1,500 words |

The word threshold is a floor for useful structured material, not a writing target. Repetition, keyword padding, generic AI background, and lightly rewritten category copy do not count as quality.

Published check manifests must remain below 55% pairwise lexical overlap, may share at most one controlled evidence case with another check page, and may not reuse diagnostic-dimension or insight titles. The cross-family role of a check page permits it to cite category and example evidence, but its explanation must synthesize a reusable decision model rather than restate case-page copy.

## Evidence Standard

Each evidence case must link to an existing published Pairvu example and checked local image assets. The page must state:

1. what is directly observable;
2. which attribute layer changed or stayed stable;
3. the real Pairvu or founder-approved decision;
4. why the result is not another verdict;
5. the next operational action.

The evidence set must include multiple products or multiple distinct conditions where available. One case cannot be presented as proof of broad accuracy, a commercial SLA, or marketplace compliance.

## Required Page Order

1. Attribute promise, user, direct answer, and checker action.
2. Attribute model that separates commonly confused concepts.
3. Observable-input requirements and diagnostic questions.
4. Attribute-level PASS / REVIEW / FAIL matrix.
5. Controlled evidence covering product change, hard negative, and observability.
6. Common failure modes and operational consequences.
7. Resolution workflow for PASS, REVIEW, and FAIL.
8. Explicit product, compliance, and technical boundaries.
9. Attribute-specific FAQ and final checker action.

## Internal Linking Rules

- `/checks` links to every published check page.
- Each check page links to the exact examples used as evidence.
- Relevant category pages may link to a check page where it deepens one attribute.
- Example pages may link upward to one check page that explains the reusable rule.
- Guides may link to check pages from the relevant checklist step.
- Check pages link to the live checker, examples hub, at least one category, and one workflow guide.
- Do not create reciprocal boilerplate blocks on every page. Links must sit next to the decision they clarify.

## GEO Requirements

The first screen must contain a concise, quotable answer to the page question. Tables and lists should use explicit terms rather than unexplained internal taxonomy. Every factual product-behavior statement must be traceable to visible controlled evidence or documented product rules. Pages must state what Pairvu cannot infer from hidden, unreadable, or non-corresponding regions.

## Non-Negotiable Boundaries

- Do not present a check page as a separate tool or imply that Pairvu uses a different analysis engine for that URL.
- Do not use arbitrary numeric scores as the primary answer.
- Do not claim legal, marketplace, regulatory, calibrated-color, barcode, ingredient, or physical-product certification.
- Do not convert hidden or unreadable information into a confirmed mismatch.
- Do not publish platform-plus-check or category-plus-check combinations until demand and unique evidence justify them.
- Do not index a route while its evidence, founder review, automated checks, or internal links are incomplete.

## Publication Workflow

1. Register the proposed route as `planned` and `indexable: false`.
2. Record the user job, direct answer, attribute model, evidence, and boundaries in `lib/seo/check-content.ts`.
3. Build a bespoke page from the structured manifest.
4. Run `pnpm run test:check-content`, `pnpm run test:seo`, and `pnpm run build`.
5. Complete desktop and mobile visual QA for tables, images, overflow, metadata, and structured data.
6. Record founder approval and switch the registry entry to `published` and `indexable: true`.
7. Deploy, verify canonical and sitemap inclusion, then request indexing.

## Initial Roadmap

| Check | Status | Evidence position |
| --- | --- | --- |
| Product quantity | `PUBLISHED` | Printed capacity, visible package count, repositioning, unreadable quantity |
| Product label text | `PUBLISHED` | Exact text change, identical baseline, partial coverage, viewpoint |
| Product packaging | `PUBLISHED` | Shape change, missing component, lighting hard negative, partial coverage |
| Product logo | `PUBLISHED / AWAITING DEPLOY` | Logo replacement FAIL, background PASS, shadow/reflection PASS, and partial-occlusion REVIEW; automated quality and responsive QA passed |
| Product color | `EVIDENCE GENERATION REQUIRED` | Color-only change correctly remains REVIEW under M0; add one mixed color-plus-variant FAIL and one reflection-limited color REVIEW before implementation |
| Observability | `PLANNED / NOINDEX` | Viewpoint, occlusion, unreadable text, partial product coverage |
