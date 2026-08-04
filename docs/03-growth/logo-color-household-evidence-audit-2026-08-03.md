# Product Logo, Product Color, and Household Evidence Audit

Status date: 2026-08-04
Owner: Founder / Product / Engineering  
Scope: Evidence gates for `/checks/product-logo`, `/checks/product-color`, and the Household Packaged Goods category flagship.

## Decision Summary

| Surface | Status | Decision |
| --- | --- | --- |
| Product Logo | `PUBLISHED` | Existing evidence is sufficient and distinct. The page passed the check-content gate, full SEO inventory, production build, and responsive QA. |
| Product Color | `BLOCKED ON OBSERVABILITY EVIDENCE` | ORVENA now provides a clean variant-text plus main-color FAIL, and TIDORA provides a clean color-only REVIEW. A separate, valid color-not-observable case is still required before publication. |
| Household Packaged Goods | `IMPLEMENTED / AWAITING DEPLOY` | HOUSEHOLD-01 produced a clean capacity FAIL and HOUSEHOLD-02 produced a clean background-only PASS. Two case pages and the fifth flagship category page pass the content and SEO gates. |

Do not change `M0RiskPolicy` to force a color-only FAIL. Under `m0-risk-policy-003`, `color_mismatch` is high severity rather than critical, so a sufficiently observable color mismatch contributes REVIEW. The Product Color page must explain this product boundary honestly.

## Observed Result Review — 2026-08-04

| Fixture | Observed result | Evidence decision |
| --- | --- | --- |
| `HOUSEHOLD-01-capacity-500ml.png` | FAIL for readable `750 mL` to `500 mL`; all other check families verified | `ACCEPTED` |
| `HOUSEHOLD-02-background-only.png` | PASS with no issue or limitation; all six check families verified | `ACCEPTED` |
| `COLOR-01-variant-and-color-change.png` | FAIL with text and color changes, plus an unintended critical logo finding because the logo and ELARA ink changed from orange to white | `REGENERATE` |
| `COLOR-02-reflection-limited-color.png` | REVIEW, but the system saw a real holographic/rainbow label recolor rather than insufficient color observability | `REGENERATE` |
| `COLOR-01-v3-candidate-charcoal-toothpaste.png` | FAIL for readable `FRESH MINT` to `CHARCOAL CLEAN` plus a high-confidence light-green to dark-gray main-color change; logo, count, components, and package shape verified | `ACCEPTED` |
| `COLOR-02-v3-candidate-neutral-glare-pouch.png` | REVIEW for a high-confidence matte reddish-orange to glossy pale-pink pouch-color change; no observability limitation was recorded | `ACCEPTED AS COLOR-ONLY CHANGE`, not an observability case |
| `COLOR-03-main-color-outside-crop.png` | PASS; the crop still exposes substantial orange pouch material, so main color remains observable. The provider also incorrectly claimed the cropped zipper, bottom gusset, and complete pouch silhouette were visible | `REJECTED` |

The Color outcomes are not a reason to change model instructions or RiskPolicy. The supplied pixels contain extra product mutations. Publishing those fixtures would teach the wrong lesson: COLOR-01 would conflate logo, copy, and palette changes, while COLOR-02 would describe an observable material recolor as glare. Evidence purity takes priority over adding another route.

### COLOR-03 crop decision

`COLOR-03-main-color-outside-crop.png` does not satisfy the intended color-observability condition. Orange pouch material remains visible on both sides of the white label and fills a meaningful portion of the candidate frame, so a main-color match is supportable from the candidate pixels. The case must not be presented publicly as evidence that Pairvu can detect insufficient color coverage.

The same run did expose a separate false-pass pattern under `major_shape_packaging`: the result described a zipper closure, rounded top corners, bottom gusset, and full stand-up pouch silhouette even though those regions were outside the candidate frame. Record this as a crop/coverage regression case. Do not change `M0RiskPolicy`; first rerun with a deterministic label-only crop containing no orange pouch body. If that valid fixture still produces PASS for color or complete package shape, tighten provider observability handling and regression-test the same pair before publishing Product Color.

For the next candidate, use a standard crop operation rather than generative editing. Crop to the interior of the white label only. The candidate must contain no orange pouch body, no zipper, no side boundary, and no bottom gusset. Logo and printed text should remain readable. Expected behavior is REVIEW with main color and package shape marked not observable or insufficiently covered; logo and visible text may remain verified.

### Corrected COLOR-01 candidate

Save as `COLOR-01-v2-variant-and-color-change.png`.

