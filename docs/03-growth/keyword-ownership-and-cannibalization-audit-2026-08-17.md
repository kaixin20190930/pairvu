# Pairvu Keyword Ownership And Cannibalization Audit

Status: `ACTIVE`

Audit date: 2026-08-17

Scope: all published SEO routes in the Pairvu content registry

## 1. Audit Result

The current published architecture has one owner for each major intent:

| Intent layer | Owner | Must not be duplicated by |
| --- | --- | --- |
| Brand and product tool | `/` | checker synonym pages |
| AI product photography market | `/ai-product-photography` | category or guide pages |
| Attribute evaluation | `/checks/*` | examples or category pages |
| Controlled failure evidence | `/examples/*` | check or category definitions |
| Product-family workflow | `/categories/*` | attribute pages |
| Audience/platform workflow | `/use-cases/*` | homepage positioning |
| Review method | `/guides/*` | check pages |

The automated inventory contains 55 published canonical routes. Titles, H1s,
descriptions, primary keywords, and intent statements are unique. The semantic
overlap report found no published pair at or above the 0.62 review threshold.

One exact overlap was discovered and corrected during this audit: the broad
phrase `AI product color comparison` appeared on both the Product Color check
page and a laundry-pouch example. The check page keeps the broad attribute
intent; the example now owns the concrete case phrase `laundry pods pouch color
changed`.

## 2. GSC-Led Corrections

Early Search Console impressions showed Product Logo and Product Color pages
for discovery-like wording. Pairvu is not a reverse-image logo search, unknown
brand identifier, or single-image color detector. Their metadata and direct
answers now state the actual two-image job:

- `/checks/product-logo` owns comparing an approved product logo with an AI
  candidate and checking whether AI changed it;
- `/checks/product-color` owns comparing approved product color with an AI
  candidate while separating genuine changes from lighting, reflections, and
  insufficient coverage.

The qualification is intentional. It may reduce irrelevant impressions while
improving Google's understanding of Pairvu's reference-to-candidate workflow.

## 3. Page-Family Rules

### Homepage

Owns `Pairvu` and `AI product image checker`. Improve the homepage when a
checker synonym gains impressions. Never create a second tool page for the same
job.

### Check pages

Own broad attribute questions such as product logo, label text, quantity,
color, packaging, components, and observability. They explain the decision
method across product families.

### Example pages

Own one concrete controlled comparison. Their keyword must include the changed
object or case, not repeat the parent check page's broad keyword.

### Category pages

Own category-specific workflows and failure priorities. They must not merely
replace a product noun in a common template. Each published page must pass the
category quality standard and have unique controlled evidence.

### Guides and use cases

Guides own a repeatable task. Use cases own how a team or platform applies that
task. They do not create new product capabilities or certification claims.

## 4. New URL Admission Checklist

Every proposed public URL must answer all fields before implementation:

| Field | Required answer |
| --- | --- |
| User job | A concrete question or task different from every published page |
| Primary keyword | One phrase with a recorded owning URL |
| Parent | The hub or pillar that gives the page context |
| Evidence | First-party comparison, product behavior, or official source |
| Unique value | Information unavailable from the parent and sibling pages |
| Product support | Pairvu can perform the described check today |
| Internal links | Parent, two relevant siblings, and checker action |
| Metadata | Unique title, description, H1, canonical, and intent statement |
| Publication gate | Founder approval plus automated inventory checks |

If the proposal fails any field, keep it `planned` and `noindex`, consolidate it
into an existing page, or reject it.

## 5. Controlled Category Expansion

The five M0 category flagships already cover the supported broad CPG boundary.
The next candidates are narrower workflows, not sixth, seventh, or eighth broad
categories:

| Candidate | Parent | Distinct user job | Evidence required before indexation |
| --- | --- | --- | --- |
| Skincare product image QA | Cosmetics | Protect active/variant text, volume, dropper/pump, and small label detail | Three unique pairs: meaningful FAIL, hard-negative PASS, observability REVIEW |
| Beverage can image QA | Beverages | Protect flavor/capacity text, can color, reflections, and multipack count | Three unique pairs: meaningful FAIL, hard-negative PASS, observability REVIEW |
| Cleaning product image QA | Household packaged goods | Protect trigger/nozzle, capacity, front/back label, and bottle coverage | Three unique pairs: meaningful FAIL, hard-negative PASS, observability REVIEW |

These routes must remain absent from the sitemap until their evidence is not
reused by a parent category page and the full quality gate passes.

## 6. Continuous Checks

Run before publication:

```bash
pnpm run test:seo
pnpm run seo:overlap-report
```

The first command blocks exact ownership and metadata collisions. The second is
a review aid for high semantic overlap. A clean report reduces risk but does not
replace intent review using Search Console query-to-page data.
