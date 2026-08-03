# Product Logo, Product Color, and Household Evidence Audit

Status date: 2026-08-03  
Owner: Founder / Product / Engineering  
Scope: Evidence gates for `/checks/product-logo`, `/checks/product-color`, and the Household Packaged Goods category flagship.

## Decision Summary

| Surface | Status | Decision |
| --- | --- | --- |
| Product Logo | `IMPLEMENTED / AWAITING DEPLOY` | Existing evidence is sufficient and distinct. The page passed the check-content gate, full SEO inventory, production build, and 1280px/390px responsive QA. |
| Product Color | `BLOCKED ON TWO CANDIDATES` | A color-only change currently produces REVIEW by design. Publish only after a mixed color-plus-variant case produces overall FAIL and a reflection-limited candidate produces REVIEW. |
| Household Packaged Goods | `BLOCKED ON TWO CANDIDATES` | Existing missing-trigger and large-viewpoint cases both produce REVIEW. Add one capacity-change FAIL and one background-only PASS to create a complete, category-specific verdict set. |

Do not change `M0RiskPolicy` to force a color-only FAIL. Under `m0-risk-policy-003`, `color_mismatch` is high severity rather than critical, so a sufficiently observable color mismatch contributes REVIEW. The Product Color page must explain this product boundary honestly.

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
