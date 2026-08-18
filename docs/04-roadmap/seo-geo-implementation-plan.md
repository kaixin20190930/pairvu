# SEO And GEO Implementation Plan

Status: `IN_PROGRESS`

Last updated: 2026-08-18

Strategy:
[Pairvu SEO And GEO Strategy](../03-growth/seo-geo-strategy.md)

This is the execution and status source of truth for Pairvu organic
acquisition. Strategic decisions belong in the strategy document; task
transitions and evidence belong here.

## 1. Status Rules

Allowed values:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `DONE`
- `DEFERRED`

A task becomes `DONE` only when its acceptance evidence exists. Page count is
not progress; verified deliverables are progress.

## 2. Fixed Decisions

| Decision | Status |
| --- | --- |
| Homepage owns `AI product image checker` | `ACCEPTED` |
| `/ai-product-photography` is the market pillar | `ACCEPTED` |
| No same-intent checker synonym pages | `ACCEPTED` |
| Ecommerce is an acquisition use case, not the full brand | `ACCEPTED` |
| Real examples are the primary content and GEO evidence | `ACCEPTED` |
| SEO and GEO use one content architecture | `ACCEPTED` |
| Allow `OAI-SearchBot`; disallow `GPTBot` | `ACCEPTED` |
| Category and generator page expansion requires evidence | `ACCEPTED` |
| Attribute-level Check pages require a separate evidence and quality gate | `ACCEPTED` |

## 3. Release Gates

| Gate | Required evidence | Status |
| --- | --- | --- |
| SG-G0 Governance locked | Strategy, scope, keyword ownership, tracker | `DONE` |
| SG-G1 Technical foundation | Canonicals, registry, navigation, sitemap, robots, schema, crawl QA | `DONE` |
| SG-G2 Initial indexable release | Homepage, pillar, hubs, three real cases, checklist, two use cases | `DONE` |
| SG-G3 Measurement active | Search Console, Bing, analytics attribution, baseline report | `IN_PROGRESS` |
| SG-G4 Expansion authorized | Evidence and founder decision for each proposed cluster | `IN_PROGRESS` |

SG-G4 is open only for evidence-gated subcategory planning. It does not authorize
mass publishing or expansion beyond supported CPG products.

## 4. Workstream Summary

| Workstream | Status | Done | Active | Blocked | Not started | Deferred |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Governance | `DONE` | 3 | 0 | 0 | 0 | 0 |
| Keyword evidence | `IN_PROGRESS` | 3 | 0 | 1 | 0 | 0 |
| Technical foundation | `IN_PROGRESS` | 7 | 0 | 0 | 1 | 0 |
| Core pages and content | `IN_PROGRESS` | 8 | 0 | 0 | 1 | 2 |
| Indexing and launch QA | `IN_PROGRESS` | 0 | 1 | 0 | 3 | 0 |
| Measurement and iteration | `NOT_STARTED` | 0 | 0 | 1 | 4 | 0 |

## 5. Task Tracker

### Governance

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-G01 | P0 | `DONE` | Founder/Product | None | Brand, market, category, positioning, message, and action recorded |
| SG-G02 | P0 | `DONE` | Product/Growth | SG-G01 | Keyword ownership, IA, internal links, GEO, and boundaries accepted |
| SG-G03 | P0 | `DONE` | Product/Engineering | SG-G02 | Trackable implementation plan and release gates created |

### Technical Foundation

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-T01 | P0 | `DONE` | Engineering | SG-G02 | Homepage checker remains client-side while metadata and supporting sections render server-side; build and browser checks passed |
| SG-T02 | P0 | `DONE` | Engineering/Product | SG-T01 | Crawlable responsive header and footer implemented and route-audited |
| SG-T03 | P0 | `DONE` | Engineering | SG-T01 | Seven public routes have unique metadata and self-canonicals; inherited home canonical removed |
| SG-T04 | P0 | `DONE` | Engineering | SG-G02 | Typed registry records keyword ownership, hierarchy, publication status, and related routes |
| SG-T05 | P0 | `DONE` | Engineering | SG-T04 | Registry sitemap and robots implemented; APIs excluded, OAI Search allowed, GPTBot disallowed |
| SG-T06 | P0 | `DONE` | Engineering | SG-T04 | Organization/WebSite/WebApplication/Article schemas and matching breadcrumbs implemented |
| SG-T07 | P0 | `DONE` | Engineering | SG-T02 to SG-T06 | `pnpm run test:seo` validates inventory, duplicates, links, orphans, sitemap parity, and crawler policy |
| SG-T08 | P1 | `NOT_STARTED` | Engineering/Growth | Analytics baseline | Search/AI referral attribution and optional Bing IndexNow implemented without evidence payloads |

