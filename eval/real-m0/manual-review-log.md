# M0 Real-Image Manual Review Log

Last updated: 2026-07-28

This log records founder-reviewed, single-variable cases run through the real
`OpenAIVisionProvider -> QAEngine -> M0RiskPolicy` product flow.

| Case | Category | Intended variable | Expected | Actual | Review status |
| --- | --- | --- | --- | --- | --- |
| T01 | Beverage | Printed net-volume value | FAIL | FAIL | Valid / correct |
| T02 | Cosmetics | Logo symbol | FAIL | FAIL | Valid / correct |
| T03 | Personal care | Container shape | FAIL | FAIL | Valid / correct after `003` fix |
| T04 | Cosmetics | Major package color | Not PASS | REVIEW | Valid / correct |
| T05 | Household cleaning | Missing trigger sprayer | Not PASS | REVIEW | Valid / correct after `004` fix |
| T06 | Cosmetics | Extra applicator spoon | Not PASS | REVIEW | Valid / correct |
| T07 | Packaged food | Primary product count | Not PASS | REVIEW | Valid / correct |
| T08 | Beverage | Identical image control | PASS | PASS | Valid / correct |
| T09 | Cosmetics | Background-only scene change | PASS | PASS | Valid / correct |
| T10 | Personal care | Lighting / color-temperature change | PASS | PASS | Valid / correct |
| T11 | Beverage | Moderate shadow / reflection change | PASS | PASS | Valid / correct |
| T12 | Packaged food | Product repositioning and scale | PASS | PASS | Valid / correct with documented fixture confound |
| T13 | Household cleaning | Large front-to-back viewpoint change | REVIEW | REVIEW | Valid / correct after prompt `005` fix |
| T14 | Beverage | Brand-text occlusion | REVIEW | REVIEW | Valid / correct after prompt `006`; Logo remained observable |
| T15 | Packaged food | Pixelated / unreadable identity text | REVIEW | REVIEW | Valid / correct after deterministic degradation |
| T16 | Personal care | Partially visible / frame-cropped product | REVIEW | REVIEW | Valid / correct after prompt `007` fix |

## T03 Packaging / Shape Change

Founder review date: 2026-07-28

Reference:

- amber cylindrical shampoo bottle;
- cream label;
- black pump.

Candidate:

- amber rectangular shampoo bottle with sharper edges;
- same cream label;
- same black pump.

Observed result:

- verdict: `FAIL`;
- one `packaging_mismatch`;
- severity/confidence: critical/high;
- source family: `major_shape_packaging`;
- difference kind: `shape_changed`;
- limitations: none.

Cleanly verified:

- logo;
- visible text;
- quantity;
- dominant color;
- major components.

Regression conclusions:

- no false `missing_component`;
- no false color issue;
- no duplicate finding;
- product issue and evidence are internally consistent;
- refresh restored both private image previews;
- public result omitted internal provider/model/prompt telemetry.

Founder label: `Correct`.

## T08 Identical Image Control

Founder review date: 2026-07-28

Reference and candidate:

- the exact same Nova Fizz beverage-can image;
- identical product, background, framing, text, logo, color, quantity,
  components, and package shape.

Observed result:

- verdict: `PASS`;
- product issues: none;
- limitations: none;
- all six M0 check families returned match/high.

Cleanly verified:

- logo;
- visible wording and printed values;
- quantity;
- dominant package color;
- major components;
- major package shape.

Regression conclusions:

- the exact-duplicate baseline correctly passed;
- no false positive or excessive review behavior occurred;
- the provider again returned `status = match` with
  `differenceKind = text_changed` for visible text even though all observations
  and evidence stated that the text matched;
- QA engine `m0-qa-engine-003` now deterministically canonicalizes every match
  observation to `differenceKind = none` while preserving contradictory
  provider values in raw audit evidence;
- the normalization is covered by a targeted regression and does not change
  Prompt, RiskPolicy, or verdict behavior;