```text
Edit the supplied approved ELARA VITAMIN C SERUM image. Preserve the exact frosted bottle, white dropper, camera angle, position, scale, lighting, shadow, neutral background, label dimensions, and printed value “30 mL”.

Preserve the complete logo lockup exactly as it appears in the approved original: the crescent moon must remain the same orange color, shape, size, and position, and the word “ELARA” must remain the same orange color, spelling, type style, size, and position. Preserve the orange top and bottom label rules and the orange “30 mL” value.

Make exactly these intended variant changes:
1. Change only the main label background from cream to deep cobalt blue.
2. Change “VITAMIN C SERUM” to “RETINOL SERUM”.
3. Change “BRIGHTENING” to “NIGHT RENEWAL”.

The final front label must read exactly:
ELARA
RETINOL SERUM
NIGHT RENEWAL
30 mL

Use white text only for “RETINOL SERUM” and “NIGHT RENEWAL” so those lines remain readable against blue. Do not recolor, redraw, replace, move, or restyle the orange crescent, orange ELARA wordmark, orange rules, or orange 30 mL value. Do not alter bottle geometry, dropper, product count, framing, or background. Do not add decorations, claims, badges, props, or extra components.
```

Acceptance requires the logo check to remain verified while visible text and main color change. Overall FAIL may be driven by the identity-bearing variant text.

### Corrected COLOR-02 candidate

Save as `COLOR-02-v2-neutral-glare-color-not-observable.png`.

```text
Edit the supplied approved ELARA VITAMIN C SERUM image. Preserve the exact underlying bottle, white dropper, cream-and-orange label artwork, orange crescent, orange ELARA wordmark, VITAMIN C SERUM wording, BRIGHTENING wording, 30 mL value, package geometry, product count, camera angle, scale, position, and neutral background.

Photograph the unchanged product through a neutral frosted acrylic sheet or strong neutral-white softbox reflection positioned in front of the product. Add a broad, physically plausible, colorless white glare and diffusion region across approximately 70–80% of the front label. The glare must wash out the true label palette and make the cream-versus-orange color relationship impossible to certify directly. Keep the bottle silhouette, dropper, and enough label location visible to recognize that the product is present.

The obstruction must be neutral white and gray only. Do not add cyan, magenta, rainbow, iridescent, holographic, metallic, or colored lighting. Do not repaint the label, recolor the product, change text, add a sticker, pixelate the image, crop the bottle, or alter any component. The intended condition is insufficient color evidence caused by neutral glare, not a different package color or material.
```

Acceptance requires REVIEW with color explicitly not observable, uncertain, or insufficiently covered. A confirmed color-change finding means the fixture must be regenerated again.

## Product Logo Evidence Audit

| Role | Public case | Observed decision | Evidence contribution |
| --- | --- | --- | --- |
| Product change | `/examples/logo-change-ai-product-image` | FAIL | ELARA crescent is replaced by a sun while label and package remain stable. |
| Hard negative | `/examples/background-change-ai-product-image` | PASS | ELARA remains faithful in a different environment. |
| Hard negative | `/examples/shadow-reflection-change-product-image` | PASS | NOVA FIZZ identity survives stronger shadow and reflection. |
| Observability | `/examples/partially-hidden-product-logo` | REVIEW | A white obstruction prevents complete wordmark verification. |

The set covers symbol identity, wordmark visibility, scene separation, and occlusion. It does not duplicate evidence already used by another published check page. Product Logo is therefore approved for implementation without new images.

## Product Color Evidence Gap

Existing evidence:

- `/examples/color-change-ai-product-image`: color-only product change, observed REVIEW.
- `/examples/lighting-change-product-image`: illumination change with faithful product color, observed PASS.
- `/examples/background-change-ai-product-image`: environment change with faithful product color, observed PASS.
- `/examples/shadow-reflection-change-product-image`: shadow/reflection hard negative, observed PASS.

Two new candidates are required. Both should be edited from the existing founder-approved ELARA original at:

`/Users/liukai/Documents/Product Visual QA Test/C 化妆品.png`

### COLOR-01: Variant Cue Changed With Main Color

Purpose: produce an overall FAIL that is honest about causality. The main label color changes together with readable, identity-bearing variant text. The visible-text mismatch may drive FAIL; the page must not claim that color alone caused it.

Expected behavior: `FAIL` overall, with a visible-text/value issue and a main-color issue or observation.  
Save candidate as: `COLOR-01-variant-and-color-change.png`

#### Optional original-generation prompt

