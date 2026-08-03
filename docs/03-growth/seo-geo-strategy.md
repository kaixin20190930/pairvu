# Pairvu SEO And GEO Strategy

Status: Accepted

Decision date: 2026-07-29

Owner: Founder / Product / Growth

Implementation tracker:
[SEO And GEO Implementation Plan](../04-roadmap/seo-geo-implementation-plan.md)

## 1. Purpose

This document is the source of truth for Pairvu's organic acquisition
architecture. It defines:

- the market, product-category, and problem keywords Pairvu will own;
- which page owns each search intent;
- how future keywords enter the site without creating cannibalization;
- how pages link to one another;
- how SEO and generative-engine optimization (GEO) share one evidence system;
- what Pairvu may and may not claim;
- the boundary between organic acquisition work and product-scope expansion.

This strategy does not authorize Batch, API, marketplace rule packs, automatic
fixing, video, teams, billing, or Enterprise work.

## 2. Accepted Positioning

| Layer | Accepted expression |
| --- | --- |
| Brand | Pairvu |
| Market | AI product photography |
| Product category | AI product image checker |
| Positioning | Quality control for AI product photography |
| Core message | Did AI change your product? |
| Primary action | Check AI product photos before publishing |

Pairvu is not an AI image generator. It uses the growth of AI product
photography to establish a quality-control category around reference-to-candidate
product-image checking.

Ecommerce is an important initial acquisition market, not the full product
identity. The homepage must not define Pairvu only as a tool "for Ecommerce."

## 3. Keyword Ownership

Keyword ownership is a strategic decision about relevance and intent, not a
claim that a keyword has a particular monthly search volume. No volume number
may be published or used for prioritization unless its source, market, language,
device scope, and collection date are recorded.

Before content implementation, create a dated evidence baseline using:

- Google Ads Keyword Planner for directional demand and variants;
- Google Trends for relative direction and seasonality;
- live Google and Bing results for intent and competing page types;
- Search Console after publication for Pairvu-specific impressions and queries;
- founder/user language from feedback and outreach.

External SEO tools may supplement this baseline, but their volumes are estimates.
The accepted homepage and pillar ownership will not be reversed merely because
a synonym shows a larger third-party estimate; first inspect its actual intent.

### 3.1 Primary ownership

| Keyword or topic | Intent | Owning page | Rule |
| --- | --- | --- | --- |
| Pairvu | Brand | `/` | Homepage |
| AI product image checker | Product/tool | `/` | Homepage is the only category owner |
| AI product photography | Market/information | `/ai-product-photography` | Market pillar |
| AI product image changes | Problem discovery | `/examples/` | Examples hub |
| AI product photography checklist | Workflow | `/guides/ai-product-photography-checklist` | Guide |
| Ecommerce product-image QA | Audience/workflow | `/use-cases/ecommerce` | Use case |
| Amazon product-image QA | Platform/workflow | `/use-cases/amazon-sellers` | Use case |
| Shopify product-image QA | Platform/workflow | `/use-cases/shopify-stores` | Use case |

The homepage owns the product-category term. Do not create independent pages for
these synonymous intents:

- `/ai-product-image-checker`;
- `/product-image-checker`;
- `/ai-product-photo-checker`;
- `/product-photo-checker`;
- `/product-image-consistency-checker`.

If one of these terms gains impressions, improve the homepage copy and metadata.
Do not create another page with the same search intent.

### 3.2 Keyword matrix

Every target keyword must occupy one of these slots:

| Slot | User question | Page family |
| --- | --- | --- |
| Market | What is happening in this market? | `/ai-product-photography` |
| Product/tool | What tool can check my images? | `/` |
| Problem | What kinds of changes can occur? | `/examples/` |
| Workflow | How should I review or publish images? | `/guides/` |
| Audience | How does my type of team use this? | `/use-cases/` |
| Platform | How does this fit a publishing platform? | `/use-cases/` |
| Product category | How does this apply to my goods? | `/categories/`, evidence-backed CPG pages only |

