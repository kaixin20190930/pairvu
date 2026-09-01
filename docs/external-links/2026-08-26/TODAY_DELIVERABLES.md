# Pairvu external distribution deliverables — 2026-08-26

Scope: off-site distribution only. Nothing in this package changes product code, on-site SEO, or product behavior.

## 1. LinkedIn founder carousel

Status: **draft prepared — waiting for founder review and manual publication**

Recommended account: founder personal LinkedIn account. The Pairvu company account can reshare after the founder post is live.

Carousel files:

1. `linkedin-foldwell/01-cover.png`
2. `linkedin-foldwell/02-fail.png`
3. `linkedin-foldwell/03-pass.png`
4. `linkedin-foldwell/04-review.png`
5. `linkedin-foldwell/05-close.png`

All slides are 1080 × 1350 PNG. Product images are placed from the existing Pairvu controlled examples without generative redrawing. The reusable paper background was generated with the built-in image generation tool; exact claims, labels, and conclusions were added deterministically.

### Founder post copy

Most visual QA workflows force a binary answer: same or different.

AI product photography needs a third outcome.

Here is one controlled example using the same laundry-sheets package across three boundaries:

**FAIL** — The visible scent changed from Fresh Linen to Unscented, and the printed sheet count changed from 30 to 20.

**PASS** — Only the background changed. The visible product identity and label claims stayed consistent.

**REVIEW** — The candidate shows the back of the package. Front-label claims cannot be verified from that view.

The important boundary is simple:

A background change should not fail. A hidden product label should not pass.

I’m building Pairvu to separate confirmed visual changes from evidence that is not observable.

How does your team handle product claims that fall outside the crop or viewpoint?

This is a selected, founder-reviewed controlled example. It is not a population-level accuracy estimate or independent certification.

### First comment

Try the Pairvu visual QA checker:
https://pairvu.com/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=foldwell_fail_pass_review_20260826

Method and controlled comparison set:
https://pairvu.com/examples/controlled-visual-qa-benchmark

### Alt text

1. **Cover:** Pairvu carousel cover stating that AI product-image QA needs three outcomes: FAIL, PASS, and REVIEW.
2. **FAIL:** Side-by-side FOLDWELL laundry-sheets packages. The original says Fresh Linen and 30 Sheets; the candidate says Unscented and 20 Sheets. Pairvu labels this a confirmed visible product change.
3. **PASS:** Side-by-side FOLDWELL packages with the same Fresh Linen and 30 Sheets claims. Only the background changes from a neutral studio setting to a laundry-room scene.
4. **REVIEW:** Side-by-side front and back views of a FOLDWELL package. The front-label scent and sheet-count claims are not visible from the back, so they cannot be verified.
5. **Closing:** Pairvu statement: a background change should not fail, while a hidden product label should not pass. Call to try the visual QA checker at pairvu.com.

### Publication checklist

- Founder personally reviews and lightly rewrites the post in their normal voice.
- Upload the five images in numeric order.
- Add the supplied alt text where LinkedIn allows it.
- Publish the main post without a URL, then immediately add the first comment with the tracked Checker URL and clean Benchmark URL.
- Do not request likes, votes, or link exchanges.
- Send the published URL back to this task. Only then change the status to **published**.
- After 24 hours and 7 days, record impressions, reactions, comments, saves, profile views, referral sessions, Checker starts, and Completed checks.

## 2. Reddit community audit

Status: **initial rules audit complete — no Pairvu post authorized or published**

### r/ecommerce — do not use for Pairvu promotion

- Current published rules require a 30-day-old account, at least 20 comment karma, and at least 10 post karma.
- Self-promotion, external service links, developer research, case studies, and suspected AI-written content are explicitly prohibited.
- Allowed use: read discussions and contribute genuinely useful, non-promotional answers written by the founder. Do not name or link Pairvu.
- Rule source: https://www.reddit.com/r/ecommerce/comments/1legguv/welcome_to_recommerce_please_read_and_abide_by/

Decision: **community learning only; no Pairvu link and no promotional post.**

### r/shopify — do not promote Pairvu

- Current moderator guidance requires a 30-day-old account, at least 20 comment karma, and at least 10 post karma.
- Posts must be Shopify-specific.
- Apps, services, sites, app research, pain-point collection, and even free offers are prohibited.
- Helpful information must stay in the public thread; soliciting DMs can result in a ban.
- Rule source: https://www.reddit.com/r/shopify/comments/1mx9got/ongoing_issues_please_read_our_group_rules_before/

Decision: **helpful participation only; do not mention or link Pairvu.**

### r/AmazonSeller — possible only in the monthly promotion thread

- Affiliated content is restricted to the community’s monthly promotion post.
- The promotion-thread guidance allows a description and link but prohibits email addresses, phone numbers, requests for private contact, and accounts that are primarily promotional.
- Current example: https://www.reddit.com/r/AmazonSeller/comments/1ttopqi/ramazonseller_community_promotion_post_want_to/

Decision: **candidate for one transparent promotion-thread comment after the Reddit account history is checked. Do not post in the main feed.**

### r/productphotography — educational participation first

- Image posts require substantive context about the shot or workflow.
- Blatant self-promotion is restricted to a pinned promotion thread; educational tutorials with minimal promotion may be accepted case by case.
- Rule reminder: https://www.reddit.com/r/productphotography/comments/100r2hq/reminder_all_posted_images_must_include_a_text/

Decision: **best initial learning/participation match. Contribute to existing technical discussions first. A future educational post should upload images directly and avoid a Pairvu link unless moderators clearly allow it.**

### r/ShopifyApps — conditional future candidate

- The current welcome post permits transparent developer promotion once per month when the required template is followed.
- Pairvu is not currently confirmed to be a Shopify app, so posting there could be mismatched and should not happen unless that positioning is factually accurate.
- Rule source: https://www.reddit.com/r/ShopifyApps/comments/1p28k3m/welcome_to_rshopifyapps_read_before_posting_get/

Decision: **hold; relevance is not yet established.**

## 3. Prepared non-promotional Reddit replies

These are starting points only. The founder must adapt each response to the exact thread and write it in their own voice. Do not post a generic reply where it is not directly relevant.

### Reply A — changed package details in AI product photos

I’d separate the review into visible attributes instead of asking whether the two images “feel like the same product.” Start with product identity, variant or scent, printed quantity, label text, packaging shape, and included components. Compare an attribute only when it is visible in both images. A conflicting visible value is a real failure; matching visible claims with a background change is normally fine; and a claim hidden by a crop or different viewpoint should go to manual review rather than being treated as a pass.

### Reply B — background replacement QA

For background replacements, I’d first lock the attributes that must remain invariant: logo, variant, quantity, package geometry, cap or closure, and included parts. Then treat lighting, shadow, reflection, product position, and background as allowed changes unless the brief says otherwise. This avoids rejecting a valid creative edit just because the whole image looks different.

### Reply C — front versus back or cropped package

The main trap is treating “no visible conflict” as proof that the product is consistent. If the original shows a front-label claim but the candidate only shows the back—or crops that region out—the claim is unobservable. I’d route that comparison to review and ask for another angle, rather than guessing or automatically passing it.

## 4. Next user inputs required

- Confirm whether you have a personal LinkedIn account suitable for a founder post.
- Review the LinkedIn copy and five slides; request edits or confirm they are approved.
- Confirm whether your Reddit account is at least 30 days old and has meaningful non-promotional history. Do not provide a password.
- If you publish the LinkedIn post, provide its public URL so the status and metrics can be updated.