### Keyword Evidence

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-K01 | P0 | `DONE` | Growth/Product | SG-G02 | Dated SERP evidence and dominant page types recorded in `keyword-evidence-baseline-2026-07-29.md` |
| SG-K02 | P0 | `BLOCKED` | Founder/Growth | Keyword Planner/Trends access | No verified directional volume is available; market/language dimensions and required export fields are documented |
| SG-K03 | P1 | `DONE` | Growth/Product | SG-K01 | Baseline distinguishes generators, provenance checkers, marketplace preflight tools, and Pairvu's fidelity intent |
| SG-K04 | P0 | `DONE` | Product/Growth | SG-K01 to SG-K03 | Accepted ownership is encoded in the registry; ambiguous checker intent is qualified in titles and copy |

### Core Pages And Content

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-C01 | P0 | `DONE` | Product/Engineering | SG-T01 | Homepage owns category keyword; checker remains first and crawlable supporting content follows |
| SG-C02 | P0 | `DONE` | Growth/Product | SG-T02 to SG-T06 | `/ai-product-photography` market pillar is published with clear checker positioning |
| SG-C03 | P0 | `DONE` | Engineering/Product | SG-T04 | `/examples`, `/guides`, and `/use-cases` hubs are published and registered |
| SG-C04 | P0 | `DONE` | Founder/Growth | Approved test assets | Sixteen founder-approved case pages publish seventeen controlled comparisons with optimized assets and no internal telemetry: logo, printed value, packaging shape, main color, background-only, identical-image, lighting-only, shadow/reflection, repositioning, minor perspective, large viewpoint, partial logo occlusion, unreadable text, partial product coverage, missing component, extra component, and product count |
| SG-C05 | P0 | `DONE` | Product/Growth | SG-C04 | AI product photography pre-publish checklist published with a checker action path |
| SG-C06 | P1 | `DONE` | Product/Engineering | Product behavior | `/how-pairvu-works` explains the actual comparison, verdicts, and visible-evidence boundaries |
| SG-C07 | P0 | `DONE` | Product/Growth | SG-C04 | Ecommerce page contains a distinct four-step workflow and links to the printed-value example |
| SG-C08 | P0 | `DONE` | Product/Growth | SG-C04, official sources | Amazon workflow cites official sources and states non-affiliation and no approval guarantee |
| SG-C09 | P1 | `DONE` | Product/Growth | SG-C05 | Shopify workflow cites official product-media sources and separates fidelity from platform rendering |
| SG-C10 | P2 | `DONE` | Product/Growth | Founder-approved category evidence | Five M0 flagship category pages are implemented: Cosmetics, Beverage, Personal Care, Packaged Food, and Household Packaged Goods |
| SG-C11 | P2 | `DEFERRED` | Product/Growth | Real tool-specific fixtures | Generator-specific pages |
| SG-C13 | P1 | `DONE` | Founder/Product/Engineering | Founder-reviewed FOLDWELL evidence | Three indexable controlled examples published in the registry: `/examples/laundry-sheets-scent-count-change` (FAIL), `/examples/laundry-sheets-background-change` (PASS), and `/examples/laundry-sheets-back-view-review` (REVIEW); static Examples and Household links, metadata, schema, assets, sitemap parity, and targeted validation completed |

### Indexing And Launch QA

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-I01 | P0 | `READY_FOR_REVIEW` | Engineering | SG-T01 to SG-C09 | Local build and 390px/1280px QA pass; production routes, images, canonicals, sitemap, Googlebot, and OAI Search return successfully; focused accessibility review remains |
| SG-I02 | P0 | `DONE` | Founder/Engineering | SG-I01 | Google Search Console Domain Property verified and `https://pairvu.com/sitemap.xml` submitted |
| SG-I03 | P0 | `DONE` | Founder/Engineering | SG-I01 | Bing Webmaster Tools imported from Search Console |
| SG-I04 | P0 | `IN_PROGRESS` | Engineering | SG-I02, SG-I03 | Sitemap is submitted; discovery/indexation and priority-page baseline are being monitored |