```text
Create a square 1:1 high-resolution studio product photograph of one premium cosmetic serum bottle, centered and fully visible from the front. Use a frosted translucent cylindrical glass bottle with rounded shoulders, a white dropper cap, and a cream rectangular front label. The approved logo is an orange crescent moon above the exact brand name “ELARA”. The exact readable label text must be:

ELARA
VITAMIN C SERUM
BRIGHTENING
30 mL

Use restrained orange rules and orange typography on the cream label. Neutral light-gray seamless background, soft natural studio shadow, front-facing camera, no props, no hands, no extra products, no crop, no reflection covering the label. Make every letter and number sharp and readable. This is an approved product reference image, not an advertisement.
```

#### Candidate edit prompt

```text
Edit the supplied approved ELARA serum image. Preserve the exact bottle, frosted glass, white dropper, camera angle, object position, scale, lighting, shadow, background, label size, label position, crescent logo shape, ELARA brand name, and the printed value “30 mL”.

Make exactly these two coordinated product-variant changes:
1. Change the large cream-and-orange label color system to a deep cobalt-blue label with white typography and white rules.
2. Change the readable product wording “VITAMIN C SERUM” to “RETINOL SERUM” and change “BRIGHTENING” to “NIGHT RENEWAL”.

The final readable front label must say exactly:
ELARA
RETINOL SERUM
NIGHT RENEWAL
30 mL

Do not change the crescent logo geometry, brand spelling, bottle shape, dropper, quantity value, product count, framing, or background. Do not add decorations, claims, badges, props, or extra components. Keep the edited text crisp enough to read at normal size. The only intended differences are the main label color system and the two variant-text lines.
```

Acceptance checklist:

- One bottle in both images.
- Crescent and `ELARA` remain identical.
- `30 mL`, bottle, dropper, framing, and background remain identical.
- Candidate label is clearly cobalt blue rather than cream/orange.
- `RETINOL SERUM` and `NIGHT RENEWAL` are readable and exact.
- No unintended shape, component, count, logo, or capacity changes.

### COLOR-02: Main Color Not Observable Through Reflection

Purpose: prove that color cannot be verified when a strong colored reflection masks the relevant package regions, without inventing a different underlying product color.

Expected behavior: `REVIEW`, with dominant color not observable, uncertain, or insufficiently covered.  
Save candidate as: `COLOR-02-reflection-limited-color.png`

#### Candidate edit prompt

```text
Edit the supplied approved ELARA serum image. Preserve the exact bottle, white dropper, cream-and-orange label artwork, crescent logo, ELARA wording, VITAMIN C SERUM wording, BRIGHTENING wording, 30 mL value, product count, camera angle, scale, position, and neutral background.

Add one physically plausible but very strong cyan-magenta specular reflection across most of the front label and lower frosted bottle. The reflection must make the underlying label color family unreliable to judge: it should cover approximately 55–65% of the colored label surface with saturated reflected light and glare. Keep the product silhouette and major components visible. Do not repaint the label beneath the reflection, do not change any printed wording, and do not add or remove any product feature.

The intended test condition is color observability, not a recolored product. A reviewer should see that the same product is probably present but should not be able to certify the true cream-and-orange label palette from the candidate pixels alone. Keep the reflection photographic and continuous, not an opaque sticker, graphic overlay, blur, crop, or pixelation.
```

Acceptance checklist:

- Bottle, logo, label layout, wording, quantity, and package shape remain unchanged.
- Strong colored glare covers more than half of the color-bearing label area.
- The candidate still looks like a photograph, not a flat colored rectangle.
- The true label palette cannot be confidently certified from the candidate.
- No text, logo, count, component, or package-geometry mutation is introduced.

## Household Packaged Goods Evidence Gap

Existing evidence:

- `/examples/missing-product-component-ai-image`: white spray trigger removed, observed REVIEW.
- `/examples/large-viewpoint-difference-product-image`: front versus back package face, observed REVIEW.

Two new candidates are required. Both should be edited from the existing founder-approved BRIGHTLEAF original at:

`/Users/liukai/Documents/Product Visual QA Test/E 家庭包装用品.png`

### HOUSEHOLD-01: Capacity Value Changed

Purpose: provide a category-specific, sufficiently observable FAIL while preserving the household cleaner package and brand.

Expected behavior: `FAIL` because readable `750 mL` changes to `500 mL`.  
Save candidate as: `HOUSEHOLD-01-capacity-500ml.png`

#### Optional original-generation prompt