- no paid T08 rerun is required for this deterministic post-provider fix.

Founder label: `Correct`.

## T14 Logo / Brand-Text Occlusion

Founder review date: 2026-07-28

Reference:

- Nova Fizz beverage can with Logo and brand wording fully visible.

Candidate:

- the same can with a white square covering most of the Logo and brand wording;
- descriptive wording, quantity, colors, components, and can shape otherwise
  unchanged.

Observed result before fix:

- verdict: `FAIL`, violating expected `REVIEW` behavior;
- one critical/high `logo_mismatch` with `brand_changed`;
- one critical/high `text_mismatch` with `text_changed`;
- no observability limitation;
- quantity, dominant color, major components, and package shape matched.

Failure analysis:

- the provider correctly identified that the white square covered the original
  content;
- it incorrectly treated covered content as changed content;
- occlusion provides no evidence that the underlying Logo or text was replaced;
- RiskPolicy correctly failed the two critical mismatch observations it
  received, so the root cause is the observation prompt.

Scoped remediation in prompt `m0-real-mvp-006`:

- classify stickers, masks, crops, hands, glare, reflections, and other covering
  objects as observability conditions;
- require `not_observable` with partial/insufficient coverage and
  `not_visible`/`unreadable` when corresponding identity content is covered;
- prohibit `brand_changed`, `text_changed`, and `value_changed` solely because
  content is obscured;
- require replacement identity content to be directly visible before reporting
  a mismatch.

Rerun acceptance:

- verdict must be `REVIEW`;
- no Product differences;
- Logo and visible text must be observability/coverage limitations;
- quantity, dominant color, major components, and package shape must remain
  verified.

Founder feedback for the initial run: `False alarm`.

Rerun result:

- verdict: `REVIEW`, matching expected behavior;
- product issues: none;
- visible text: high-confidence `attribute_not_observable` with
  `differenceKind = not_visible`;
- the evidence correctly states that the white square obstructs `NOVA FIZZ`
  while other wording and values remain visible;
- Logo: match/high because the star-shaped Logo remained sufficiently visible
  and identifiable above the covered brand wording;
- quantity, dominant color, major components, and package shape remained
  match/high.

Fixture clarification:

- the intended case name was partial Logo occlusion;
- the actual mask primarily covered brand text while leaving the star Logo
  sufficiently observable;
- the result therefore validates identity-text occlusion behavior, not a
  dedicated severe Logo-occlusion threshold;
- this coverage gap is documented but does not require another paid rerun for
  the M0 smoke test.

Regression conclusion:

- both original critical false alarms are resolved;
- the checker conservatively reviewed the obscured text without over-reporting
  the still-observable Logo;
- T14 is accepted and the matrix may continue.

Founder label for the rerun: `Correct`.

## T15 Tiny / Unreadable Text

Founder review date: 2026-07-28

Intended condition:

- candidate text should be too small or degraded to read reliably;
- expected verdict is `REVIEW`, without a text mismatch.

Observed result:

- verdict: `PASS`;
- no product issue or limitation;
- all six check families returned match/high;
- the provider independently reported the same brand, product wording,
  `WHOLE GRAIN`, and `300 g`.

Source-asset inspection:

- both reference and candidate files are `1254 x 1254`;
- the candidate product is small in the composition but still retains roughly
  a hundred pixels of package width;
- at original resolution, the key wording and value remain visibly readable;
- the webpage preview makes the product look much smaller than the source image
  OpenAI receives with high-detail inspection.

Conclusion:

- this is not a confirmed product false PASS;
- the fixture changed composition and scale but did not reliably destroy text
  information;
- the initial result may be labeled `Correct`, but that first fixture cannot be
  accepted as an unreadable-text observability case;
- no Prompt, QAEngine, or RiskPolicy change is justified.

Rerun fixture requirement:

- use deterministic downsampling rather than generative resizing;
- downsample the source to approximately `90 x 90`, then upscale back to the
  original canvas size so glyph information is genuinely lost;