### Measurement And Iteration

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| SG-M01 | P0 | `IN_PROGRESS` | Growth/Engineering | SG-I04 | First-party source/referral/checker report is active; Search Console query/page export is pending sufficient data |
| SG-M02 | P1 | `NOT_STARTED` | Founder/Growth | 30 days of data | 30-day indexing and query review with keep/improve/consolidate decisions |
| SG-M03 | P1 | `NOT_STARTED` | Founder/Growth | 60 days of data | 60-day content and conversion review; expansion candidates ranked |
| SG-M04 | P1 | `NOT_STARTED` | Founder/Product | 90 days of data | 90-day strategy review records brand demand, conversions, citations, and scope compliance |
| SG-M05 | P2 | `DONE` | Founder/Product | Founder approval and controlled evidence | Category quality gate adopted 2026-08-03; all five accepted M0 CPG families now have evidence-backed flagship pages; platform or generator clusters remain blocked pending separate approval |
| SG-M06 | P2 | `DONE` | Founder/Product | Founder approval and four controlled evidence cases per page | Six attribute flagships are published: Product Quantity, Product Label Text, Product Packaging, Product Logo, Product Color, and Product Components |
| SG-M07 | P2 | `DONE` | Founder/Product/Engineering | Existing approved observability cases and check-page quality gate | Product Image Observability is published as the final cross-cutting flagship with unique evidence modeling, controlled cases, build verification, and responsive QA |
| SG-M08 | P2 | `IN_PROGRESS` | Founder/Growth | SG-M07 and sufficient market data | First GSC review completed; Logo and Color intent corrections implemented; continue query-to-page monitoring |
| SG-M09 | P1 | `DONE` | Engineering/Growth | Published SEO foundation | Technical alignment completed 2026-08-05: branded metadata, OG fallback, stable entity IDs, CollectionPage hubs, one BreadcrumbList per page, owned/supporting keyword separation, contextual homepage links, and expanded SEO inventory checks |
| SG-M10 | P1 | `DONE` | Engineering/Growth | SG-M08 | Published-route ownership audit completed: unique metadata/intent enforcement, exact keyword collision correction, and semantic overlap report added |
| SG-C12 | P2 | `BLOCKED` | Founder/Product/Growth | Nine unique controlled comparison pairs | Skincare, Beverage Can, and Cleaning Product subcategory pages pass the category standard and become eligible for indexation |
| SG-D01 | P1 | `READY_FOR_REVIEW` | Founder/Growth | Public evidence pages | Four-week external distribution plan, destination map, UTM taxonomy, channel cadence, and anti-spam boundaries documented |

### FOLDWELL Evidence Delivery Notes

- The three routes use the repository's existing concise `*-change` and `*-review` case naming convention rather than the longer draft slugs. Each route owns a different intent and has unique title, description, H1, canonical, and primary keyword.
- The pages are controlled comparison examples backed by founder-reviewed Pairvu results. They are not customer stories, certifications, marketplace approvals, benchmarks, or statistical performance claims.
- Public assets live under `public/examples/foldwell-scent-count-change`, `public/examples/foldwell-background-change`, and `public/examples/foldwell-back-view`; source files outside the repository remain unchanged.
- No detection engine, prompt, QA policy, RiskPolicy, or M1 behavior changed. The Cleaning Product subcategory page in SG-C12 remains blocked; this delivery strengthens the existing Household flagship and does not authorize a new subcategory route.
- Remaining operational risk is limited to normal post-deploy crawl and rendering verification. Search Console discovery and indexation continue under SG-I04.

## 6. Implementation Sequence And Timeline

The timeline assumes one engineering owner plus founder review. Dates begin when
implementation starts, not when this planning document was accepted.

### Phase 0: Governance

Duration: 0.5-1 day

Status: `DONE`

Deliverables:

- strategy and keyword ownership;
- information architecture and link rules;
- GEO and crawler policy;
- scope/claim boundaries;
- tracker and release gates.

### Phase 1: Technical SEO Foundation

Duration: 3-4 working days