The matrix is expandable by adding a genuinely new intent under an existing
family. It must not grow through synonym pages.

### 3.3 Platform priority

| Priority | Platforms or contexts | Publication condition |
| --- | --- | --- |
| P0 | Ecommerce, Amazon, Shopify | First launch cluster |
| P1 | Google Merchant Center / Shopping, Etsy, TikTok Shop | Search evidence plus unique workflow content |
| P2 | eBay, Walmart, WooCommerce | Search evidence plus validated demand |

Every platform page must:

- cite current official platform documentation where requirements are discussed;
- explain what Pairvu can and cannot inspect;
- include a non-affiliation statement;
- avoid approval, certification, compliance, or guaranteed-acceptance claims;
- contain unique workflow and examples, not a platform-name substitution.

### 3.4 Generator-specific topics

Pages about ChatGPT, Gemini, Midjourney, Photoroom, or another generator are
allowed only after Pairvu has tested real founder-owned or approved outputs from
that tool. A valid page needs:

- an actual generation workflow;
- real reference/candidate examples;
- observed failure modes;
- Pairvu results and limitations;
- a date and the tested tool/version when known.

Do not mass-produce tool-name pages.

## 4. Information Architecture

```text
/
├── ai-product-photography
├── examples/
│   ├── logo-change-ai-product-image
│   ├── label-value-change-ai-product-image
│   ├── packaging-shape-change-ai-product-image
│   ├── color-change-ai-product-image
│   ├── background-change-ai-product-image
│   ├── missing-product-component-ai-image
│   ├── extra-product-component-ai-image
│   ├── product-count-change-ai-image
│   ├── identical-product-images-pass
│   ├── lighting-change-product-image
│   ├── shadow-reflection-change-product-image
│   ├── product-repositioning-perspective-change
│   ├── large-viewpoint-difference-product-image
│   ├── partially-hidden-product-logo
│   ├── unreadable-product-label-text
│   └── partially-visible-product-image
├── guides/
│   ├── ai-product-photography-checklist
│   ├── compare-original-and-ai-product-images
│   └── keep-products-consistent-in-ai-images
└── use-cases/
    ├── ecommerce
    ├── amazon-sellers
    ├── shopify-stores
    ├── brands
    └── creative-agencies
```

The root is the homepage and product. The other branches are publicly
indexable content families that lead back to the checker.

The founder approved category expansion on 2026-08-02 and adopted a stricter
publication standard on 2026-08-03. Category pages apply the same Pairvu
product to distinct packaged-goods workflows; they do not redefine the
homepage product-category keyword.

```text
/categories/
├── cosmetics-product-image-qa       PUBLISHED FLAGSHIP
├── beverage-product-image-qa        PUBLISHED FLAGSHIP
├── personal-care-product-image-qa   PUBLISHED FLAGSHIP
└── packaged-food-product-image-qa   PUBLISHED FLAGSHIP
```

Every published category page must pass the requirements in
`docs/03-growth/category-page-quality-standard.md`. The mandatory structure
includes an identity hierarchy, an attribute-level PASS / REVIEW / FAIL matrix,
three distinct evidence roles, category-specific risks and insights, input
requirements, workflow, limitations, FAQ, founder approval, and automated
quality verification. New category routes default to planned and noindex.

Cosmetics, Beverage, Personal Care, and Packaged Food are the first public
flagships. Household packaged goods remain in
the accepted M0 boundary, but a dedicated page is deferred until the public
evidence set is broader. Platform and generator clusters still require separate
founder approval and supporting demand evidence.

Physical electronics remain outside the accepted M0 category boundary and must
not receive an SEO category page that implies product support.

## 5. Page Specifications

### 5.1 Homepage

Route: `/`

Recommended metadata:

- Title: `Pairvu - AI Product Image Checker`
- Description: `Compare an AI-generated or edited product image with the
  original. Check visible changes to logos, label text, color, quantity,
  components, and packaging before publishing.`
- H1: `Did AI change your product?`
- Positioning line: `Quality control for AI product photography.`

Required page order:

1. Brand, H1, positioning, and live checker in the first viewport.
2. Honest analysis and result states.
3. How Pairvu works.
4. What Pairvu checks.
5. Real comparison examples.
6. Short introduction to AI product photography and link to the pillar.
7. Supported users and use cases without restricting the product to ecommerce.
8. Factual FAQ.
9. Footer.

The checker remains the primary experience. SEO copy must not push it below a
marketing hero.

### 5.2 Market pillar

Route: `/ai-product-photography`

Recommended metadata:

- Title: `AI Product Photography: How to Keep Product Images Accurate`
- H1: `AI Product Photography Without Changing the Product`

Required coverage:

- a direct definition of AI product photography;
- common generation and editing workflows;
- benefits and operational tradeoffs;
- why logos, label text, color, packaging, or components can change;
- a pre-publish quality-control workflow;
- links to real Pairvu comparison cases;
- Pairvu's supported checks and limitations;
- sources and last-updated date;
- a prominent checker CTA.

This is a public market education page, not hidden SEO copy. It must be linked
from the header and footer, included in the sitemap, server-rendered, canonical,
and readable without JavaScript interaction, login, or Turnstile.

### 5.3 Examples hub and case pages

The examples hub explains the failure taxonomy in user language and links to
real cases. Each case page must use approved assets and contain:

1. Expected behavior.
2. Reference and candidate images.
3. What changed.
4. Pairvu verdict.
5. Whether the result was correct.
6. Stable visible evidence.
7. Why the issue matters before publishing.
8. Observability or model limitations.
9. Related examples.
10. Checker CTA.

Public cases must not expose provider, model, prompt, internal policy version,
raw IDs, or private execution telemetry.

### 5.4 Guides

Guides answer repeatable workflows rather than restating the product page. The
first guide is the pre-publish checklist. A guide needs:

- a direct answer at the beginning;
- clear ordered steps;
- a decision table or checklist;
- links to supporting real examples;
- limits and escalation-to-human guidance;
- sources where external requirements are discussed;
- an updated date and checker CTA.

### 5.5 Use cases

Use-case pages explain how Pairvu fits a user's workflow. They do not redefine
the whole brand. Each page needs:

- the user's publishing or review workflow;
- common failure modes;
- where the reference image comes from;
- when Pairvu is used;
- a real or approved relevant example;
- what Pairvu cannot decide;
- a non-affiliation statement for third-party platforms;
- links to the market pillar, relevant cases, and checker.

## 6. Navigation

### 6.1 Header

Desktop:

```text
Pairvu | AI Product Photography | Examples | Guides | Use Cases | [Check image]
```

- Pairvu links to `/`.
- Check image links to `#checker` on the homepage and `/#checker` elsewhere.
- Initial navigation stays simple; no large marketing dropdown is required.
- Mobile navigation must expose ordinary crawlable links.

### 6.2 Footer

| Group | Links |
| --- | --- |
| Product | AI Product Image Checker, Check Image, How It Works |
| Learn | AI Product Photography, Examples, Guides, Checklist |
| Use Cases | Ecommerce, Amazon, Shopify, Brands, Creative Agencies |
| Legal | Privacy |

Anchor text must describe the destination naturally. Do not repeat exact-match
keywords mechanically.

## 7. Internal Linking

Global header and footer links are crawlable on every public page.

Contextual link requirements:

- Homepage links to the market pillar, examples, checklist, and first use cases.
- The market pillar links to the homepage with a natural checker anchor, the
  examples hub, individual cases, and the checklist.
- The examples hub links to every published case.
- Every case links to the checker, market pillar, and one or two related cases.
- Every guide links to the checker, relevant examples, and market pillar.
- Every use case links to the checker, market pillar, relevant examples, and
  checklist.
- Each content page has three to six useful contextual links, excluding global
  navigation.
- No indexable page may be orphaned.

Breadcrumb patterns:

```text
Home > Examples > Logo Changes
Home > Guides > AI Product Photography Checklist
Home > Use Cases > Amazon Sellers
```

