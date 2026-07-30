# Keyword And SERP Evidence Baseline

Status: `PARTIAL`

Evidence date: 2026-07-29

Market/language: Global English-language web results

Owner: Product / Growth

Strategy:
[Pairvu SEO And GEO Strategy](seo-geo-strategy.md)

## 1. Purpose

This baseline records observed intent and competing page types for Pairvu's
initial keyword seeds. It does not claim exact monthly search volume.

Quantitative Google Ads Keyword Planner data is still required for country-level
volume, competition, and variant evidence. That data requires founder-owned
account access or an export and remains explicitly unverified.

## 2. Findings

### `AI product photography`

Observed result types:

- AI product-photo generators and virtual studios;
- comparison and "best tools" guides;
- educational explanations of AI product-photography workflows;
- ecommerce-oriented product-photography services.

Representative results:

- [Figura AI product photography](https://www.figuraslab.com/)
- [ShotPro AI product photography](https://getshotpro.com/ai-product-photography)
- [Pumo AI product photography](https://www.pumo.app/)
- [How AI product photography works](https://www.prodofoto.com/blog/how-ai-product-photography-works)

Decision:

- This is a real market/category phrase, but current intent is generator-heavy.
- It belongs on an educational market pillar, not the Pairvu homepage.
- The pillar must state early that Pairvu is quality control, not a generator.
- Original before/after evidence is necessary to differentiate Pairvu from
  generic tool roundups and generator pages.

### `AI product image checker`

Observed result types:

- AI-image provenance and watermark detectors;
- marketplace image-size or preflight checkers;
- general image-quality tools;
- few clearly established reference-to-candidate product-fidelity checkers.

Representative results:

- [OpenAI image provenance verifier](https://openai.com/research/verify/)
- [Amazon product-image preflight checker](https://www.imagecompat.com/check/amazon-product)
- [Amazon main-image checker](https://auratuner.com/tools/amazon-main-image-checker)

Decision:

- The phrase fits Pairvu's product category but remains semantically ambiguous.
- Homepage copy must qualify the category with `compare with the original`,
  `product fidelity`, and the six supported visible checks.
- Pairvu must not use `AI image detector` as a synonym; that phrase usually
  means provenance or authenticity detection.
- The product category is still owned by the homepage because its action intent
  is closer to Pairvu than the market pillar.

### `check AI generated product images for accuracy`

Observed result types:

- provenance and fake-image detection;
- general advice about spotting AI artifacts;
- product-generation comparisons and testing articles.

Decision:

- Use this language as a supporting problem phrase, not a primary page keyword.
- Explain the distinction between visual product fidelity and AI provenance.
- Real comparison examples should target concrete problems such as logo, text,
  quantity, component, color, and packaging changes.

### `Amazon AI product image quality checker`

Observed result types:

- image dimensions, crop, white-background, and marketplace preflight tools;
- Amazon image requirements and listing guidance;
- product-image generation tools aimed at sellers.

Decision:

- Amazon belongs under use cases, not the homepage or a second generic checker
  page.
- A dedicated Amazon page requires official Amazon sources, a real workflow,
  unique examples, and a non-affiliation statement.
- Pairvu must not claim Amazon approval or complete policy validation.

## 3. Competitive Gap

The observed market has strong generator supply and several technical preflight
or provenance checkers. Pairvu's narrower opportunity is:

> Compare the final AI-generated or edited product image with an approved
> original and report meaningful visible product changes.

This gap supports the accepted architecture:

- market education: `/ai-product-photography`;
- product action: `/`;
- concrete failure modes: `/examples/`;
- workflow: `/guides/`;
- audience and platform fit: `/use-cases/`.

## 4. Evidence Limits

- Search results are personalized, localized, and change over time.
- This baseline records intent, not exact rankings or search volume.
- Result presence does not prove commercial demand.
- Third-party claims and statistics were not adopted as Pairvu claims.
- Keyword Planner and Trends evidence must include country, language, date, and
  export or screenshot reference.

## 5. Next Evidence Actions

| ID | Action | Status | Required output |
| --- | --- | --- | --- |
| SG-K01 | Live SERP intent capture | `DONE` | This document |
| SG-K02 | Keyword Planner and Trends baseline | `BLOCKED` | Founder-provided access/export with market and date |
| SG-K03 | Competitor and intent gap review | `DONE` | Generator/provenance/preflight/fidelity distinction above |
| SG-K04 | Add evidence to content registry | `DONE` | `evidenceSource` and `evidenceDate` on every published registry entry |