```text
Create a square 1:1 high-resolution studio product photograph of one household kitchen-cleaner spray bottle, centered and fully visible from the front. Use a translucent light-blue contoured plastic bottle filled with pale blue liquid, a white ribbed neck, and a complete white trigger sprayer. Use a white rounded front label with a green two-leaf logo and a small blue sparkle. The exact readable label text must be:

BRIGHTLEAF
KITCHEN CLEANER
CITRUS
750 mL

Neutral light-gray seamless background, soft studio shadow, front-facing camera, no props, no hands, no extra bottles, no crop, no glare covering the label. Make the trigger, bottle boundary, internal dip tube, logo, wording, and quantity sharp and clearly observable.
```

#### Candidate edit prompt

```text
Edit the supplied approved BRIGHTLEAF kitchen-cleaner image. Preserve the exact translucent light-blue bottle, pale blue liquid level, white trigger sprayer, ribbed neck, internal dip tube, bottle shape, camera angle, object position, object scale, neutral background, shadow, label size, label layout, green leaf logo, blue sparkle, brand spelling, product wording, and color palette.

Change exactly one printed value on the front label: replace “750 mL” with “500 mL”. The final label must remain sharp and read exactly:

BRIGHTLEAF
KITCHEN CLEANER
CITRUS
500 mL

Do not change any other character, logo element, bottle geometry, component, liquid color, product count, framing, lighting, or background. Do not add props, badges, claims, or extra text. The sole intended difference is the clearly readable capacity value 750 mL becoming 500 mL.
```

Acceptance checklist:

- `750 mL` is readable in the original and `500 mL` in the candidate.
- Brand, product wording, logo, bottle, trigger, liquid, count, framing, and background match.
- No text besides the capacity value changes.
- Both complete package silhouettes remain visible.

### HOUSEHOLD-02: Background Only Changed

Purpose: provide a household-specific hard negative showing that a faithful product can PASS after scene generation.

Expected behavior: `PASS`.  
Save candidate as: `HOUSEHOLD-02-background-only.png`

#### Candidate edit prompt

```text
Edit the supplied approved BRIGHTLEAF kitchen-cleaner image. Preserve the product itself exactly: the translucent light-blue contoured bottle, pale blue liquid, white trigger sprayer, ribbed neck, internal dip tube, bottle silhouette, white label, green leaf logo, blue sparkle, and every readable character including “BRIGHTLEAF”, “KITCHEN CLEANER”, “CITRUS”, and “750 mL”. Preserve one product only and keep the bottle fully visible from the same front-facing angle at approximately the same scale.

Change only the environment. Replace the neutral studio background with a clean modern kitchen-counter scene: pale stone backsplash, light countertop, soft daylight from one side, and one distant out-of-focus green plant. Keep all background objects clearly behind the bottle and do not let them overlap any product boundary or label. Allow a natural contact shadow consistent with the new scene.

Do not alter, regenerate, recolor, relabel, reshape, crop, rotate, blur, or reflect the product. Do not add hands, cleaning cloths, fruit, extra bottles, accessories, stickers, water droplets, or foreground props. The exact BRIGHTLEAF product must remain visually faithful; the only intended change is the background and corresponding natural scene illumination.
```

Acceptance checklist:

- Every product attribute and all readable text remain faithful.
- The complete trigger, bottle, label, base, and one-product count remain visible.
- Only the background and natural scene illumination change.
- No background object overlaps the bottle or creates a false component.
- Product color remains light blue and white rather than inheriting the scene color.

## Founder Test And Handoff Procedure

For each new pair:

1. Open `https://pairvu.com`.
2. Upload the approved original on the left and the named candidate on the right.
3. Complete the security check if it appears.
4. Run one analysis and save a full-page result screenshot.
5. Record verdict, Product differences, Needs review / Could not verify, Verified, and latency if shown.
6. Click `Correct`, `False alarm`, or `Missed something` only after reviewing the result.
7. Send the candidate file plus the result screenshot to Engineering.

Acceptance gate:

- `COLOR-01`: overall FAIL; color is observed as changed and the variant text mismatch is confirmed.
- `COLOR-02`: overall REVIEW; product color is explicitly not observable, uncertain, or insufficiently covered.
- `HOUSEHOLD-01`: overall FAIL for `750 mL` to `500 mL`.
- `HOUSEHOLD-02`: overall PASS with no product issue or limitation.

If a candidate introduces unintended changes, regenerate the candidate rather than changing prompts, provider behavior, or RiskPolicy around a contaminated test fixture.
