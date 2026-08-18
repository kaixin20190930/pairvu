# Subcategory Evidence Generation Plan

Status: `FOUNDER_ACTION_REQUIRED`

Goal: create 12 new images: three originals and nine edited candidates. Use one
original plus three candidates for each planned subcategory. Do not reuse an
existing Pairvu test product.

General rule for every edit: attach the matching original and request an image
edit, not a new composition. Preserve all pixels and product attributes not
explicitly named in the edit.

## 1. Skincare Product Image QA: Portable Sunscreen Stick

### Original: `SKINCARE-01-original-sun-stick.png`

```text
Create a square 1536 x 1536 photorealistic ecommerce studio product image of one premium portable sunscreen stick in a compact oval twist-up case. The case has a distinctive smooth pebble silhouette, a matte butter-yellow body, a white rounded cap, and a small white twist dial at the base. Show the product fully assembled with the cap closed, standing upright, centered, fully visible, front-facing, and occupying about 58% of the frame height. Use a soft neutral light-gray seamless background and a subtle realistic ground shadow.

The front label must be crisp and readable. Use a fictional brand and exact text:
SOLVANE
CLEAR SUN STICK
SPF 50+
BROAD SPECTRUM
20 g

Add a simple circular sun logo above SOLVANE. Keep typography clean and dark navy. The product must read unmistakably as a portable sunscreen stick rather than a pump bottle, tube, jar, or deodorant. No hands, props, extra products, reflections that hide text, or unrelated text.
```

### FAIL: `SKINCARE-02-spf-value-changed.png`

```text
Edit the attached approved SOLVANE sunscreen-stick image. Change only the printed value “SPF 50+” to “SPF 30”. Preserve the exact oval case, closed rounded cap, twist dial, logo, brand name, all other wording, 20 g value, butter-yellow and white colors, label layout, camera angle, product size, lighting, background, and shadow. Do not add, remove, crop, reshape, or redesign anything else.
```

### PASS: `SKINCARE-03-background-only.png`

```text
Edit the attached approved SOLVANE sunscreen-stick image. Keep the complete product pixel-faithful: oval case, closed cap, twist dial, logo, every label word and value, colors, proportions, angle, and full visibility must remain unchanged. Replace only the neutral studio background with a softly blurred sunny beach-bag preparation scene using pale linen and a distant straw hat. No prop may touch or overlap the product. Maintain clear front-label readability and do not add reflections, hands, additional skincare products, or new text.
```

### REVIEW: `SKINCARE-04-lower-label-cropped.png`

```text
Edit the attached approved SOLVANE sunscreen-stick image by creating a tighter crop that keeps the sun logo, SOLVANE, CLEAR SUN STICK, and SPF 50+ visible but places the lower part of the case outside the frame so “BROAD SPECTRUM”, “20 g”, and the twist dial cannot be fully verified. Do not alter any visible product pixels, wording, logo, color, or shape. Do not zoom with generative redesign; this must look like a camera crop of the same approved image. This is an intentional coverage limitation, not a product change.
```

Expected decisions: FAIL, PASS, REVIEW.

## 2. Beverage Can Product Image QA

### Original: `BEVCAN-01-original-cold-brew.png`

```text
Create a square 1536 x 1536 photorealistic ecommerce studio image of one slim aluminum cold-brew coffee can. The can is satin deep burgundy with a cream label panel, centered, fully visible, front-facing, and occupying about 62% of frame height. Use a clean pale-gray seamless background with soft controlled studio lighting and a small natural ground shadow.

The label must be crisp and readable. Use a fictional brand and exact text:
MORROW
COLD BREW
VANILLA OAT
250 mL

Add a simple cream sunrise logo above MORROW. Use cream and muted gold typography. No condensation, props, extra cans, hands, hidden text, or unrelated wording.
```

### FAIL: `BEVCAN-02-flavor-capacity-changed.png`

```text
Edit the attached approved MORROW can image. Change only “VANILLA OAT” to “MOCHA OAT” and “250 mL” to “330 mL”. Preserve the exact can shape, burgundy and cream colors, sunrise logo, MORROW and COLD BREW wording, typography placement, camera angle, scale, lighting, background, and shadow. Do not change any other attribute.
```

### PASS: `BEVCAN-03-condensation-only.png`

```text
Edit the attached approved MORROW can image. Keep the can identity, logo, every word and printed value, colors, proportions, front-facing angle, and full visibility unchanged. Add only realistic fine condensation droplets and a slightly cooler studio highlight on the metal surface. All label text must remain readable. Do not change the background, product count, packaging, or design.
```

### REVIEW: `BEVCAN-04-capacity-obscured-by-glare.png`