Tasks:

- SG-K01 through SG-K04, in parallel with engineering where access permits;
- SG-T01 through SG-T07;
- correct metadata and canonical architecture;
- implement global navigation and content registry;
- update sitemap, robots, breadcrumbs, and structured data;
- add automated quality inventory.

Exit: SG-G1 can move to `DONE`.

### Phase 2: Pillar And Hubs

Duration: 3-4 working days

Tasks:

- SG-C01 through SG-C03;
- homepage supporting sections;
- market pillar;
- examples, guides, and use-case hubs.

These pages may deploy when technically complete. They do not need to wait for
all later content because indexing and learning are slow.

### Phase 3: First Evidence Cluster

Duration: 4-6 working days

Tasks:

- SG-C04 through SG-C09;
- three founder-approved real cases;
- checklist and method content;
- Ecommerce, Amazon, and Shopify workflows.

Exit: the initial cluster contains product, market, problem, workflow, audience,
and platform intents.

### Phase 4: Production QA And Indexing

Duration: 1-2 working days

Tasks:

- SG-I01 through SG-I04;
- production crawl and metadata verification;
- Google and Bing ownership;
- sitemap submission and baseline recording.

Exit: SG-G2 and SG-G3 can move to `DONE`.

### Phase 5: Measurement

Duration: continuous

- weekly health and query review;
- 30-day indexing/content decision;
- 60-day expansion decision;
- 90-day strategy review.

Expected implementation time for the first complete P0 cluster: 11-16 working
days. The technical foundation should be deployable around working day 4; the
first indexable market page and hubs should be deployable around working days
6-8. Meaningful organic effects commonly require weeks, so publication should
begin before all future content is complete.

## 7. Responsibility Split

### Codex / Engineering

- implement templates, registry, metadata, schema, navigation, crawler rules,
  tests, analytics hooks, and deployment;
- verify production output rather than relying only on source inspection;
- update this tracker at every task transition;
- report deviations, unresolved decisions, and new risks.

### Founder

- approve public case images and factual descriptions;
- control Search Console and Bing ownership;
- approve external claims, sources, and platform priorities;
- approve SG-G2 launch and any SG-G4 expansion;
- own trademark and legal-policy decisions.

### Growth / Content

- collect dated keyword evidence;
- draft evidence-first content;
- maintain official sources and update dates;
- monitor queries, referrals, citations, and conversion;
- propose improvements using data instead of page-volume targets.

If there is no separate Growth owner, these responsibilities are shared by the
Founder and Codex.

## 8. Launch Checklist

Before SG-G2:

- [x] Homepage checker remains usable as the first experience.
- [x] No same-intent checker synonym URL exists.
- [x] Every public page has unique metadata and a self-canonical.
- [x] Header, footer, breadcrumbs, and contextual links are crawlable.
- [x] Sitemap contains only intended public canonical URLs.
- [x] APIs, analyses, sessions, private assets, and admin surfaces are excluded.
- [x] OAI Search crawler is allowed and GPTBot policy is applied.
- [x] Cloudflare does not block permitted search crawlers.
- [x] Structured data matches visible claims.
- [x] Public cases use approved static assets and hide internal telemetry.
- [x] Platform pages cite official sources and include non-affiliation language.
- [ ] Search/AI referrals can be connected to checker starts and completions.
- [ ] Mobile, accessibility, performance, and broken-link QA pass.

## 9. Risks And Controls

| ID | Severity | Risk | Control |
| --- | --- | --- | --- |
| SG-R01 | High | Homepage and synonym page compete | Homepage is sole product-category owner |
| SG-R02 | High | Market keyword makes Pairvu look like a generator | Pillar explains market; homepage and entity copy state checker role |
| SG-R03 | High | SEO traffic arrives before product is measurable | Complete attribution and feedback before active distribution; indexing may begin |
| SG-R04 | High | Thin pages weaken the site | New-keyword admission checklist and registry approval |
| SG-R05 | High | Platform copy implies certification | Official sources, non-affiliation, claim boundary review |
| SG-R06 | High | SEO expands unsupported product scope | Product-boundary check before every URL |
| SG-R07 | Medium | JavaScript checker blocks crawlable content | Server-render primary metadata and informational content |
| SG-R08 | Medium | Global canonical points child pages to home | Route-level self-canonical tests |
| SG-R09 | Medium | Turnstile or Cloudflare blocks crawlers | Informational pages remain ungated; production crawler verification |
| SG-R10 | Medium | AI-citation reporting is overstated | Record only source-platform data and label inferences |
| SG-R11 | Medium | Public cases leak internal or private data | Approved static assets and editorial review |
| SG-R12 | High | Production source cannot be traced to a Git commit because the workspace is entirely untracked | Establish a reviewed initial commit before the next production change |