Render visible breadcrumbs and matching `BreadcrumbList` structured data.

## 8. New Keyword Admission

Before creating any indexable URL, answer all questions:

1. Is the topic related to a capability Pairvu currently supports?
2. Does an existing page already own the same search intent?
3. Can the existing page answer the query naturally with a new section?
4. Is there real evidence, first-party data, or an authoritative source?
5. Will at least 60% of the page be unique and useful?
6. Does it have a parent hub and at least two relevant internal-link sources?
7. Can it avoid cannibalizing an existing page?

Create the page only when every answer supports a new URL. Otherwise update an
existing page or keep the keyword in the research backlog.

A new market pillar is permitted only when the topic supports at least three
distinct child intents and Pairvu's actual product capability supports them.

## 9. Content Registry

Organic pages must be represented in a typed content registry before
publication. Planned implementation:

`lib/seo/content-registry.ts`

Minimum fields:

- route and slug;
- page family and status;
- primary and secondary keywords;
- search intent;
- parent hub and related routes;
- title, H1, description, and canonical;
- publication and update dates;
- indexable flag and sitemap priority;
- keyword source, demand evidence, and evidence date;
- content owner and reviewer;
- Search Console metrics after publication.

The registry should become the input for sitemap entries, hub lists,
breadcrumbs, related links, and content inventory checks. It prevents ad hoc
pages from bypassing keyword ownership.

## 10. Technical SEO Requirements

Every indexable page must have:

- a unique title, description, H1, and self-referencing canonical;
- server-rendered or statically generated primary text;
- one clear search intent;
- valid header, footer, and contextual links;
- sitemap inclusion;
- Open Graph metadata and a useful social image where appropriate;
- visible breadcrumbs below the homepage level;
- structured data that matches visible content;
- accessible images with useful alt text;
- acceptable mobile layout and Core Web Vitals;
- no dependency on login, Turnstile, upload, or analysis to read the content.

Schema guidance:

- `Organization` and `WebSite` at the site level;
- `WebApplication` or `SoftwareApplication` for the checker only when all
  properties are factual;
- `Article` for substantial guides and market education;
- `BreadcrumbList` for nested pages;
- `FAQPage` only when the FAQ is visible and current.

Analysis records, result restoration URLs, session data, APIs, admin routes, and
private assets are not indexable.

## 11. GEO Requirements

GEO uses the same indexable, factual content system. Pairvu will not create a
parallel set of pages for AI search engines.

### 11.1 Stable entity description

Use this description consistently where a concise company definition is
needed:

> Pairvu is an AI product image checker. It compares an AI-generated or edited
> product image against an original reference image. Pairvu helps identify
> visible changes to logos, label text, color, quantity, components, and
> packaging.

Do not describe Pairvu as:

- an AI product-image generator;
- an official marketplace compliance checker;
- a generic pixel-difference tool;
- a product-photography marketplace or studio;
- a guaranteed authenticity or approval service.

### 11.2 Answer-ready content

Important pages should contain:

1. A descriptive H1.
2. A 40-80 word direct answer.
3. Key takeaways.
4. Clear explanation.
5. A real case, method, or first-party evidence.
6. A decision table or checklist where useful.
7. What Pairvu can check.
8. What Pairvu cannot confirm.
9. Related cases.
10. Sources and last-updated date.
11. Checker CTA.

Prefer explicit definitions, dated evidence, clear limitations, and original
before/after comparisons. Do not invent statistics or performance claims.

### 11.3 Crawler policy

Accepted policy:

- allow ordinary search crawlers on public content;
- allow `OAI-SearchBot` to support ChatGPT search discovery;
- disallow `GPTBot` to opt public pages out of model-training crawling;
- disallow `/api/` and all non-public application surfaces;
- ensure Cloudflare security rules do not accidentally block permitted crawlers.

An `llms.txt` file is not a launch priority. It may be reconsidered when it has
demonstrated operational value; it is not a substitute for crawlable pages,
internal links, canonical metadata, or evidence.