```text
Edit the attached approved MORROW can image. Preserve the can, logo, brand, flavor, colors, shape, framing, and all printed content. Add a physically plausible narrow specular glare across the bottom label region that makes only the “250 mL” value unreadable while MORROW, COLD BREW, and VANILLA OAT remain clear. Do not replace or alter the printed value. This is an observability limitation caused only by glare.
```

Expected decisions: FAIL, PASS, REVIEW.

## 3. Cleaning Product Image QA: Concentrated Laundry Sheets

### Original: `CLEANING-01-original-laundry-sheets.png`

```text
Create a square 1536 x 1536 photorealistic ecommerce studio image of one premium box of concentrated laundry detergent sheets. The package must be a slim, low-profile, rigid book-style paper carton with a visible narrow spine, a magnetic fold-over front flap, rounded outer corners, and a small semicircular thumb notch. It must not look like a stand-up pouch, cereal box, bottle, jar, tube, or ordinary shipping box. Use a matte sea-glass green carton with a cream front panel. Show the closed carton standing at a slight three-quarter angle so both the broad front face and thin spine are visible. Center it, keep it fully visible, and let it occupy about 58% of the frame. Use a clean light-gray seamless background and a subtle ground shadow.

The front label must be crisp and readable. Use a fictional brand and exact text:
FOLDWELL
LAUNDRY SHEETS
FRESH LINEN
30 SHEETS
UP TO 60 LOADS

Add a simple folded-ribbon logo above FOLDWELL. Keep all text crisp and readable. Include a small line illustration of one folded detergent sheet beneath the product name. No plastic pouch, liquid bottle, pods, hands, loose sheets, props, extra products, hidden edges, unrelated text, or strong glare.
```

### FAIL: `CLEANING-02-scent-and-count-changed.png`

```text
Edit the attached approved FOLDWELL laundry-sheets image. Change only “FRESH LINEN” to “UNSCENTED” and “30 SHEETS” to “20 SHEETS”. Preserve “FOLDWELL”, “LAUNDRY SHEETS”, “UP TO 60 LOADS”, the folded-ribbon logo, sheet illustration, exact book-style carton shape, flap, spine, thumb notch, sea-glass green and cream colors, typography placement, camera angle, scale, lighting, background, and shadow. Do not open the box, add sheets, alter the load claim, or change anything else.
```

### PASS: `CLEANING-03-background-only.png`

```text
Edit the attached approved FOLDWELL laundry-sheets image. Keep the complete product pixel-faithful: rigid book-style carton, fold-over flap, thin spine, thumb notch, logo, sheet illustration, every word and value, sea-glass green and cream colors, proportions, angle, and full visibility must stay unchanged. Replace only the neutral studio background with a softly blurred modern laundry-room shelf scene with pale tiles and folded white towels in the distance. Do not add other cleaning products, loose sheets, hands, reflections, or objects touching or hiding the carton.
```

### REVIEW: `CLEANING-04-back-view.png`

```text
Edit the attached approved FOLDWELL laundry-sheets image into a realistic rear-view photograph of the same closed book-style carton. Preserve the sea-glass green material, thin rigid profile, rounded corners, fold-over flap construction, scale, lighting, and neutral studio setting. The front logo, FOLDWELL name, FRESH LINEN variant, 30 SHEETS count, and UP TO 60 LOADS claim must not be visible because the carton is turned around. Show a restrained cream rear information panel with small unreadable placeholder lines and simple usage icons, without inventing another brand or changing the package structure. Keep the entire carton visible. This candidate intentionally tests whether front-face identity and printed values are not observable from a different package face.
```

Expected decisions: FAIL, PASS, REVIEW.

Delivery status (2026-08-18): `DONE`. The founder-reviewed FOLDWELL pairs produced the expected FAIL, PASS, and REVIEW outcomes and are published in the SEO registry as:

- `/examples/laundry-sheets-scent-count-change`
- `/examples/laundry-sheets-background-change`
- `/examples/laundry-sheets-back-view-review`

The evidence is integrated into the Examples hub and Household Packaged Goods flagship. This does not unblock or publish a separate Cleaning Product subcategory page.

## 4. Delivery And Acceptance

Place the 12 files in one folder using the exact filenames above. Before page
publication, each pair will be run through Pairvu and recorded with:

- expected and observed verdict;
- confirmed differences;
- observability limitations;
- false positives or missed changes;
- founder approval for public editorial use.

If an image generator changes any unrequested text, logo, component, shape, or
color, reject that asset and regenerate it. A multi-variable image cannot serve
as controlled evidence for a single intended role.