## 10. Authentication And Billing Relationship

SEO publication, login, and paid subscriptions are separate release decisions.

- Public informational pages must remain readable without login or Turnstile.
- The current checker may continue as a capped anonymous public beta.
- SEO indexing can begin before authentication because indexing itself is slow.
- Active traffic distribution must respect the public-beta analytics, feedback,
  abuse, cost, and stop-control gates.
- Login is not part of SG-T or SG-C. It requires a separate approved product and
  data design for identity, account quotas, result ownership, and migration of
  anonymous sessions.
- Paid subscriptions require observed repeat usage, cost data, willingness-to-pay
  evidence, plan entitlements, billing operations, refund/tax decisions, and a
  separate founder checkpoint.
- Do not show a working-looking `Upgrade` or paid-plan promise before those
  capabilities and policies exist. A waitlist or contact path must be labeled
  honestly.

Recommended sequence:

1. Indexable SEO/GEO foundation and capped anonymous beta.
2. Measure qualified traffic, completed checks, repeat use, feedback, and cost.
3. Founder checkpoint for account/login scope.
4. Implement authenticated quotas and persistent account history if approved.
5. Validate willingness to pay.
6. Founder checkpoint for subscription and billing scope.

This document does not authorize steps 4 or 6.

## 11. Expansion Boundary

Do not begin SG-C10, SG-C11, or a new platform cluster automatically.

Expansion requires:

1. search demand or user-feedback evidence;
2. a distinct search intent;
3. product support for the promise;
4. unique evidence and sources;
5. internal-link placement;
6. founder approval recorded in this tracker.

SEO demand alone never authorizes a new M0 product capability.

## 12. Update Log

| Date | Update | Completed | Deviation | New risk | Next action |
| --- | --- | --- | --- | --- | --- |
| 2026-07-29 | Organic acquisition architecture accepted | SG-G01 to SG-G03 | Replaced old synonym-page plan with homepage ownership and market pillar | None | Start SG-T01 through SG-T07 |
| 2026-07-29 | Technical foundation and initial indexable pages implemented | SG-K01, SG-K03, SG-K04, SG-T01 to SG-T07, SG-C01 to SG-C03, SG-C05 | Quantitative keyword volume remains unavailable; real case pages were not fabricated without approved assets | Content pages still need founder-approved visual evidence; production crawler behavior is not yet verified | Approve three case assets, deploy, run SG-I01, then connect Search Console and Bing |
| 2026-07-30 | First evidence and commerce workflow cluster implemented | SG-C04, SG-C07 to SG-C09 | Public examples describe controlled founder-approved cases, not aggregate accuracy claims | Platform requirements change; dated official source links require periodic review | Deploy and finish production SG-I01, then verify Search Console and Bing |
| 2026-07-30 | Initial indexable cluster deployed to Pairvu | SG-G2; production portion of SG-I01 | SG-I01 remains ready for review until focused accessibility QA is recorded | Cloudflare managed crawler policy is an additional control plane and must be checked after policy changes | Verify Search Console and Bing, submit sitemap, then activate measurement baseline |
| 2026-07-31 | Second evidence-first content cluster implemented | SG-C06 plus two workflow guides and two audience pages | New failure-mode case pages remain unpublished until founder-approved static image pairs are provided | Publishing unsupported or synthetic case claims would weaken evidence quality | Deploy five pages, then request color, component, and product-count case assets |
| 2026-08-17 | First GSC-led intent and ownership review | SG-M10; SG-M08 moved to active | Broad route expansion remains evidence-gated; only three supported subcategory workflows are planned | Low-volume GSC data can expose intent but cannot support CTR or demand conclusions yet | Collect nine unique evidence pairs, execute four-week distribution plan, and review query-to-page mapping weekly |