- preserve approximate Logo, quantity, product colors, count, components, and
  package shape;
- expected result remains `REVIEW` with visible text not observable and no
  product difference.

Rerun result:

- verdict: `REVIEW`, matching expected behavior;
- product issues: none;
- Logo/brand identity: high-confidence `attribute_not_observable` because the
  graphical area remains visible but the brand name is pixelated;
- visible text: high-confidence `attribute_not_observable` because candidate
  wording and values cannot be transcribed reliably;
- quantity, dominant color, major components, and package shape remained
  match/high;
- the checker did not infer candidate wording from the readable reference and
  did not fabricate a text mismatch.

Regression conclusion:

- the deterministically degraded fixture successfully tested the intended
  unreadable-text behavior;
- the original readable-fixture PASS was correctly distinguished from this
  genuine observability REVIEW;
- no Prompt, QAEngine, or RiskPolicy change is required;
- T15 is accepted and the matrix may continue.

Founder label for the rerun: `Correct`.

## T16 Partially Visible Product

Founder review date: 2026-07-28

Reference:

- full Mireva shampoo bottle visible from pump to base;
- complete front label and outer silhouette visible.

Candidate:

- enlarged/cropped view showing the pump and upper bottle;
- lower label, printed values, bottle base, and lower silhouette extend outside
  the image frame.

Observed result before fix:

- verdict: `PASS`, violating expected `REVIEW` behavior;
- no product issue or limitation;
- all six check families returned match/high;
- candidate evidence incorrectly claimed that hidden wording including
  `FOR NORMAL HAIR` and `500 mL` was visible;
- quantity evidence incorrectly described a fully visible bottle;
- packaging evidence incorrectly described the complete cylindrical
  silhouette despite the missing base.

Failure analysis:

- the provider used readable reference content to autocomplete candidate
  details outside the frame;
- crop-induced missing coverage was incorrectly treated as sufficient;
- this is unsupported evidence and a critical false PASS;
- the correct response is observability review, not a product mismatch.

Scoped remediation in prompt `m0-real-mvp-007`:

- inspect and describe the candidate independently before comparison;
- prohibit reference-based completion of candidate text, parts, and silhouette;
- when the frame cuts through the product, mark checks that depend on the
  missing region partial/insufficient;
- require independently legible candidate text before visible-text match;
- require the full outer boundary before major-shape match;
- prohibit missing-component or shape-change findings caused solely by crop.

Rerun acceptance:

- verdict must be `REVIEW`;
- no Product differences;
- visible text must be an observability/coverage limitation;
- major package shape must be an observability/coverage limitation;
- Logo, quantity, dominant color, and directly visible components may remain
  verified when independently supported;
- candidate evidence must not claim visibility of text or boundaries outside
  the frame.

Founder feedback for the initial run: `Missed something`.

Rerun result:

- verdict: `REVIEW`, matching expected behavior;
- product issues: none;
- visible text: high-confidence `coverage_insufficient` because the cropped
  candidate does not show the complete front-label wording and values;
- major package shape: high-confidence `coverage_insufficient` because the
  bottle base and complete silhouette are outside the frame;
- Logo, quantity, dominant color, and directly visible major components
  remained match/high;
- candidate evidence correctly limits itself to visible content and explicitly
  states that the lower base and complete label are cropped.

Regression conclusion:

- the original unsupported evidence and false PASS are resolved;
- crop is no longer converted into a missing component, text mismatch, or shape
  mismatch;
- no further Prompt, QAEngine, or RiskPolicy change is required for T16;
- T16 is accepted and the 16-case real-image matrix is complete.

Founder label for the rerun: `Correct`.

## T13 Large Viewpoint Difference

Founder review date: 2026-07-28

Reference:

- Brightleaf kitchen-cleaner bottle viewed from the front;
- front identity label and logo visible.

Candidate:

- the same bottle viewed from the back;
- back label visible while the corresponding front identity surface is hidden.

Observed result before fix:

- verdict: `FAIL`, violating expected `REVIEW` behavior;
- one critical/high `text_mismatch`;
- one high-confidence Logo coverage limitation;
- quantity, dominant color, major components, and package shape matched;
- no system execution error.

Failure analysis:

- the provider correctly treated the hidden front Logo as insufficiently
  observable;
- it incorrectly compared front-label wording with unrelated back-label
  wording and reported `text_changed`;
- the RiskPolicy then correctly converted that high-confidence, sufficiently
  observable critical mismatch into `FAIL`;
- root cause is missing corresponding-package-face gating in the observation
  prompt, not a RiskPolicy mapping defect.

Scoped remediation in prompt `m0-real-mvp-005`:

- establish corresponding package-face or identity-region comparability before
  comparing Logo or visible text;
- treat front-versus-back text surfaces as non-corresponding;
- when the corresponding surface is hidden by a large viewpoint difference,
  return `not_observable` with partial/insufficient coverage;
- prohibit `text_changed` or `value_changed` solely because different package
  faces contain different text;
- preserve same-face, sufficiently observable text/value mismatch behavior.

Rerun acceptance:

- verdict must be `REVIEW`;
- no `text_mismatch` or other product issue;
- Logo and visible text should appear as observability/coverage limitations;
- quantity, dominant color, major components, and package shape should remain
  verified.

Founder feedback for the initial run: `False alarm`.

Rerun result:

- verdict: `REVIEW`, matching expected behavior;
- product issues: none;
- Logo: high-confidence `attribute_not_observable`, because the candidate shows
  the back and the corresponding front Logo is hidden;
- visible text: high-confidence `attribute_not_observable`, because front and
  back labels are non-corresponding surfaces;
- difference kind for both limitations: `not_visible`;
- quantity, dominant color, major components, and package shape remained
  match/high;
- no duplicate finding or excessive limitation was produced.

Regression conclusion:

- the original false `text_mismatch` and `FAIL` are resolved;
- same-face critical text mismatch behavior remains covered by the controlled
  evaluation;
- T13 is accepted and the matrix may continue.

Founder label for the rerun: `Correct`.

## T12 Product Repositioning / Scale Change

Founder review date: 2026-07-28

Reference:

- one Grainly Honey Oat Bites box, large and centered in frame.

Candidate:

- the same box shifted left of center and shown substantially smaller;
- product identity, printed content, count, colors, components, and packaging
  structure unchanged.

Observed result:

- verdict: `PASS`;
- product issues: none;
- limitations: none;
- all six M0 check families returned match/high;
- all match observations used `differenceKind = none`.

Cleanly verified:

- logo;
- visible wording and `300 g` value;
- quantity;
- cream, orange, and dark-green package colors;
- box panels and package components;
- rectangular box shape and silhouette.

Fixture note:

- the intended variable was horizontal repositioning;
- the image generator also reduced product scale substantially, so this is not
  a strict single-variable fixture;
- because both changes are benign composition changes and this is an M0 smoke
  test rather than a new benchmark, the case is accepted as a real-world
  reframing hard negative instead of requiring another paid rerun.

Regression conclusions:

- position and scale changes did not create identity, text, quantity, color,
  component, or shape false alarms;
- the smaller candidate remained sufficiently observable;
- no excessive `REVIEW` behavior occurred;
- no Prompt, QAEngine, or RiskPolicy change is required.

Founder label: `Correct`.

## T11 Moderate Shadow / Reflection Change

Founder review date: 2026-07-28

Reference:

- Nova Fizz beverage can under neutral studio lighting;
- plain light-gray background and soft base shadow.

Candidate:

- the same can with stronger window-grid shadows, floor shadows, and specular
  highlights;
- product identity and packaging content unchanged.

Observed result:

- verdict: `PASS`;
- product issues: none;
- limitations: none;
- all six M0 check families returned match/high;
- all match observations used `differenceKind = none`.

Cleanly verified:

- logo;
- visible wording and `330 mL` value;
- quantity;
- turquoise, white, and silver product colors;
- can body and standard can components;
- cylindrical can shape and silhouette.

Regression conclusions:

- moderate shadows and highlights did not create a color, component, or shape
  false alarm;
- background window shadows were not treated as product graphics;
- no excessive `REVIEW` behavior occurred;
- this case does not validate severe glare that obscures product information;
  that condition remains an observability case expected to produce `REVIEW`;
- no Prompt, QAEngine, or RiskPolicy change is required.

Founder label: `Correct`.

## T10 Lighting / Color-Temperature Change

Founder review date: 2026-07-28

Reference:

- Mireva shampoo bottle under neutral/cool studio lighting;
- light-gray background.

Candidate:

- the same shampoo bottle under warmer lighting;
- warm beige background and altered overall exposure;
- product identity and structure unchanged.

Observed result:

- verdict: `PASS`;
- product issues: none;
- limitations: none;
- all six M0 check families returned match/high;
- all match observations used `differenceKind = none`.

Cleanly verified:

- logo;
- visible wording and `500 mL` value;
- quantity;
- amber bottle, black pump, and cream-label product colors;
- bottle, pump, and label components;
- cylindrical bottle and pump packaging shape.

Regression conclusions:

- lighting and color-temperature changes did not produce a product-color false
  alarm;
- background tone did not contaminate the dominant product-color check;
- no excessive `REVIEW` behavior occurred;
- no Prompt, QAEngine, or RiskPolicy change is required.

Founder label: `Correct`.

## T09 Background-Only Scene Change

Founder review date: 2026-07-28

Reference:

- Elara cosmetic serum bottle on a plain light-gray studio background.

Candidate:

- the same serum bottle in a bathroom scene with marble, plants, and distant
  accessories;
- product identity, wording, value, color, count, components, and package shape
  unchanged.

Observed result:

- verdict: `PASS`;
- product issues: none;
- limitations: none;
- all six M0 check families returned match/high;
- all match observations used `differenceKind = none`.

Cleanly verified:

- logo;
- visible wording and `30 mL` value;
- quantity;
- product and package dominant color;
- bottle and dropper components;
- package shape and silhouette.

Regression conclusions:

- a substantial background-only scene change did not create a false alarm;
- scene colors and background objects did not contaminate the product color or
  component checks;
- the product's smaller framing in the candidate remained sufficiently
  observable;
- no excessive `REVIEW` behavior occurred.

Founder label: `Correct`.

## T07 Primary Product Quantity Change

Founder review date: 2026-07-28

Reference:

- one Grainly Honey Oat Bites product box;
- one visible primary product unit.

Candidate:

- two matching Grainly Honey Oat Bites boxes side by side;
- wording, values, color scheme, components, and box design unchanged.

Observed result:

- verdict: `REVIEW`, satisfying expected Not PASS behavior;
- one `quantity_mismatch`;
- severity/confidence: high/high;
- source family: `quantity`;
- difference kind: `count_changed`;
- limitations: none.

Cleanly verified:

- logo;
- visible wording and printed values;
- dominant package color;
- major component types;
- major package shape.

Regression conclusions:

- one-to-two primary-product count change was detected;
- the second identical product was not duplicated as an extra component;
- component and package-shape checks explicitly preserved their family
  boundaries despite the count change;
- all match observations used `differenceKind = none`;
- one underlying count change produced one user-facing issue.

Founder label: `Correct`.

## T05 Missing Trigger Sprayer

Founder review date: 2026-07-28

Reference:

- translucent blue kitchen-cleaner bottle;
- white trigger sprayer attached;
- product label visible.

Candidate:

- same bottle and label;
- threaded bottle neck and open attachment area directly visible;
- trigger sprayer absent.

Observed result before fix:

- verdict: `PASS`, violating expected Not PASS behavior;
- no product issue;
- `major_components` incorrectly returned match/high;
- candidate evidence falsely claimed that a spray nozzle was visible;
- limitations: none.