### 11.4 GEO measurement

Track:

- Google Search Console impressions, clicks, queries, pages, branded search,
  and the generative-AI performance report when available to the property;
- Bing Webmaster Tools index coverage and available AI citation reports;
- referrals from ChatGPT and other identifiable AI assistants;
- AI/search referral to `checker_started` and `analysis_completed`;
- citations and landing pages found through manual scheduled reviews;
- Pairvu brand-query growth.

Google includes supported generative-AI data in overall Web performance and is
rolling out a dedicated report to eligible properties. Avoid claiming precision
or query detail the source platforms do not provide.

## 12. Evidence And Source Policy

Priority order:

1. Pairvu's founder-approved real comparison cases.
2. Pairvu first-party product and feedback data.
3. Official platform and vendor documentation.
4. Reputable primary research.
5. Secondary industry analysis with clear attribution.

Keyword demand must be recorded with source and date. Search Console data takes
priority after pages begin receiving impressions. External volume tools are
directional and must not be treated as exact demand.

Public editorial case assets are approved static site assets. They are separate
from anonymous user uploads and the 24-hour deletion architecture.

## 13. Scope And Claim Boundaries

The initial public content may discuss:

- cosmetics;
- beverages;
- personal care;
- packaged food;
- household packaged goods;
- general brand, creative-agency, ecommerce, Amazon, and Shopify workflows.

It may claim visible pre-publish quality control and apparent differences. It
must not claim:

- legal, regulatory, or marketplace compliance;
- guaranteed listing acceptance;
- perfect accuracy or complete authenticity;
- detection of non-visible facts;
- support for deferred product categories;
- official partnership or affiliation without a contract.

SEO work must not add product functionality merely because a keyword exists.

## 14. Anti-Patterns

Do not:

- create one page per synonym;
- create large batches of templated platform, category, city, or generator pages;
- publish generic articles without examples, decisions, or sources;
- hide SEO text from users;
- gate informational content behind the checker;
- expose internal telemetry in public cases;
- optimize for a high-volume term that misrepresents the product;
- allow SEO copy to promise unsupported marketplace rules;
- use unrelated backlinks, purchased link schemes, or keyword stuffing.

## 15. Success Measures

### First 30 days

- all P0 pages indexed or diagnosed;
- no canonical, robots, sitemap, structured-data, or orphan-page defects;
- first non-brand impressions for the product and market topics;
- search and AI referrals are attributable through the product funnel.

### First 60 days

- query data identifies which examples, guides, and use cases deserve expansion;
- at least one content family produces checker starts;
- underperforming pages are improved or consolidated, not multiplied.

### First 90 days

- Pairvu begins receiving branded searches;
- real comparison pages earn impressions and external references;
- expansion decisions use observed demand, conversion, and product feedback;
- no content expansion has exceeded the supported product boundary.

## 16. Official Reference Baseline

These sources support the technical and GEO rules in this document. Review
their update dates during each 90-day strategy review.

- [Google: optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
  states that normal technical SEO remains foundational, content must be
  crawlable and indexable, unique first-hand value matters, and scaled
  query-variation pages are not a valid strategy.
- [Google: Search developer guide](https://developers.google.com/search/docs/fundamentals/get-started-developers)
  supports textual visibility, unique metadata, semantic HTML, sitemaps, and
  crawl diagnostics.
- [Google: generative AI performance report](https://support.google.com/webmasters/answer/16984139)
  defines the available impressions and reporting limitations for AI Overviews
  and AI Mode.
- [OpenAI: publishers and developers FAQ](https://help.openai.com/en/articles/12627856)
  requires access for `OAI-SearchBot` for full summary/snippet inclusion and
  explains referral measurement.
- [OpenAI: ChatGPT Search](https://help.openai.com/en/articles/9237897-chatgpt-search)
  also requires the host or CDN to allow published crawler IPs.
- [Bing: AI Performance in Webmaster Tools](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
  defines citation, cited-page, and grounding-query reporting and recommends
  clear structure, evidence, freshness, and IndexNow.