Classification:

- critical false PASS;
- Vision observation failure and unsupported evidence claim;
- not a RiskPolicy mapping failure.

Scoped remediation in prompt `m0-real-mvp-004`:

- explicitly label reference and candidate image roles;
- send both images with high visual detail;
- inventory components independently for each image;
- prohibit copying or inferring components from the other image or product type;
- treat a clearly exposed threaded neck/open attachment area as direct evidence
  that an attached cap, trigger sprayer, pump, or nozzle is absent.

Rerun acceptance:

- verdict must not be `PASS`;
- exactly one `missing_component` issue is preferred;
- source family must be `major_components`;
- difference kind must be `component_missing`;
- candidate evidence must state that the trigger sprayer is absent and the
  threaded/open neck is visible;
- no color, quantity, logo, text, or packaging-shape false positive.

Rerun result:

- verdict: `REVIEW`, satisfying expected Not PASS behavior;
- one `missing_component`;
- severity/confidence: high/high;
- source family: `major_components`;
- difference kind: `component_missing`;
- reference evidence: white trigger sprayer attached;
- candidate evidence: threaded/open bottle neck visible and no trigger sprayer
  attached;
- limitations: none.

Cleanly verified:

- logo;
- visible wording and values;
- quantity;
- dominant bottle-body color;
- bottle shape and packaging.

Regression conclusions:

- the original critical false PASS is resolved;
- evidence is grounded in the candidate image;
- no duplicate component/shape/color finding;
- one underlying missing component produced one user-facing issue;
- `REVIEW` is expected because missing components are high severity but not an
  automatic critical-fail family in the current M0 policy.

Non-blocking consistency finding:

- `visible_text` returned `status = match` but
  `differenceKind = text_changed`;
- its observations and evidence all state that wording and values match;
- this did not affect the T05 verdict, but match/difference-kind consistency
  should be monitored in subsequent cases and normalized or rejected if it
  repeats.

Founder label: `Correct`.

## T06 Extra Applicator Component

Founder review date: 2026-07-28

Reference:

- one frosted cosmetic serum bottle;
- white dropper cap attached;
- no separate applicator beside the bottle.

Candidate:

- same serum bottle and dropper;
- one additional white plastic applicator spoon leaning beside the bottle.

Observed result:

- verdict: `REVIEW`, satisfying expected Not PASS behavior;
- one `extra_component`;
- severity/confidence: high/high;
- source family: `major_components`;
- difference kind: `component_extra`;
- limitations: none.

Cleanly verified:

- logo;
- visible wording and printed values;
- primary-product quantity;
- dominant bottle/package color;
- major bottle shape and packaging.

Regression conclusions:

- the additional applicator was detected with grounded evidence;
- the accessory was not incorrectly counted as a second primary product;
- no duplicate component/quantity/shape finding;
- all match observations used `differenceKind = none`;
- one underlying added component produced one user-facing issue.

Founder label: `Correct`.

## T04 Major Package Color Change

Founder review date: 2026-07-28

Reference:

- frosted cosmetic serum bottle;
- light neutral label with orange identity accents;
- white dropper cap.

Candidate:

- same frosted serum bottle and dropper;
- large label region changed to dark green;
- same logo identity, wording, values, shape, and components.

Observed result:

- verdict: `REVIEW`, satisfying the expected Not PASS behavior;
- one `color_mismatch`;
- severity/confidence: high/high;
- source family: `dominant_color`;
- difference kind: `color_changed`;
- limitations: none.

Cleanly verified:

- logo;
- visible text;
- quantity;
- major components;
- major shape and packaging.

Regression conclusions:

- the material package-palette change was detected;
- logo identity and visible wording were not duplicated as separate findings;
- no component or shape false positive;
- one underlying change produced one user-facing issue;
- `REVIEW` is expected under the current M0 policy because color mismatch is
  high severity but not a critical automatic-fail family.

Founder label: `Correct`.
