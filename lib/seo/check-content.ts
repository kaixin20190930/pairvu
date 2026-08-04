export type CheckDecision = "PASS" | "REVIEW" | "FAIL";
export type CheckEvidenceRole = "product_change" | "hard_negative" | "observability";

export type CheckPageContent = {
  route: string;
  founderApprovedAt: string;
  audience: string;
  directAnswer: string;
  scopeDistinction: string;
  deck: string;
  dimensions: Array<{ title: string; definition: string; example: string }>;
  decisionRules: Array<{ condition: string; pass: string; review: string; fail: string }>;
  evidence: Array<{
    href: string;
    title: string;
    role: CheckEvidenceRole;
    decision: CheckDecision;
    original: string;
    candidate: string;
    alt: string;
    observation: string;
    whyThisDecision: string;
    nextAction: string;
  }>;
  diagnosticQuestions: Array<{ question: string; reason: string }>;
  failureModes: Array<{ title: string; mechanism: string; consequence: string }>;
  workflow: Array<{ title: string; detail: string }>;
  limitations: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const checkPageContents: readonly CheckPageContent[] = [
  {
    route: "/checks/product-quantity",
    founderApprovedAt: "2026-08-03",
    audience:
      "Brand managers, ecommerce operators, catalog teams, creative agencies, and production reviewers who need to confirm that an AI-generated or edited product image still represents the approved amount, package count, included unit count, and commercial offer before the image is published.",
    directAnswer:
      "To check product quantity in an AI image, compare four facts separately: the numeric amount printed on each package, the number of primary sellable packages shown, the number of included product units or components, and the commercial pack configuration. PASS only when every required quantity fact is visible and matches. Use REVIEW when count or text cannot be verified, and FAIL when an approval-critical printed amount is visibly changed.",
    scopeDistinction:
      "Product quantity is not one field. A 330 mL label describes contents per package; two cans in the scene describe visible package count; six sachets inside a box describe included unit count; and a shrink-wrapped six-pack describes a commercial configuration. Pairvu compares visible evidence only. It does not infer physical fill level, hidden contents, inventory, price entitlement, or what will actually ship.",
    deck:
      "AI can change quantity without changing the rest of the product. A printed 330 mL value can become 500 mL, one approved box can become two, or a crop can hide the only value that proves the candidate is correct. This check separates those cases so a faithful image can pass, an unverified amount can be reviewed, and a confirmed value change can be corrected.",
    dimensions: [
      {
        title: "Printed amount per package",
        definition:
          "The readable number and unit printed on one sellable package, such as 330 mL, 500 g, 12 oz, 30 mL, or 100 count. This is product information embedded in visible label artwork.",
        example:
          "A beverage can that changes from 330 mL to 500 mL has a printed-amount mismatch even though exactly one can appears in both images.",
      },
      {
        title: "Visible primary package count",
        definition:
          "The number of complete primary boxes, bottles, cans, jars, tubes, pouches, or other sellable packages presented in the image. It is counted from scene objects, not label text.",
        example:
          "One 300 g food box becoming two 300 g boxes changes the visible offer while the printed amount on each box remains accurate.",
      },
      {
        title: "Included unit or component count",
        definition:
          "The number of product units, pieces, accessories, applicators, or discrete included components that are visible and intended to belong to the approved product set.",
        example:
          "A candidate that adds a second bottle, removes a spray trigger, or adds a separate applicator changes what the image says is included, even if the primary package count appears stable.",
      },
      {
        title: "Commercial pack configuration",
        definition:
          "The way units are grouped and offered: single item, bundle, twin pack, multipack carton, tray, shrink wrap, or another visible retail configuration. Configuration is not reducible to object count alone.",
        example:
          "Six loose cans and one branded six-pack carton may contain the same number of cans but represent different approved packaging and offer structures.",
      },
      {
        title: "Quantity observability",
        definition:
          "Whether the image supplies enough resolution, coverage, separation, and corresponding package faces to read printed values and count every required primary unit without guessing.",
        example:
          "A recognizable box with pixelated 300 g text can support a shape observation but cannot support a printed-quantity PASS.",
      },
    ],
    decisionRules: [
      {
        condition: "Printed amount and unit",
        pass: "The same approval-critical number and unit are readable on corresponding package regions in both images.",
        review: "The amount region is hidden, pixelated, blurred, too small, curved away, reflected, or outside the candidate crop.",
        fail: "The candidate visibly changes the approved number or unit, such as 330 mL becoming 500 mL or 300 g becoming 500 g.",
      },
      {
        condition: "Primary package count",
        pass: "The same number of complete primary sellable packages is clearly visible in the approved image and candidate.",
        review: "Overlap, crop, occlusion, reflections, props, or partial package boundaries make the exact primary count uncertain.",
        fail: "The workflow or policy marks a clearly duplicated or removed primary package as a confirmed unacceptable offer change.",
      },
      {
        condition: "Included components",
        pass: "The same required product units and major included components remain present with no visible additions or omissions.",
        review: "A component may be hidden behind the package, outside the frame, or ambiguous as a prop rather than part of the offer.",
        fail: "A required visible unit or component is confirmed missing, or an unapproved product unit is visibly added to the set.",
      },
      {
        condition: "Pack configuration",
        pass: "The visible single, bundle, multipack, tray, sleeve, or wrapped configuration matches the approved commercial presentation.",
        review: "The grouping boundary, outer wrap, carton, or relationship between visible units cannot be established from the candidate.",
        fail: "The image clearly changes the approved commercial configuration, such as a single unit becoming a branded twin pack.",
      },
      {
        condition: "Position and perspective",
        pass: "Units move, scale, or turn slightly while count, printed amount, included set, and configuration remain observable and unchanged.",
        review: "The new angle hides a quantity-bearing face or causes units to overlap enough that count can no longer be verified.",
        fail: "The composition change also introduces a confirmed quantity, component, or offer change rather than merely moving the same units.",
      },
      {
        condition: "Resolution and text readability",
        pass: "Quantity-bearing characters are directly readable and the package layout provides supporting location context.",
        review: "The package is recognizable but the pixels do not support an exact reading of the quantity number or unit.",
        fail: "Readable quantity text is present in both images and the candidate text is confirmed to contain a different value.",
      },
      {
        condition: "Unchanged baseline",
        pass: "The same image or a faithful candidate preserves every observable quantity layer without inventing extra units or altered values.",
        review: "A supposedly unchanged candidate omits the package region or object boundary needed to confirm a quantity layer.",
        fail: "Direct comparison reveals that the candidate is not actually unchanged and contains a confirmed quantity difference.",
      },
    ],
    evidence: [
      {
        href: "/examples/label-value-change-ai-product-image",
        title: "Printed capacity changed from 330 mL to 500 mL",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/label-value-change/candidate.jpg",
        alt: "NOVA FIZZ can with printed capacities of 330 mL and 500 mL",
        observation:
          "Both images show one NOVA FIZZ can with the same star mark, LIME SPARKLING WATER wording, ZERO SUGAR text, turquoise color, dotted pattern, and package shape. The only controlled change is the readable capacity at the bottom: 330 mL in the approved original and 500 mL in the candidate.",
        whyThisDecision:
          "This is a confirmed printed-amount mismatch, not a product-count difference or visibility limitation. The relevant text is readable in both images, so REVIEW would understate the available evidence and PASS would publish a wrong customer-facing value.",
        nextAction:
          "Correct the candidate artwork or regenerate the image with 330 mL preserved, then compare the corrected export again before publishing.",
      },
      {
        href: "/examples/product-count-change-ai-image",
        title: "Visible package count changed from one box to two",
        role: "product_change",
        decision: "REVIEW",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/product-count-change/candidate.jpg",
        alt: "One GRAINLY food box compared with two matching boxes",
        observation:
          "The approved image contains one complete GRAINLY HONEY OAT BITES box. The candidate contains two. Each package keeps the 300 g value, logo, product wording, color blocks, and carton design, which proves that printed amount per package did not change while visible primary package count did.",
        whyThisDecision:
          "The observed Pairvu result is REVIEW under the current M0 policy: the candidate must not automatically PASS as the same single-package composition, but the tool does not know whether the user intentionally requested a two-box offer. Human confirmation of the intended offer is required.",
        nextAction:
          "If the intended listing is one box, remove the duplicate and rerun the check. If two boxes are intentional, use an approved two-package reference so the commercial offer is explicit rather than inferred.",
      },
      {
        href: "/examples/product-repositioning-perspective-change",
        title: "One box moved and turned without changing quantity",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/reposition-perspective/perspective.jpg",
        alt: "One GRAINLY food box shown front-on and at a slight perspective angle",
        observation:
          "The candidate changes location, apparent scale, and minor perspective while retaining exactly one complete box. GRAINLY, HONEY OAT BITES, WHOLE GRAIN, and 300 g remain visible together with the same carton structure and color hierarchy.",
        whyThisDecision:
          "Position is not quantity. Every required quantity layer remains observable and unchanged, so treating ordinary recomposition as a count mismatch would create a false alarm and unnecessary production work.",
        nextAction:
          "Accept the quantity check and continue reviewing other attributes or channel-specific composition requirements separately.",
      },
      {
        href: "/examples/unreadable-product-label-text",
        title: "The package remained recognizable but 300 g was unreadable",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/unreadable-text/candidate.jpg",
        alt: "Readable GRAINLY package and a pixelated candidate with unreadable quantity text",
        observation:
          "The candidate still appears to show one rectangular box with the same cream, orange, and dark-green regions. However, brand, product wording, and the lower printed value are pixelated enough that an exact 300 g reading cannot be supported from the supplied pixels.",
        whyThisDecision:
          "A familiar layout can support package-count and shape observations but cannot prove exact quantity text. FAIL would invent a changed value, while PASS would pretend unreadable text had been verified. REVIEW preserves that distinction.",
        nextAction:
          "Export or generate a higher-resolution candidate with the entire quantity region in focus, then rerun the comparison rather than manually assuming that the value matches.",
      },
    ],
    diagnosticQuestions: [
      {
        question: "Which quantity layer is the approval actually asking about?",
        reason:
          "Name printed amount, visible package count, included units, or pack configuration before reviewing. A generic quantity label hides materially different fixes and evidence requirements.",
      },
      {
        question: "Can every approval-critical number and unit be read directly?",
        reason:
          "Typography, color, and position can look familiar while individual digits or units are wrong or unresolved. Direct readability is required for a printed-value PASS.",
      },
      {
        question: "How many complete primary sellable packages are visible?",
        reason:
          "Count boxes, cans, bottles, jars, tubes, or pouches rather than decorative props, serving suggestions, loose ingredients, shadows, or reflections.",
      },
      {
        question: "Are visible units separate products, included components, or scene props?",
        reason:
          "A spatula beside a serum, a cap detached from a bottle, and a duplicate retail unit have different meanings even though each adds another object to the frame.",
      },
      {
        question: "Does the grouping imply a different commercial offer?",
        reason:
          "A single package, two loose packages, and a branded twin pack can share object count but communicate different customer entitlements and packaging structures.",
      },
      {
        question: "Did crop or perspective remove the evidence needed to count?",
        reason:
          "If package boundaries overlap or the quantity label is turned away, the honest result is REVIEW until another candidate or corresponding reference provides complete evidence.",
      },
    ],
    failureModes: [
      {
        title: "Digit substitution inside stable artwork",
        mechanism:
          "The model preserves typography and layout but changes one or more digits, decimal marks, or units in a capacity, weight, concentration, or count statement.",
        consequence:
          "A polished image can make a specific customer-facing promise that conflicts with the approved package and intended offer.",
      },
      {
        title: "Accidental package duplication",
        mechanism:
          "Recomposition or outpainting repeats a complete product package while retaining accurate branding and printed values on every copy.",
        consequence:
          "The final creative can imply a bundle, multipack, or larger delivered quantity even though the listing and price cover one unit.",
      },
      {
        title: "Included item removed or invented",
        mechanism:
          "A pump, cap, applicator, sachet, bottle, or other visible member of the approved product set disappears or an unapproved object is attached to the offer.",
        consequence:
          "Customers and reviewers may misunderstand what is included, how the product works, or which pack configuration is being sold.",
      },
      {
        title: "Quantity region lost to crop or low resolution",
        mechanism:
          "The candidate emphasizes the hero logo or scene while trimming the lower label, reducing the package to a thumbnail, or softening exact text into texture.",
        consequence:
          "A reviewer may approve an attractive image without evidence that its visible amount matches the approved product.",
      },
      {
        title: "Reflection or overlap counted as another unit",
        mechanism:
          "Glossy surfaces, mirrors, shadows, partially hidden packages, or printed product illustrations create shapes that resemble additional primary products.",
        consequence:
          "A naive object count produces false alarms, while an overly permissive count may miss a genuinely duplicated package.",
      },
    ],
    workflow: [
      {
        title: "Define the intended offer",
        detail:
          "Record the approved contents per package, number of primary packages, included component set, and single or multipack configuration before judging the creative.",
      },
      {
        title: "Use the exact approved reference",
        detail:
          "Choose an image of the correct size, count, bundle, and package revision rather than a sibling product whose logo and layout merely look similar.",
      },
      {
        title: "Read values before counting objects",
        detail:
          "Compare every visible number and unit on corresponding package regions, then separately count complete primary packages and included components.",
      },
      {
        title: "Normalize harmless composition",
        detail:
          "Allow position, scale, minor perspective, background, lighting, and shadow changes when quantity evidence remains complete and unchanged.",
      },
      {
        title: "Route the result by evidence",
        detail:
          "Correct confirmed printed changes, confirm the intended offer when package count differs, request a clearer candidate for unreadable or hidden values, and pass only verified quantity layers.",
      },
    ],
    limitations: [
      "Pairvu compares visible quantity evidence and does not measure physical fill level, actual weight, liquid volume, tablet count, package dimensions, or hidden contents.",
      "The system does not know inventory, SKU setup, listing price, bundle entitlement, fulfillment rules, or what a customer will physically receive.",
      "A quantity PASS does not certify barcode data, legal metrology, unit conversion, regulatory labeling, marketplace requirements, or print-production accuracy.",
      "Occluded, overlapping, mirrored, cropped, tiny, pixelated, blurred, curved-away, or non-corresponding regions may require REVIEW rather than a definitive quantity result.",
      "Pairvu does not automatically decide whether a visible change from one product to two was intentional; the approved reference and user's stated offer remain authoritative.",
      "The current M0 compares one approved image and one candidate, not a full SKU specification, multi-angle product profile, packaging bill of materials, or commerce catalog database.",
    ],
    faq: [
      {
        question: "What is the difference between printed quantity and product count?",
        answer:
          "Printed quantity is the readable amount on one package, such as 330 mL or 300 g. Product count is the number of primary packages visible in the scene. One can becoming two changes count even when both cans retain the same printed capacity.",
      },
      {
        question: "Why did one box becoming two receive REVIEW instead of FAIL?",
        answer:
          "The current M0 policy prevents an automatic PASS but asks a human to confirm whether the two-package offer was intentional. If the intended reference is one box, the duplicate should be removed; if two are intentional, use an approved two-box reference.",
      },
      {
        question: "Can a quantity check pass when the product moves in the frame?",
        answer:
          "Yes. Position, scale, and minor perspective are presentation changes. Quantity can PASS when all primary units remain countable and every required printed amount or included component stays visible and unchanged.",
      },
      {
        question: "What if the package looks correct but the quantity text is blurry?",
        answer:
          "The printed-quantity check should be REVIEW. Recognizable colors and layout cannot prove exact digits or units. Export a higher-resolution candidate with the quantity-bearing region in focus and rerun the comparison.",
      },
      {
        question: "Does Pairvu verify the quantity physically inside the package?",
        answer:
          "No. Pairvu compares what is visibly represented in the two images. It cannot weigh a package, measure fill level, count hidden contents, inspect inventory, or confirm what fulfillment will ship.",
      },
    ],
  },
  {
    route: "/checks/product-label-text",
    founderApprovedAt: "2026-08-03",
    audience:
      "Brand and packaging reviewers, ecommerce content teams, catalog operators, creative agencies, and regulated-category stakeholders who must confirm that names, variants, claims, instructions, and printed values in an AI-generated or edited product image still match the approved packaging before publication.",
    directAnswer:
      "To check product label text in an AI image, compare readable wording on corresponding package faces and classify each text block by its job: brand and product identity, variant or descriptor, benefit or claim, numeric value, and supporting copy. PASS requires the approval-critical wording to be visible and unchanged. Use REVIEW when text is too small, hidden, cropped, blurred, or shown on a different package face. Use FAIL only when corresponding readable text is confirmed to differ.",
    scopeDistinction:
      "Label-text fidelity is narrower than visual similarity and broader than OCR transcription. A package can keep its colors, logo, type hierarchy, and silhouette while one word or number changes. Conversely, a back label is not evidence that front-label copy was removed, and blurred characters are not proof of a typo. Pairvu compares visible text evidence between two images; it does not validate hidden copy, translate language, certify claims, or determine whether approved wording is legally sufficient.",
    deck:
      "AI often preserves the look of packaging while rewriting the words that define the product. A capacity can change, a variant can drift, or a polished crop can remove the only copy needed for approval. This check separates confirmed text changes from harmless presentation changes and missing evidence, so reviewers know when to accept, correct, or request a clearer image.",
    dimensions: [
      {
        title: "Identity-bearing wording",
        definition:
          "The readable brand name, product-line name, and primary product name that tell a viewer which packaged product is shown. These words can carry identity even when a separate graphic mark remains unchanged.",
        example:
          "MIREVA and DAILY BALANCE SHAMPOO are identity-bearing wording. Preserving the leaf mark while changing either phrase would not preserve the approved product identity.",
      },
      {
        title: "Variant and descriptor copy",
        definition:
          "Flavor, scent, shade, formula, audience, usage, finish, size descriptor, and other words that distinguish one approved variation from another within the same visual brand system.",
        example:
          "LIME SPARKLING WATER, CITRUS, FOR NORMAL HAIR, and BRIGHTENING identify variants or intended use even when the master brand remains correct.",
      },
      {
        title: "Claims and benefit statements",
        definition:
          "Customer-facing promises and qualifiers such as ZERO SUGAR, SULFATE FREE, WHOLE GRAIN, concentrated, gentle, or long-lasting. A small wording change can alter meaning without changing the package layout.",
        example:
          "Changing ZERO SUGAR to LOW SUGAR would be a substantive text change even if the words occupy the same location, color, and font style.",
      },
      {
        title: "Numbers, units, and coded strings",
        definition:
          "Readable capacities, weights, concentrations, counts, model references, dates, percentages, or other exact strings printed on the visible package. They require character-level comparison rather than visual resemblance.",
        example:
          "A NOVA FIZZ can that reads 330 mL in the approved image and 500 mL in the candidate contains confirmed text drift on the same package region.",
      },
      {
        title: "Correspondence and legibility",
        definition:
          "Whether both images expose the same physical label area at enough size, focus, contrast, and resolution for direct reading. Text comparison is valid only when the regions actually correspond.",
        example:
          "A front-label reference and back-label candidate can both contain readable words, but they cannot establish whether the candidate preserved the hidden front product name.",
      },
    ],
    decisionRules: [
      {
        condition: "Brand and product name",
        pass: "The same approval-critical brand and product wording is readable on corresponding regions in both images without character or word changes.",
        review: "Part of the identity wording is hidden, cropped, too small, distorted, or presented on a non-corresponding face that prevents direct comparison.",
        fail: "Readable corresponding text confirms a substituted, deleted, inserted, or misspelled brand or product name in the candidate image.",
      },
      {
        condition: "Variant, flavor, scent, or formula",
        pass: "The same readable variant and descriptor language remains associated with the same product area and meaning in the candidate.",
        review: "The descriptor is partly visible, ambiguous, translated without an approved source, or absent because the relevant label region is not shown.",
        fail: "The candidate visibly presents a different readable flavor, scent, shade, formula, audience, or other approval-critical variant descriptor.",
      },
      {
        condition: "Claims and benefit copy",
        pass: "Every in-scope readable claim retains the approved wording, qualifier, and negation on the corresponding package face.",
        review: "The claim area lacks enough resolution or coverage to verify exact wording, punctuation, qualification, or a small but meaningful word.",
        fail: "A corresponding readable claim is added, removed, or rewritten in a way that changes the customer-facing proposition or qualification.",
      },
      {
        condition: "Numbers and units",
        pass: "Exact digits, decimal marks, percentages, units, and adjacent qualifiers are readable and match the approved string where shown.",
        review: "The string is present only as indistinct character shapes, partially covered, truncated, or too compressed for an exact transcription.",
        fail: "The candidate contains a confirmed different readable number, unit, percentage, concentration, count, date, or coded value.",
      },
      {
        condition: "Package-face correspondence",
        pass: "Both images expose the same in-scope package face or matching text panel, allowing each required text block to be compared directly.",
        review: "The reference and candidate show different sides, panels, rotations, folds, or curved regions, leaving required copy outside the comparison.",
        fail: "Corresponding readable panels are present and demonstrate a genuine wording difference rather than merely different package-face content.",
      },
      {
        condition: "Crop and occlusion",
        pass: "The full boundaries of every required text block remain visible, unobstructed, and separated from stickers, props, hands, glare, or overlays.",
        review: "A crop, sticker, prop, reflection, fold, or foreground object covers characters needed to establish exact text fidelity.",
        fail: "The supposedly hidden area is actually observable on both images and contains confirmed replacement or missing copy in the candidate.",
      },
      {
        condition: "Resolution and rendering quality",
        pass: "Character strokes are sufficiently sharp and contrasted to read exact wording without reconstructing letters from expected package layout.",
        review: "Pixelation, blur, AI-garbled glyphs, compression, glare, or tiny rendering makes one or more required strings uncertain.",
        fail: "The characters are clearly readable and form a different word or value; visual polish does not excuse confirmed textual drift.",
      },
    ],
    evidence: [
      {
        href: "/examples/label-value-change-ai-product-image",
        title: "A readable capacity changed from 330 mL to 500 mL",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/label-value-change/candidate.jpg",
        alt: "NOVA FIZZ cans with corresponding capacity text reading 330 mL and 500 mL",
        observation:
          "The same front panel is visible at high resolution in both images. NOVA FIZZ, LIME SPARKLING WATER, and ZERO SUGAR remain readable and stable, while the bottom capacity string changes from 330 mL to 500 mL.",
        whyThisDecision:
          "The relevant strings correspond and both are unambiguous, so the system has enough evidence to confirm a textual mismatch. REVIEW would incorrectly treat readable evidence as uncertain, and PASS would approve a different printed promise.",
        nextAction:
          "Restore the approved 330 mL artwork or regenerate the candidate with the exact approved label, then rerun the comparison on the corrected export.",
      },
      {
        href: "/examples/identical-product-images-pass",
        title: "Identical label artwork produced no invented text difference",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/label-value-change/original.jpg",
        alt: "The same readable NOVA FIZZ label used as both approved image and candidate",
        observation:
          "The exact same image file appears on both sides. Brand, product descriptor, claim, and capacity text are all readable at corresponding locations, with no crop, viewpoint, or rendering difference.",
        whyThisDecision:
          "A reliable label check must preserve a clean baseline. Matching words and values support PASS; inventing a mismatch from typography texture or anti-aliasing would create a false alarm.",
        nextAction:
          "Accept the visible label-text result and continue with other approval requirements that are outside textual fidelity.",
      },
      {
        href: "/examples/large-viewpoint-difference-product-image",
        title: "A back-label view could not verify the approved front wording",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/missing-component/original.jpg",
        candidate: "/examples/large-viewpoint/candidate.jpg",
        alt: "BRIGHTLEAF cleaner shown from the front and back with non-corresponding label text",
        observation:
          "The approved image shows the BRIGHTLEAF front panel with product name, CITRUS, and 750 mL. The candidate shows a back panel with different types of supporting copy. Bottle color, sprayer, and shape remain comparable, but the front wording is outside the candidate view.",
        whyThisDecision:
          "Different package faces naturally contain different text. That does not prove the front copy changed or disappeared. REVIEW records the missing correspondence instead of manufacturing a mismatch from unrelated panels.",
        nextAction:
          "Supply a candidate front view when front-label fidelity is required, or provide an approved back-label reference when the back panel is the actual review target.",
      },
      {
        href: "/examples/partially-visible-product-image",
        title: "A close crop preserved upper wording but removed lower text",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/partial-product-coverage/candidate.jpg",
        alt: "Complete MIREVA shampoo label compared with a crop that removes lower wording and 500 mL",
        observation:
          "MIREVA and part of DAILY BALANCE remain visible in the candidate, but the lower product wording, FOR NORMAL HAIR, and 500 mL region are outside the frame. The crop therefore supplies partial rather than complete text coverage.",
        whyThisDecision:
          "Visible upper words may match, yet they cannot stand in for omitted approval-critical copy. FAIL would claim hidden text changed; PASS would claim it was verified. REVIEW identifies exactly which evidence must be restored.",
        nextAction:
          "Use a wider crop that includes the complete label, or explicitly narrow the approval scope and provide another corresponding view for the omitted lower text.",
      },
    ],
    diagnosticQuestions: [
      {
        question: "Which words can change what product the customer believes this is?",
        reason:
          "Prioritize brand, product name, variant, formula, and other identity-bearing copy before decorative or incidental wording. This defines the highest-risk strings for direct review.",
      },
      {
        question: "Are the same physical label panels visible in both images?",
        reason:
          "Front and back panels, side flaps, carton tops, and wrapped bottle labels contain different legitimate copy. Comparison requires panel correspondence, not merely two readable text areas.",
      },
      {
        question: "Can every required character be read without relying on expectation?",
        reason:
          "Familiar color blocks and word lengths can make blurred text feel correct. Approval needs pixels that support the actual letters, digits, punctuation, and units.",
      },
      {
        question: "Did a small qualifier, negation, or unit alter the meaning?",
        reason:
          "Words such as no, free, low, extra, new, or concentrated and units such as mL, g, oz, and % can materially change a claim even when most of the line matches.",
      },
      {
        question: "Is the difference textual, or only typographic and photographic?",
        reason:
          "Lighting, perspective, embossing, curvature, print texture, and anti-aliasing may alter appearance while the readable string remains the same. Compare meaning before style.",
      },
      {
        question: "What exact new image would resolve an uncertain reading?",
        reason:
          "A useful REVIEW should name the missing input: a closer export, an unobstructed panel, a corresponding angle, or the complete uncropped package rather than a generic manual check.",
      },
    ],
    failureModes: [
      {
        title: "Plausible word substitution",
        mechanism:
          "Generative editing redraws a label with a semantically plausible but unapproved product name, flavor, scent, formula, or audience descriptor while preserving layout and typography.",
        consequence:
          "The image can look professionally on-brand while identifying the wrong variant or presenting a product that is not part of the approved offer.",
      },
      {
        title: "Claim qualifier drift",
        mechanism:
          "A short qualifier, number, negation, or benefit phrase is removed, inserted, or rewritten inside an otherwise stable claim block.",
        consequence:
          "The final creative may make a stronger, different, or unsupported customer-facing promise even though reviewers recognize the original design.",
      },
      {
        title: "AI-shaped pseudo-letters",
        mechanism:
          "The candidate renders letter-like strokes that mimic the rhythm of packaging copy but do not form the approved words when inspected at full resolution.",
        consequence:
          "Thumbnail review may pass unreadable or nonsensical packaging text that becomes obvious on a product detail page or enlarged campaign asset.",
      },
      {
        title: "Critical copy removed by composition",
        mechanism:
          "Cropping, foreground props, stickers, folds, glare, or close framing leaves attractive identity cues visible while excluding a lower claim, value, or instruction block.",
        consequence:
          "A reviewer may confuse partial confirmation with complete label approval and publish an image that cannot support the intended product information.",
      },
      {
        title: "Wrong-panel false mismatch",
        mechanism:
          "A reviewer or model compares front-label copy in one image with legitimate back-panel directions, ingredients, or warnings in the other as if the regions corresponded.",
        consequence:
          "The workflow produces unnecessary failures and regeneration work while still leaving the actual front-label fidelity unanswered.",
      },
    ],
    workflow: [
      {
        title: "Inventory approval-critical strings",
        detail:
          "List the exact brand, product, variant, claim, and numeric strings that must survive the edit. Separate mandatory text from copy that is outside the current image scope.",
      },
      {
        title: "Align corresponding package regions",
        detail:
          "Confirm that reference and candidate expose the same front, back, side, top, or label panel before comparing wording. Obtain another view when the target region differs.",
      },
      {
        title: "Read by semantic block",
        detail:
          "Compare identity, variant, claims, and values as separate blocks. This keeps one confirmed change from obscuring stable text and produces a more actionable correction request.",
      },
      {
        title: "Separate unreadable from different",
        detail:
          "Route tiny, pixelated, blocked, curved-away, or cropped strings to REVIEW. Reserve FAIL for characters that can actually be read and shown to differ.",
      },
      {
        title: "Correct and re-export at use size",
        detail:
          "Restore approved wording, export at the resolution and crop intended for publication, and rerun the comparison so the final delivered asset rather than a working file receives approval.",
      },
    ],
    limitations: [
      "Pairvu compares text that is visibly represented in two images; it does not inspect source design files, hidden panels, physical packaging, databases, or copy that falls outside the supplied frames.",
      "The check does not certify legal wording, regulatory sufficiency, ingredients, nutrition facts, warnings, trademarks, translations, marketplace policy, or whether an approved claim is factually substantiated.",
      "Curved surfaces, foil, embossing, transparency, reflections, glare, folds, perspective, low contrast, tiny type, compression, and stylized lettering can reduce observability and require REVIEW.",
      "A matching visible string does not prove that every occurrence of the same text elsewhere on the package is correct, nor that back, side, top, and bottom panels match.",
      "Pairvu does not currently produce a complete OCR transcript, character-level bounding boxes, font certification, kerning comparison, spell-check report, or translation-quality assessment.",
      "The M0 accepts one approved image and one candidate. Multi-angle label approval, version-controlled artwork, regional variants, and full packaging-copy specifications remain outside this page's claim.",
    ],
    faq: [
      {
        question: "Is product label checking the same as OCR?",
        answer:
          "No. OCR attempts to transcribe characters. Product label checking asks whether approval-critical visible wording on corresponding package regions stayed faithful, and it must also handle occlusion, viewpoint, crop, and unreadable evidence honestly.",
      },
      {
        question: "Should different front and back label text fail?",
        answer:
          "Not by itself. Front and back panels legitimately contain different copy. If the reference shows the front and the candidate shows the back, front-label fidelity should be REVIEW until a corresponding view is supplied.",
      },
      {
        question: "Can the text check pass if lighting or perspective changes?",
        answer:
          "Yes. Photographic presentation can change while readable wording remains identical. PASS is appropriate when the required strings still correspond, remain legible, and match despite harmless lighting, scale, or angle differences.",
      },
      {
        question: "What happens when only part of a label is readable?",
        answer:
          "Pairvu can verify the visible in-scope blocks but should not extend that result to hidden copy. If omitted text matters to approval, the overall label-text decision needs REVIEW and a clearer or wider candidate.",
      },
      {
        question: "Does a label-text PASS certify compliance?",
        answer:
          "No. It indicates that the required visible wording matched the approved image within the supplied evidence. It does not certify legal claims, mandatory disclosures, translation, ingredients, nutrition, warnings, or channel policy.",
      },
    ],
  },
  {
    route: "/checks/product-packaging",
    founderApprovedAt: "2026-08-03",
    audience:
      "Brand managers, packaging owners, ecommerce content teams, creative agencies, and production reviewers who need to confirm that an AI-generated or edited product image preserves the approved container, closure, dispensing system, major attached parts, and overall package construction before publication.",
    directAnswer:
      "To check product packaging in an AI image, compare the visible package as an assembly rather than one outline. Verify the primary container geometry, closure or dispensing mechanism, major attached components, label carrier or outer structure, and material or finish cues. PASS requires all approval-critical packaging elements to be observable and consistent. Use REVIEW when intent or coverage is uncertain, and FAIL when a corresponding, clearly visible structural feature is confirmed changed.",
    scopeDistinction:
      "Packaging fidelity is not the same as general image similarity, product count, or label-copy accuracy. A bottle can move into warmer light without changing its package; a label can retain every word while the bottle changes from round to rectangular; and a cropped candidate can preserve the visible pump while hiding the base needed to verify silhouette. Pairvu evaluates visible structural representation only. It does not measure physical dimensions, inspect hidden assemblies, certify materials, or determine what fulfillment will ship.",
    deck:
      "AI can preserve branding while quietly rebuilding the object that carries it. A rounded bottle may become rectangular, a trigger sprayer may disappear, or a crop may hide the lower silhouette. This check separates confirmed package changes from harmless lighting and incomplete evidence, so reviewers can correct the image, request a better view, or publish with a defensible decision.",
    dimensions: [
      {
        title: "Container geometry",
        definition:
          "The visible three-dimensional form of the primary bottle, jar, tube, can, carton, pouch, or other package: body profile, shoulders, base, corners, taper, proportions, and distinctive structural contours.",
        example:
          "A MIREVA shampoo bottle changing from a rounded cylindrical body to straight rectangular sides is a container-geometry change even when the label, pump, color, and 500 mL value remain stable.",
      },
      {
        title: "Closure and dispensing system",
        definition:
          "The visible cap, lid, pump, trigger, dropper, nozzle, flip top, spray head, seal, or other mechanism used to close or dispense the packaged product, including its attachment to the container.",
        example:
          "A BRIGHTLEAF cleaner with an approved white trigger sprayer cannot be treated as the same complete package when the candidate exposes an open threaded neck instead.",
      },
      {
        title: "Package assembly relationships",
        definition:
          "How major visible pieces connect and belong together: bottle and pump, jar and lid, tube and cap, carton and inner tray, sleeve and container, handle and body, or an accessory that may be separate from the primary package.",
        example:
          "A detached applicator placed beside a serum may be an intentional accessory or an invented part. The package assembly needs human confirmation when the approved offer does not define that relationship.",
      },
      {
        title: "Label carrier and panel construction",
        definition:
          "The physical surface carrying artwork and copy, such as a pressure-sensitive label, shrink sleeve, printed carton panel, wraparound band, embossed area, window, insert, or separate front plaque.",
        example:
          "A label can keep identical wording while changing from a narrow applied panel to a full-body sleeve, which alters packaging construction rather than label text alone.",
      },
      {
        title: "Material and finish cues",
        definition:
          "Observable cues that communicate glass, plastic, metal, paperboard, translucency, opacity, gloss, matte coating, frosting, ribbing, texture, or another visible surface treatment without claiming laboratory material verification.",
        example:
          "Warmer illumination on the same amber plastic bottle is a scene change; a candidate that visibly replaces the transparent amber body with an opaque metal-like body may require a packaging decision.",
      },
      {
        title: "Full silhouette coverage",
        definition:
          "Whether the candidate includes enough of the complete top, sides, base, closures, and distinctive profile to compare every packaging feature that matters to approval without extrapolating beyond the frame.",
        example:
          "A close crop of the MIREVA pump and upper label can verify those visible parts but cannot establish that the bottle base and full body profile still match the approved package.",
      },
    ],
    decisionRules: [
      {
        condition: "Primary container body",
        pass: "The visible body profile, shoulders, sidewalls, base, proportions, and distinctive contours remain consistent with the approved container.",
        review: "Crop, overlap, viewpoint, reflection, low resolution, or partial coverage prevents a complete comparison of required container boundaries.",
        fail: "Corresponding visible boundaries confirm a materially different container form, such as a rounded cylinder becoming a rectangular bottle.",
      },
      {
        condition: "Closure or dispenser",
        pass: "The same required cap, pump, trigger, dropper, nozzle, lid, or dispensing mechanism is visibly present and attached in the approved manner.",
        review: "The mechanism is hidden, detached, outside the frame, ambiguous as a separate prop, or changed in a way that requires confirmation of intent.",
        fail: "A clearly required and observable closure or dispenser is confirmed replaced, removed, or structurally altered against the approved package.",
      },
      {
        condition: "Major attached parts",
        pass: "Handles, collars, grips, sleeves, trays, windows, applicators, and other approval-critical visible parts remain present with the same package relationship.",
        review: "A part may be occluded, optional, detachable, or newly placed beside the product, so the image alone cannot establish whether the approved set changed.",
        fail: "The reference and candidate clearly show that a required structural part was removed or an unapproved part was integrated into the package.",
      },
      {
        condition: "Panel and label construction",
        pass: "The physical label carrier, sleeve, carton panel, window, wrap, or applied plaque retains its observable construction and placement on the package.",
        review: "Perspective, glare, crop, or non-corresponding package faces prevent reliable comparison of the relevant panel edges or attachment method.",
        fail: "The candidate visibly changes an approval-critical construction, such as replacing a front panel with a full-body sleeve or removing a package window.",
      },
      {
        condition: "Surface appearance",
        pass: "Observable transparency, opacity, gloss, frosting, texture, ribbing, and material-like cues remain semantically consistent despite normal photographic variation.",
        review: "Strong reflection, tint, color cast, compression, or insufficient resolution makes a material or finish cue uncertain rather than demonstrably changed.",
        fail: "A clearly visible and identity-relevant surface treatment is replaced, such as approved frosted glass becoming an opaque smooth package.",
      },
      {
        condition: "Lighting, shadow, and reflection",
        pass: "Illumination, shadow direction, highlights, or reflections change while observable container structure and package components remain faithful.",
        review: "Lighting or reflection hides a structural edge, closure, component, or finish cue needed for the packaging decision.",
        fail: "The apparent photographic change also contains a separately confirmed packaging alteration rather than only different illumination.",
      },
      {
        condition: "Viewpoint and coverage",
        pass: "A changed angle or crop still exposes every packaging boundary and assembly feature required for the defined approval scope.",
        review: "The candidate omits the base, reverse side, closure, silhouette edge, or another required region, so a complete packaging PASS is unsupported.",
        fail: "Corresponding visible regions remain sufficient and show a confirmed package difference; the viewpoint does not explain the altered structure.",
      },
    ],
    evidence: [
      {
        href: "/examples/packaging-shape-change-ai-product-image",
        title: "Rounded shampoo bottle changed to a rectangular body",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/packaging-shape-change/candidate.jpg",
        alt: "Rounded MIREVA shampoo bottle compared with a rectangular MIREVA bottle",
        observation:
          "Both images provide a complete front view of one amber MIREVA pump bottle. The leaf mark, DAILY BALANCE SHAMPOO wording, FOR NORMAL HAIR text, 500 mL value, cream label, amber color, and black pump remain stable. The approved body is rounded and cylindrical; the candidate has straight sides, sharper shoulders, and a rectangular base.",
        whyThisDecision:
          "The complete corresponding silhouettes make the structural difference directly observable. It is not explained by crop, perspective, lighting, or label artwork. PASS would approve the wrong package identity, and REVIEW would ignore evidence that is already sufficient, so the correct decision is FAIL.",
        nextAction:
          "Restore the approved rounded bottle geometry or regenerate from a reference that preserves the cylindrical body, then rerun the comparison on the corrected final export.",
      },
      {
        href: "/examples/missing-product-component-ai-image",
        title: "The cleaner bottle lost its trigger sprayer",
        role: "product_change",
        decision: "REVIEW",
        original: "/examples/missing-component/original.jpg",
        candidate: "/examples/missing-component/candidate.jpg",
        alt: "BRIGHTLEAF cleaner bottle with and without its white trigger sprayer",
        observation:
          "The reference shows a translucent blue BRIGHTLEAF cleaner bottle with a white trigger sprayer attached. The candidate preserves the bottle body, blue liquid, label, CITRUS variant, and 750 mL value but shows an open threaded neck with no trigger assembly. The component absence is clearly visible rather than hidden by the frame.",
        whyThisDecision:
          "Pairvu identified the missing major component with high confidence, but the current M0 RiskPolicy returns REVIEW because the system cannot determine whether the user intentionally supplied a refill-style or uncapped variant. The result must not be PASS, yet founder or packaging-owner intent is still required before treating it as a final failure.",
        nextAction:
          "Confirm the intended package specification. Restore the white trigger sprayer when the approved product requires it, or use a formally approved sprayer-free reference if the candidate represents another valid package variant.",
      },
      {
        href: "/examples/lighting-change-product-image",
        title: "Warmer lighting changed the scene, not the bottle",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/lighting-change/candidate.jpg",
        alt: "The same rounded MIREVA shampoo bottle under neutral and warmer lighting",
        observation:
          "The candidate moves the approved MIREVA shampoo into warmer ambient light. One rounded amber bottle remains fully visible with the same black ribbed pump, curved shoulders, cylindrical base, cream wrap label, leaf mark, printed wording, and 500 mL value. Only illumination and background tone change.",
        whyThisDecision:
          "Lighting affects pixel color and highlight placement but does not by itself alter packaging. Because all required structure, components, and silhouette remain observable and consistent, REVIEW would add unnecessary friction and FAIL would be a false alarm. The packaging check can honestly PASS.",
        nextAction:
          "Accept the packaging result and evaluate artistic lighting, brand color tolerance, or channel composition separately if those requirements are part of the production brief.",
      },
      {
        href: "/examples/partially-visible-product-image",
        title: "A close crop hid the lower package silhouette",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/partial-product-coverage/candidate.jpg",
        alt: "Full MIREVA shampoo package compared with a crop that omits its lower bottle",
        observation:
          "The crop preserves the black pump, rounded upper shoulders, amber body, MIREVA logo, and top label area. It excludes the lower label, 500 mL region, base, and complete side boundary. Those omitted regions could conceal a changed body length, base geometry, or lower package construction.",
        whyThisDecision:
          "The visible upper package can be verified, but a complete packaging PASS would extrapolate beyond supplied pixels. There is no observed mismatch to support FAIL. REVIEW accurately records that the required full silhouette lacks coverage and asks for evidence rather than guessing.",
        nextAction:
          "Provide a wider candidate showing the complete product boundary from pump to base, or explicitly narrow the approval scope if the omitted regions are not intended to be assessed in this creative.",
      },
    ],
    diagnosticQuestions: [
      {
        question: "Which packaging structures define this approved product?",
        reason:
          "List the primary container, closure, dispenser, applied panels, attached parts, and distinctive silhouette before comparing. Otherwise reviewers may focus on artwork and overlook a rebuilt physical package.",
      },
      {
        question: "Are the same physical package regions visible in both images?",
        reason:
          "Direct comparison requires corresponding boundaries. A front view cannot prove the reverse panel, and a close crop cannot establish the base or complete package proportions.",
      },
      {
        question: "Did an apparent shape change come from perspective or from geometry?",
        reason:
          "A cylindrical bottle can appear narrower or asymmetric when turned. Look for consistent shoulders, side curvature, base, and depth cues before declaring a structural mismatch.",
      },
      {
        question: "Is every required closure and dispensing component present?",
        reason:
          "Check pumps, triggers, droppers, nozzles, lids, caps, collars, seals, and handles separately. A correct bottle body does not compensate for a missing functional assembly.",
      },
      {
        question: "Could light or reflection explain the surface difference?",
        reason:
          "Highlights and color casts can make plastic look metallic or matte surfaces look glossy. Require stable structural and surface evidence before treating photographic appearance as changed packaging.",
      },
      {
        question: "Is a separate object packaging, an accessory, or a scene prop?",
        reason:
          "A detached applicator or cap may be intentionally included, temporarily removed, or invented by generation. The approved offer and assembly specification determine its packaging meaning.",
      },
    ],
    failureModes: [
      {
        title: "Silhouette reconstruction",
        mechanism:
          "The generator keeps recognizable artwork but rebuilds the bottle, jar, carton, or pouch with different shoulders, sidewalls, corners, taper, or base geometry.",
        consequence:
          "The visual can represent another package design or imply a package revision that does not exist, despite looking convincingly branded.",
      },
      {
        title: "Closure or dispenser loss",
        mechanism:
          "A pump, trigger, dropper, cap, lid, nozzle, collar, or seal disappears, becomes detached, or is replaced by a generic mechanism during editing.",
        consequence:
          "Customers may misunderstand use, included functionality, tamper protection, or the exact packaged variant they are viewing.",
      },
      {
        title: "Invented assembly part",
        mechanism:
          "Outpainting or generative fill adds a handle, applicator, window, tray, sleeve, spout, grip, or accessory that was not part of the approved package.",
        consequence:
          "The image can promise an included feature or alter the visual identity of the commercial package without any label-text warning.",
      },
      {
        title: "Material-like finish drift",
        mechanism:
          "The candidate changes translucency, frosting, metallic appearance, gloss, texture, ribbing, or opacity while preserving approximate color and outline.",
        consequence:
          "A materially different-looking package may change perceived quality, sustainability, usage expectations, or brand recognition.",
      },
      {
        title: "Coverage falsely treated as a match",
        mechanism:
          "A crop, prop, hand, reflection, or viewpoint hides the exact structural region where a package change could occur, yet the visible upper portion looks familiar.",
        consequence:
          "Approval becomes an unsupported inference and a real base, closure, panel, or silhouette change can pass unnoticed.",
      },
      {
        title: "Scene variation misclassified as packaging",
        mechanism:
          "Warmer light, stronger shadow, reflection, background color, or ordinary perspective changes the pixels around an otherwise faithful package.",
        consequence:
          "False alarms slow production, encourage reviewers to ignore future warnings, and obscure the structural issues the check is meant to find.",
      },
    ],
    workflow: [
      {
        title: "Define the approved package assembly",
        detail:
          "Record the exact primary container, closure, dispenser, major components, panel construction, and distinctive surface cues that must remain faithful in the final image.",
      },
      {
        title: "Select a corresponding reference view",
        detail:
          "Use an approved image that exposes the same package face and enough complete silhouette to evaluate the intended candidate, rather than a sibling SKU or unrelated angle.",
      },
      {
        title: "Inspect structure before artwork",
        detail:
          "Trace the top, shoulders, sides, base, closure, attachment points, and major parts first. Review label text and color in their dedicated checks instead of allowing them to distract from package form.",
      },
      {
        title: "Normalize harmless photography",
        detail:
          "Allow background, position, minor perspective, lighting, shadow, and reflection differences when required package geometry and assemblies stay fully observable and consistent.",
      },
      {
        title: "Resolve the verdict by evidence",
        detail:
          "Correct a confirmed structural mismatch, confirm intent for a missing or added component, request a complete view for insufficient coverage, and accept faithful packaging despite harmless presentation changes.",
      },
      {
        title: "Recheck the final export",
        detail:
          "Run the corrected or approved candidate again after resizing, compositing, localization, or marketplace export so the version that will actually publish receives the decision.",
      },
    ],
    limitations: [
      "Pairvu compares visible package representation and does not measure physical dimensions, wall thickness, volume, weight, tolerances, closure torque, fit, seal integrity, or manufacturing feasibility.",
      "The system cannot inspect hidden backs, interiors, undersides, inserts, seals, contents, or components that are outside the frame or fully occluded in either supplied image.",
      "A packaging PASS does not certify material composition, recyclability, sustainability claims, food contact, child resistance, tamper evidence, accessibility, or regulatory compliance.",
      "Surface cues in a photograph are affected by lighting, white balance, reflections, transparency, compression, and display conditions; Pairvu does not perform calibrated material or color measurement.",
      "Pairvu does not know whether a missing trigger, detached applicator, alternate cap, or new package form is an intentional approved variant unless the supplied reference and workflow make that intent explicit.",
      "The current M0 compares one approved image with one candidate and does not maintain a multi-angle package specification, dieline, CAD model, bill of materials, SKU family, or revision history.",
      "Packaging fidelity does not verify printed wording, barcode validity, legal declarations, exact product count, marketplace policy, listing entitlement, or what fulfillment will physically deliver.",
    ],
    faq: [
      {
        question: "What counts as a product packaging change in an AI image?",
        answer:
          "A packaging change affects the visible container, closure, dispenser, major attached part, panel construction, material-like finish, or complete silhouette. A different background or ordinary lighting change is not packaging when the product structure remains observable and faithful.",
      },
      {
        question: "Why does a rounded bottle becoming rectangular receive FAIL?",
        answer:
          "The approved and candidate images expose complete corresponding boundaries, and the label, pump, color, and capacity stay stable. That isolates a confirmed container-geometry change, leaving no visibility limitation or photographic explanation that would justify REVIEW or PASS.",
      },
      {
        question: "Why can a clearly missing sprayer receive REVIEW instead of FAIL?",
        answer:
          "The missing sprayer is directly observed, so the image must not PASS. The current M0 policy still asks whether the candidate intentionally represents a valid refill or alternate package. The packaging owner must confirm intent or provide the correct approved reference before final rejection.",
      },
      {
        question: "Can packaging PASS when the lighting, shadow, or background changes?",
        answer:
          "Yes. These are presentation variables. Packaging can PASS when container geometry, closure, components, panel construction, finish cues, and required silhouette remain sufficiently visible and consistent across the two images.",
      },
      {
        question: "What should I do when only part of the package is visible?",
        answer:
          "Verify only the visible in-scope parts and use REVIEW for any required structure outside the frame. Supply a wider candidate showing the complete boundary, or explicitly define a narrower approval scope that does not depend on omitted regions.",
      },
      {
        question: "Does a Pairvu packaging PASS certify the physical package?",
        answer:
          "No. It means the required visible packaging evidence matched the approved image within the supplied views. It does not inspect the physical item, certify manufacturing, validate materials, confirm dimensions, or replace packaging engineering and compliance review.",
      },
    ],
  },
  {
    route: "/checks/product-logo",
    founderApprovedAt: "2026-08-03",
    audience:
      "Brand managers, ecommerce teams, creative agencies, packaging reviewers, and production operators who need to confirm that an AI-generated or edited product image preserves the approved brand symbol, wordmark, lockup, placement, proportions, and identity before publication.",
    directAnswer:
      "To check a product logo in an AI image, compare the graphic symbol, wordmark letters, combined lockup, relative placement, proportions, and distinctive contours against an approved reference. PASS only when the identity-bearing features are observable and consistent. Use REVIEW when crop, occlusion, scale, glare, or viewpoint prevents direct verification. Use FAIL when a sufficiently visible candidate replaces, redraws, removes, or materially changes the approved brand mark.",
    scopeDistinction:
      "A product logo is not every printed word and not every colored accent. The logo check covers identity-bearing symbols, wordmarks, and their approved arrangement. Descriptive copy, claims, flavor names, and capacity values belong to the label-text check; broad package palette belongs to product color. A palette shift alone does not prove a new logo when symbol identity and wordmark geometry remain intact, while a new symbol can be a logo failure even if every surrounding label word still matches.",
    deck:
      "AI can preserve a polished package while quietly replacing the mark that tells customers whose product it is. This method separates a confirmed identity change from harmless background, shadow, reflection, and partial visibility so reviewers can reject the wrong brand, accept faithful presentation changes, and request better evidence instead of guessing.",
    dimensions: [
      {
        title: "Symbol identity",
        definition:
          "The distinctive graphic device used as a brand identifier, such as a crescent, star, leaf, crest, monogram, geometric emblem, or recognizable abstract mark. Identity depends on its defining silhouette and internal structure rather than scene color alone.",
        example:
          "An ELARA crescent becoming a radiating sun changes the symbol identity even though the bottle, label wording, orange ink, and 30 mL value remain stable.",
      },
      {
        title: "Wordmark identity",
        definition:
          "The exact brand name and identity-bearing letterforms presented as a mark. Review spelling, letter sequence, distinctive characters, case, spacing, and recognizable typographic construction without treating ordinary rendering softness as a confirmed redesign.",
        example:
          "A readable NOVA FIZZ wordmark must not become a different name, omit a letter, merge characters, or adopt a materially different identity-bearing arrangement.",
      },
      {
        title: "Lockup composition",
        definition:
          "The approved relationship between symbol and wordmark, including which element sits above, beside, inside, or across another element and whether a required divider, badge, or enclosing shape belongs to the identity system.",
        example:
          "Keeping a crescent and the ELARA name but moving the crescent into an unrelated badge may preserve ingredients while changing the approved logo lockup.",
      },
      {
        title: "Identity-relevant placement",
        definition:
          "The location and orientation of the logo on the corresponding product face when placement itself helps distinguish the approved identity. Evaluate placement relative to stable package landmarks, not absolute screen coordinates.",
        example:
          "A bottle may move within the photograph and still pass, while a front-label logo relocated below the product name can require review or correction if that layout is identity-bearing.",
      },
      {
        title: "Proportion and scale relationship",
        definition:
          "The relative size of symbol, wordmark, spacing, and enclosing elements inside the logo. Perspective can alter apparent screen size, so compare internal ratios and corresponding package regions rather than raw pixels.",
        example:
          "A star that becomes twice the height of its wordmark may represent a rebuilt lockup even when both original ingredients remain visible.",
      },
      {
        title: "Shape and stroke integrity",
        definition:
          "The defining curves, corners, negative spaces, stroke count, and internal cutouts that make the mark recognizable. Minor antialiasing and compression are presentation artifacts; added rays, missing leaves, or rebuilt geometry can change identity.",
        example:
          "The crescent-to-sun case adds a center circle and radial strokes, producing a new mark rather than a lighting highlight on the approved crescent.",
      },
      {
        title: "Brand-area observability",
        definition:
          "Whether the corresponding logo region is large enough, sharp enough, sufficiently uncovered, and shown on the relevant package face to support direct identity comparison without reconstructing hidden pixels from context.",
        example:
          "A white sticker covering most of NOVA FIZZ can leave the package recognizable but cannot support a complete wordmark verification, so the honest result is REVIEW.",
      },
    ],
    decisionRules: [
      {
        condition: "Graphic symbol",
        pass: "The defining silhouette, internal shapes, negative spaces, and distinctive elements of the symbol correspond clearly across both supplied images.",
        review: "The symbol is partly hidden, too small, blurred, reflected, turned away, or cropped so its identity cannot be established directly.",
        fail: "A sufficiently observable candidate replaces the approved symbol, removes it, invents new defining geometry, or changes it into another recognizable mark.",
      },
      {
        condition: "Brand wordmark",
        pass: "The identity-bearing name, letter sequence, recognizable letterforms, case, and essential spacing remain readable and materially consistent.",
        review: "One or more identity-bearing letters cannot be read because of scale, blur, occlusion, curvature, glare, or non-corresponding package faces.",
        fail: "The readable candidate changes the brand name, drops or adds identity-bearing characters, or substitutes a materially different wordmark identity.",
      },
      {
        condition: "Symbol and wordmark lockup",
        pass: "The approved relationship, order, alignment, orientation, and required enclosing or separating elements remain consistent within the logo region.",
        review: "The candidate exposes only one lockup element or uses an angle that prevents the relationship between symbol and wordmark from being verified.",
        fail: "Both logo regions are observable and the candidate visibly rebuilds the approved lockup into a different identity-bearing composition.",
      },
      {
        condition: "Placement on the product",
        pass: "The logo remains on the corresponding package face and in a materially consistent relationship to stable label or container landmarks.",
        review: "Crop, wraparound curvature, a different product face, or incomplete package coverage prevents corresponding placement from being compared.",
        fail: "The candidate clearly moves, duplicates, rotates, or removes the logo in a way that violates an approval-critical brand placement requirement.",
      },
      {
        condition: "Internal proportions",
        pass: "Symbol-to-wordmark scale, spacing, aspect ratio, and distinctive internal geometry remain consistent after allowing for ordinary perspective and resizing.",
        review: "Resolution or perspective is insufficient to distinguish a real proportion change from photographic foreshortening or resampling softness.",
        fail: "Corresponding frontal evidence shows the candidate materially stretching, compressing, enlarging, or rebuilding identity-defining logo proportions.",
      },
      {
        condition: "Color, light, and reflection",
        pass: "Logo identity and geometry remain intact when only scene lighting, shadow, reflection, white balance, or non-identity palette presentation changes.",
        review: "Reflection, glare, transparency, or colored light covers enough defining geometry that symbol identity can no longer be confirmed with confidence.",
        fail: "A confirmed identity replacement accompanies the color difference; color alone is not used to manufacture a logo failure under the current scope.",
      },
      {
        condition: "Occlusion and incomplete coverage",
        pass: "All required identity-bearing areas remain sufficiently visible despite harmless nearby props, background changes, or small non-overlapping obstructions.",
        review: "A sticker, crop, hand, prop, fold, package turn, or low-resolution export hides required logo evidence and blocks a complete comparison.",
        fail: "Previously visible logo evidence is clearly removed or replaced rather than merely hidden, and the corresponding area remains sufficiently observable.",
      },
    ],
    evidence: [
      {
        href: "/examples/logo-change-ai-product-image",
        title: "ELARA crescent replaced by a sun",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/logo-change/original.jpg",
        candidate: "/examples/logo-change/candidate.jpg",
        alt: "ELARA serum with a crescent logo compared with the same serum carrying a sun logo",
        observation:
          "The approved bottle carries an orange crescent above ELARA. The candidate carries an orange sun with a center circle and radial strokes in the same brand area. ELARA, VITAMIN C SERUM, BRIGHTENING, 30 mL, bottle form, dropper, label position, and surrounding palette remain stable.",
        whyThisDecision:
          "Both marks are large, frontal, and directly observable, and the controlled pair isolates a new graphic identity. This is not glare, missing coverage, or a label-copy difference, so REVIEW would understate the evidence and PASS would approve the wrong brand mark.",
        nextAction:
          "Replace the generated sun with the approved crescent, preserve the rest of the candidate, and compare the corrected export again before it enters a listing or campaign.",
      },
      {
        href: "/examples/background-change-ai-product-image",
        title: "A new environment preserved the ELARA logo",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/background-change/original.jpg",
        candidate: "/examples/background-change/candidate.jpg",
        alt: "The same ELARA serum logo in a studio image and a lifestyle background",
        observation:
          "The candidate places the serum in a brighter interior setting with plants and reflective surfaces. The crescent, ELARA wordmark, relative lockup, orange treatment, and front-label position remain visible and consistent with the approved product.",
        whyThisDecision:
          "The scene changed, not the logo. Treating a new background as brand drift would create a false alarm and defeat a primary AI product-photography use case. The required identity evidence remains sufficiently observable in both images.",
        nextAction:
          "Accept the logo result and continue with separate checks for label wording, color, package structure, and channel-specific composition requirements.",
      },
      {
        href: "/examples/shadow-reflection-change-product-image",
        title: "Stronger highlights left NOVA FIZZ identity intact",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/shadow-reflection-change/candidate.jpg",
        alt: "NOVA FIZZ can with ordinary studio light and with stronger window shadows and highlights",
        observation:
          "The candidate adds directional window shadows, brighter metallic highlights, and a different floor reflection. The four-point star and NOVA FIZZ wordmark remain centered, readable, and consistent in shape and arrangement on the turquoise can.",
        whyThisDecision:
          "Highlights can alter local contrast and apparent brightness without changing identity-bearing geometry. Because the star, lettering, lockup, and placement remain observable, the useful result is PASS rather than a logo false alarm.",
        nextAction:
          "Approve the logo check while reviewing the image separately for creative direction, exposure, marketplace background policy, and any exact text values outside the brand mark.",
      },
      {
        href: "/examples/partially-hidden-product-logo",
        title: "A sticker blocked direct wordmark verification",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/partially-hidden-logo/candidate.jpg",
        alt: "NOVA FIZZ logo visible in the original and partly covered by a white sticker in the candidate",
        observation:
          "The candidate still shows the turquoise can, star area, lower product copy, and package shape, but a white square covers much of the NOVA FIZZ wordmark. The visible context suggests the same product yet the hidden letters cannot be compared directly.",
        whyThisDecision:
          "Product recognition is not proof of hidden logo fidelity. FAIL would invent a replacement behind the sticker, while PASS would claim that covered identity-bearing pixels were verified. REVIEW preserves the difference between mismatch and missing evidence.",
        nextAction:
          "Provide an unobstructed candidate or a second approved view that exposes the complete logo region, then rerun the comparison before final publication.",
      },
    ],
    diagnosticQuestions: [
      {
        question: "Which elements form the approved logo rather than ordinary label copy?",
        reason:
          "Identify the symbol, wordmark, lockup, and any required enclosure first. This prevents a changed claim or flavor descriptor from being mislabeled as a brand-mark failure.",
      },
      {
        question: "Can the defining symbol geometry be traced in both images?",
        reason:
          "Silhouette, internal cutouts, strokes, and negative spaces distinguish a real symbol replacement from glare, compression, recoloring, or a soft edge.",
      },
      {
        question: "Are all identity-bearing letters directly readable?",
        reason:
          "Familiar package context can make reviewers mentally complete missing characters. Directly visible spelling and wordmark construction are required for a confident match.",
      },
      {
        question: "Do the supplied views show corresponding logo-bearing package faces?",
        reason:
          "A front wordmark and a back regulatory panel are not mismatched logos. Non-corresponding views create an observability limitation rather than a confirmed identity change.",
      },
      {
        question: "Did only the scene or local illumination change?",
        reason:
          "Background, shadow, reflection, and white balance can change pixels around a stable mark. Review identity geometry and lockup before escalating a photographic difference.",
      },
      {
        question: "Is placement being measured relative to the product or the frame?",
        reason:
          "A product can move, rotate slightly, or scale within the canvas while its logo remains correctly placed on the package. Screen coordinates are not brand placement.",
      },
      {
        question: "Is any required part hidden, cropped, or too small to verify?",
        reason:
          "An honest REVIEW identifies the missing evidence and requests a better view instead of treating recognition, memory, or neighboring text as proof.",
      },
    ],
    failureModes: [
      {
        title: "Symbol substitution inside stable packaging",
        mechanism:
          "The generation preserves bottle, label, typography, and colors but replaces the approved emblem with a semantically plausible alternative such as a sun, leaf, star, or generic badge.",
        consequence:
          "A polished creative can represent a different or nonexistent brand while appearing correct during a quick whole-image review.",
      },
      {
        title: "Wordmark character mutation",
        mechanism:
          "One or more identity-bearing letters are added, removed, merged, repeated, or reshaped while surrounding product copy stays readable and visually consistent.",
        consequence:
          "The image can create trademark, customer-recognition, campaign-consistency, and catalog-quality problems even when the intended name remains guessable.",
      },
      {
        title: "Lockup rebuilt from correct ingredients",
        mechanism:
          "The model retains both symbol and brand name but changes their order, alignment, enclosure, orientation, spacing, or relative scale into a new composition.",
        consequence:
          "Teams may overlook a brand-system violation because every expected ingredient appears somewhere in the candidate.",
      },
      {
        title: "Identity lost behind an obstruction",
        mechanism:
          "A sticker, hand, prop, reflection, fold, crop, or package turn covers the region needed to distinguish the approved mark from an altered one.",
        consequence:
          "Approving from context alone converts missing evidence into false confidence and can let a hidden mutation reach production.",
      },
      {
        title: "Scene color mistaken for a new mark",
        mechanism:
          "Colored light, white balance, metallic reflection, transparency, or contrast shifts alter logo pixels while the defining symbol and wordmark geometry remain unchanged.",
        consequence:
          "False alarms slow creative production and encourage reviewers to distrust a checker that cannot separate identity from photography.",
      },
      {
        title: "Product movement mistaken for logo relocation",
        mechanism:
          "The candidate changes framing, scale, position, or minor perspective, causing the logo to occupy different screen coordinates even though it remains fixed to the same package region.",
        consequence:
          "A frame-based comparison rejects faithful recomposition and misses the distinction between layout change and product-identity change.",
      },
    ],
    workflow: [
      {
        title: "Define the approved identity assets",
        detail:
          "Record the exact symbol, wordmark, combined lockup, permitted variants, required clear relationships, and any placement rule that is approval-critical for this product face.",
      },
      {
        title: "Choose a corresponding reference",
        detail:
          "Use an approved image of the same product and logo-bearing face. Do not compare a front primary mark with a back panel, cap monogram, campaign badge, or sibling SKU variant.",
      },
      {
        title: "Inspect geometry before color",
        detail:
          "Trace silhouette, negative space, strokes, letter sequence, and lockup composition first so lighting and palette changes do not dominate the identity decision.",
      },
      {
        title: "Check wordmark and symbol separately",
        detail:
          "Confirm that each identity component remains faithful before evaluating their relative scale, order, alignment, and placement as one lockup.",
      },
      {
        title: "Classify presentation and observability",
        detail:
          "Allow ordinary background, shadow, reflection, position, and minor perspective changes. Mark crop, obstruction, tiny scale, glare, or non-corresponding faces as missing evidence rather than a mismatch.",
      },
      {
        title: "Resolve the decision and next action",
        detail:
          "Correct a confirmed replacement, accept a fully observable match, or request an unobstructed export when the brand area cannot support a reliable answer.",
      },
      {
        title: "Recheck the publishable export",
        detail:
          "Repeat the comparison after localization, resizing, compositing, compression, or marketplace export because those final transformations can introduce new logo damage or hide prior evidence.",
      },
    ],
    limitations: [
      "Pairvu compares visible raster evidence and does not authenticate trademarks, establish legal ownership, search trademark registries, or determine whether a logo variant is contractually authorized.",
      "A logo PASS applies only to the supplied product face and visible identity regions; it cannot verify marks hidden on backs, caps, seals, cartons, inserts, interiors, or out-of-frame surfaces.",
      "The system does not compare against vector master artwork, brand guidelines, Pantone specifications, minimum-size rules, clear-space measurements, print tolerances, or production proofs.",
      "Low resolution, compression, antialiasing, curved surfaces, metallic finishes, transparency, glare, and reflections can limit exact stroke and letterform evaluation even when the product remains recognizable.",
      "A palette difference alone is not treated as a logo identity failure under this M0 scope when symbol and wordmark geometry remain intact; use the product-color workflow for major package palette questions.",
      "Pairvu cannot infer hidden letters or geometry from brand familiarity. A covered or non-corresponding logo region requires REVIEW even when surrounding package cues strongly suggest the same product.",
      "One approved reference may not represent every legitimate logo lockup, regional mark, co-brand, campaign badge, embossed variant, monochrome treatment, or packaging revision used by a brand.",
      "A visible logo match does not certify label wording, product claims, capacity, package count, components, container geometry, marketplace compliance, or the physical product that will ship.",
    ],
    faq: [
      {
        question: "What counts as a logo change in an AI product image?",
        answer:
          "A logo change materially alters an identity-bearing symbol, wordmark, combined lockup, or approval-critical brand placement. The ELARA crescent becoming a sun is a clear example because both marks are observable while the rest of the label remains stable.",
      },
      {
        question: "Is a different logo color always a logo failure?",
        answer:
          "No. Under the current scope, identity is based primarily on symbol and wordmark geometry. Scene light, reflection, white balance, or a broader package palette can change apparent color without creating a new logo. Review product color separately when palette fidelity matters.",
      },
      {
        question: "Why does a partially covered logo receive REVIEW rather than FAIL?",
        answer:
          "The obstruction proves that required evidence is missing, not that the hidden mark changed. FAIL would invent unseen pixels and PASS would pretend they were verified. REVIEW asks for an unobstructed or corresponding view.",
      },
      {
        question: "Can a logo PASS when the background, shadow, or reflection changes?",
        answer:
          "Yes. Those are presentation variables. The logo can PASS when its defining symbol, wordmark, lockup, and product-relative placement remain sufficiently observable and materially consistent despite a new environment or illumination.",
      },
      {
        question: "Does moving the product in the frame change logo placement?",
        answer:
          "Not by itself. Logo placement is evaluated relative to the package and stable label landmarks, not absolute canvas coordinates. Repositioning, resizing, or a minor perspective change can preserve the approved brand placement.",
      },
      {
        question: "Does Pairvu certify that a logo is legally approved?",
        answer:
          "No. Pairvu compares the visible candidate with the supplied approved reference. Brand owners still control legal clearance, trademark usage, authorized variants, brand-guideline compliance, and the final publication decision.",
      },
    ],
  },
  {
    route: "/checks/product-color",
    founderApprovedAt: "2026-08-04",
    audience:
      "Brand owners, creative teams, catalog operators, agencies, and product-image reviewers who must decide whether an AI-generated or edited image still represents the approved shade, flavor, scent, formula, finish, package palette, or color-coded product variant before publication.",
    directAnswer:
      "To check product color in an AI image, compare corresponding semantic regions rather than raw pixels. First identify the product body, primary label or artwork field, variant-coded accents, closures, and transparent or reflective materials. Then decide whether those same regions are visible under usable illumination in both images. PASS when observable color families and their product meaning remain stable, REVIEW when a visible palette change may be intentional or when glare, crop, transparency, or viewpoint prevents verification, and FAIL when readable variant identity and its associated approved color are both confirmed changed.",
    scopeDistinction:
      "Product-color QA asks whether the candidate still communicates the approved product identity through color. It is not pixel matching, background matching, white-balance grading, Pantone measurement, print-proof approval, or physical-sample colorimetry. A cream label under warm light can still represent the same cream label; a package recoded from FRESH MINT in pale green to CHARCOAL CLEAN in dark gray represents a different variant. Color can also be absent from evidence: a label-only crop cannot prove the color of a pouch body outside the frame.",
    deck:
      "Color is often both visual styling and product information. The useful question is not whether two images contain different RGB values, but whether a corresponding product region changed semantic color, whether that color encodes a different variant, and whether the candidate supplies enough coverage to know. This method separates confirmed variant drift, color-only changes needing intent confirmation, harmless illumination, and unavailable color evidence.",
    dimensions: [
      {
        title: "Product-body color family",
        definition:
          "The dominant semantic color of the actual container, tube, pouch, carton, or product surface after discounting background, cast shadow, highlight, and small decorative marks. Compare the same physical region on corresponding package faces.",
        example:
          "An ORVENA toothpaste tube changing from muted pale mint to dark charcoal changes the body color family even though its white cap and tube geometry remain stable.",
      },
      {
        title: "Primary artwork field",
        definition:
          "The large label panel, printed field, sleeve, or front artwork block that carries the product's approved palette. Its color may be more identity-bearing than the neutral bottle around it.",
        example:
          "A cream-and-orange serum label becoming dark green is a product-artwork change even when the frosted glass bottle remains unchanged.",
      },
      {
        title: "Variant-coded palette",
        definition:
          "Colors associated with readable flavor, scent, formula, shade, strength, or size variants. Review color together with the text or symbol that explains what the palette means commercially.",
        example:
          "FRESH MINT on a pale green tube becoming CHARCOAL CLEAN on a dark tube is stronger evidence than color difference alone because the visible variant identity changes too.",
      },
      {
        title: "Material and transparency interaction",
        definition:
          "The way translucent plastic, clear glass, liquid, foil, holographic film, metallic ink, or glossy laminate changes apparent color under light. Material cues determine whether color is intrinsic or illumination-dependent.",
        example:
          "A rainbow reflection crossing a serum label can alter local pixels without proving that the approved printed color or product formula changed.",
      },
      {
        title: "Illumination separation",
        definition:
          "Evidence that distinguishes package color from ambient warmth, white balance, directional highlights, window shadows, exposure, and reflected surroundings. Stable text and material landmarks help establish correspondence.",
        example:
          "A MIREVA amber bottle photographed in warmer light can preserve the same amber body, cream label, green print, and black pump despite a different scene tone.",
      },
      {
        title: "Corresponding-region coverage",
        definition:
          "Whether the same body, label, cap, and color-bearing regions are actually inside both frames. A region cannot match or mismatch when one image shows only a different face or an isolated label crop.",
        example:
          "A complete orange laundry pouch compared with a crop of its white label can verify label text but cannot verify the orange pouch body outside the candidate frame.",
      },
      {
        title: "Color observability threshold",
        definition:
          "The minimum resolution, exposure, glare control, area coverage, and confidence required to make a color claim. Recognition of the product does not automatically make every color-bearing region observable.",
        example:
          "A heavily reflected label may remain readable yet require REVIEW for color because the glare covers too much of the surface used to judge its base palette.",
      },
    ],
    decisionRules: [
      {
        condition: "Corresponding package-body region",
        pass: "The same body region is visible in both images and retains the approved semantic color family despite ordinary exposure variation.",
        review: "The candidate crops, hides, turns away, or replaces the body region with a close-up that cannot establish its dominant package color.",
        fail: "The corresponding body is clearly visible and changes color together with confirmed approval-critical variant or identity evidence.",
      },
      {
        condition: "Primary label or artwork palette",
        pass: "Large approval-relevant artwork fields preserve their color hierarchy, boundaries, and relationship to readable product identity.",
        review: "The artwork visibly changes color but user intent or an approved alternate palette is unknown, so publication requires confirmation.",
        fail: "A visible artwork recoloring accompanies a confirmed wrong product name, formula, flavor, scent, shade, or other critical identity fact.",
      },
      {
        condition: "Readable variant cue",
        pass: "Variant wording or symbols and their associated palette remain readable, corresponding, and materially consistent in both images.",
        review: "The palette differs while the variant cue is hidden, unreadable, ambiguous, or possibly an approved alternate treatment.",
        fail: "Both images expose readable variant evidence and the candidate substitutes a different variant and its color-coded presentation.",
      },
      {
        condition: "Lighting and white balance",
        pass: "Color differences are consistent with a global lighting, exposure, or white-balance shift while product-relative color relationships remain stable.",
        review: "Mixed lighting or severe color cast prevents separation of illumination from a possible package recoloring on a required region.",
        fail: "The change remains localized to a corresponding product region and is corroborated by changed identity evidence rather than scene light.",
      },
      {
        condition: "Reflection, glare, and metallic response",
        pass: "Highlights or reflections move across the surface without changing the observable base palette outside the affected area.",
        review: "Glare, iridescence, foil response, or reflection covers enough of the region that its underlying approved color cannot be established.",
        fail: "Unaffected areas reveal a confirmed semantic recoloring and the difference is not explainable by the observed reflective material response.",
      },
      {
        condition: "Transparent or translucent packaging",
        pass: "Bottle tint, visible liquid, label, closure, and background interaction remain consistent after accounting for transparency and scene context.",
        review: "Background transmission, fill appearance, or internal reflection makes the container or liquid color uncertain from the supplied views.",
        fail: "Corresponding transparent regions clearly encode a different approved product variant together with corroborating visible identity evidence.",
      },
      {
        condition: "Crop and viewpoint completeness",
        pass: "Every approval-critical color-bearing region is inside both frames at sufficient scale, even if framing or perspective differs modestly.",
        review: "A close crop or different face omits the body, side panel, closure, or artwork area required for the color decision.",
        fail: "The complete corresponding regions are visible and confirm an unacceptable color-linked identity change rather than missing evidence.",
      },
      {
        condition: "Unchanged-image baseline",
        pass: "Identical or faithfully recomposed product evidence preserves semantic colors while background, shadow, and product position may change.",
        review: "Compression, clipping, color profile loss, or inadequate resolution prevents a dependable unchanged-color conclusion.",
        fail: "Direct inspection confirms that an apparently unchanged candidate actually substitutes a different color-coded product identity.",
      },
    ],
    evidence: [
      {
        href: "/examples/toothpaste-variant-color-change",
        title: "Toothpaste body and readable variant changed together",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/toothpaste-color-variant/original.png",
        candidate: "/examples/toothpaste-color-variant/candidate.png",
        alt: "Pale mint FRESH MINT toothpaste compared with charcoal CHARCOAL CLEAN toothpaste",
        observation:
          "The ORVENA tube changes from muted pale green to charcoal gray while FRESH MINT becomes CHARCOAL CLEAN. Logo geometry, 100 g value, white flip cap, package count, tube form, and front-facing composition remain stable.",
        whyThisDecision:
          "The result is a high-confidence FAIL because approval-critical readable variant identity changes alongside the package color. The evidence does not claim that color alone caused failure; text confirms that the candidate represents another variant.",
        nextAction:
          "Restore the approved FRESH MINT wording and pale-mint body, or compare the charcoal variant against its own approved reference before publication.",
      },
      {
        href: "/examples/laundry-pouch-color-change",
        title: "Pouch color changed while identity stayed stable",
        role: "product_change",
        decision: "REVIEW",
        original: "/examples/laundry-pouch-color-change/original.png",
        candidate: "/examples/laundry-pouch-color-change/candidate.png",
        alt: "Orange and pale-pink TIDORA laundry-pods pouches with matching label information",
        observation:
          "The TIDORA pouch changes from matte reddish orange to glossy pale pink. The star logo, TIDORA, LAUNDRY PODS, CLEAN COTTON, 24 PODS, white label, zipper, one-pouch count, and stand-up form remain visible and consistent.",
        whyThisDecision:
          "Pairvu records REVIEW because a major package color visibly changed but the supplied images do not reveal whether the new palette is an approved redesign. Automatically passing would hide drift; automatically failing would invent the user's intent.",
        nextAction:
          "Confirm the approved campaign or variant palette. If pale pink is intended, adopt a matching approved reference; otherwise regenerate the candidate with the orange pouch preserved.",
      },
      {
        href: "/examples/lighting-change-product-image",
        title: "Warmer illumination changed the scene, not the product",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/lighting-change/candidate.jpg",
        alt: "Same MIREVA shampoo bottle under neutral and warmer light",
        observation:
          "The scene becomes warmer, but the MIREVA amber bottle, cream label, green identity print, black pump, readable wording, package count, and cylindrical shape retain their product-relative color relationships.",
        whyThisDecision:
          "A global illumination shift is presentation, not a semantic recoloring. The corresponding product regions remain visible and internally consistent, so a color alarm would be a false positive.",
        nextAction:
          "Accept the product-color check and review exposure or channel-specific creative style separately if the warmer treatment conflicts with campaign requirements.",
      },
      {
        href: "/examples/product-color-not-observable-label-crop",
        title: "A label crop could not verify the pouch-body color",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/product-color-label-crop/original.png",
        candidate: "/examples/product-color-label-crop/candidate.png",
        alt: "Complete orange TIDORA pouch compared with a close crop of its white label",
        observation:
          "The label crop preserves enough evidence to verify the TIDORA logo, LAUNDRY PODS, CLEAN COTTON, and 24 PODS. It does not show the pouch body, zipper, complete outline, or enough surrounding package area to establish the approved orange color.",
        whyThisDecision:
          "Prompt policy v009 and QA Engine v005 correctly return REVIEW with product count, color, components, and shape marked not observable. Comparing the orange body with the white label would compare different semantic regions, while inferring one product from the reference would create a false match.",
        nextAction:
          "Request a candidate showing the complete corresponding pouch face. Keep the verified logo and text findings, but do not approve package color or construction from this crop.",
      },
    ],
    diagnosticQuestions: [
      {
        question: "Which physical or printed region is supposed to carry the approved color?",
        reason:
          "Naming the tube body, label field, cap, band, liquid, or accent prevents background and unrelated white label space from becoming the comparison target.",
      },
      {
        question: "Are the two images showing the same corresponding package face?",
        reason:
          "Front, back, side, and isolated detail crops can legitimately contain different palettes. Color comparison requires region correspondence before similarity is meaningful.",
      },
      {
        question: "Does color encode a readable flavor, scent, shade, formula, or strength?",
        reason:
          "Variant text provides semantic corroboration. A palette difference paired with another variant is stronger evidence than unexplained color difference alone.",
      },
      {
        question: "Is the difference global scene light or localized product artwork?",
        reason:
          "Global warmth, exposure, and white balance affect the entire scene, while a localized region change with stable surroundings is more likely an edited product attribute.",
      },
      {
        question: "Do reflection, transparency, gloss, or metallic material explain the pixels?",
        reason:
          "Material response can produce intense local color without changing the underlying print. Inspect unaffected areas and stable landmarks before deciding.",
      },
      {
        question: "Is enough of the color-bearing region inside the candidate frame?",
        reason:
          "A recognizable logo or label does not establish the body color beyond the crop. Missing coverage requires REVIEW rather than invented match or mismatch.",
      },
    ],
    failureModes: [
      {
        title: "Variant recoloring with text drift",
        mechanism:
          "Generation substitutes a nearby flavor, scent, formula, or shade and changes both the variant wording and its associated palette while preserving the brand template.",
        consequence:
          "The image can advertise the wrong product variant even though logo, package form, and most copy still look professionally consistent.",
      },
      {
        title: "Color-only redesign without approval context",
        mechanism:
          "An editing model recolors a large body or label region but leaves identity text unchanged, making visual drift obvious while user intent remains unknown.",
        consequence:
          "The result needs human confirmation because automatic PASS hides an unapproved design and automatic FAIL may reject an intentional campaign treatment.",
      },
      {
        title: "Lighting mistaken for package color",
        mechanism:
          "Warm light, colored bounce, exposure, or white balance shifts product pixels globally while the package's internal color relationships remain intact.",
        consequence:
          "A naive pixel comparison creates false alarms, slows creative production, and teaches reviewers to distrust valid color warnings.",
      },
      {
        title: "Reflection mistaken for printed ink",
        mechanism:
          "Gloss, foil, holographic film, glass, or curved plastic reflects colored surroundings across a label or container region.",
        consequence:
          "The checker may overstate a temporary optical effect unless it recognizes the material cue and requests review where the base color is covered.",
      },
      {
        title: "Non-corresponding crop comparison",
        mechanism:
          "A complete package body in the reference is compared with an isolated label, back panel, or close detail in the candidate.",
        consequence:
          "Different semantic regions produce a false color mismatch and can also create unsupported claims about components and package shape.",
      },
      {
        title: "Transparent-content ambiguity",
        mechanism:
          "A clear or tinted package transmits a new background or exposes a liquid under different illumination, changing apparent body color.",
        consequence:
          "Without controlled coverage and lighting, the image cannot prove whether the container, liquid, or environment caused the visual change.",
      },
    ],
    workflow: [
      {
        title: "Name the color-bearing product regions",
        detail:
          "Before comparing, list the approved body, artwork field, variant accent, closure, and any transparent or reflective regions that matter to product identity.",
      },
      {
        title: "Confirm face and region correspondence",
        detail:
          "Ensure both images expose the same package face and enough surrounding structure to locate each color observation on the product rather than the scene.",
      },
      {
        title: "Read variant identity before judging palette",
        detail:
          "Transcribe visible flavor, scent, shade, formula, strength, and size cues. Use them to determine whether a palette change also represents another product variant.",
      },
      {
        title: "Separate illumination and material response",
        detail:
          "Check background light, neutral areas, shadows, highlights, transparency, gloss, and reflection. Look for stable unaffected regions that reveal the base palette.",
      },
      {
        title: "Apply the evidence-aware decision",
        detail:
          "PASS observable matching color, REVIEW intent-dependent recoloring or insufficient coverage, and FAIL only when confirmed critical identity evidence establishes the wrong product.",
      },
      {
        title: "Resolve the precise cause",
        detail:
          "Correct the candidate, approve the intentional palette, switch to the correct variant reference, or request a wider unobstructed image according to the finding.",
      },
      {
        title: "Rerun against the approved source",
        detail:
          "Compare the corrected final export again. Preserve the reference, model and prompt versions, latency, result, and reviewer feedback for regression tracking.",
      },
    ],
    limitations: [
      "Pairvu compares visible raster evidence and does not measure Pantone values, LAB coordinates, Delta E, ink density, substrate color, print tolerances, or a physical production sample.",
      "Display calibration, browser color management, embedded profiles, compression, screenshots, and export conversion can affect apparent color outside the model's control.",
      "A PASS applies only to observable corresponding regions. Hidden backs, side panels, caps, cartons, inserts, interiors, and out-of-frame body areas remain unverified.",
      "The system cannot decide whether a new palette, seasonal edition, campaign treatment, regional design, or authorized variant is commercially approved without an appropriate reference or human confirmation.",
      "Transparent liquid, translucent plastic, glass tint, metallic ink, foil, holographic film, gloss, curved surfaces, glare, and colored reflections can require REVIEW even when the product is unchanged.",
      "Product color QA does not certify exact photographic color reproduction, color accessibility, marketplace compliance, legal claims, trademark use, or the physical color customers will receive.",
      "A visible palette match does not certify logo identity, wording, printed quantity, product count, components, package geometry, or fulfillment accuracy; those checks remain separate.",
      "One approved reference may not represent every legitimate shade, scent, formula, flavor, strength, size, package revision, or market-specific palette in a product family.",
    ],
    faq: [
      {
        question: "What counts as a product color change in an AI image?",
        answer:
          "A product color change alters the semantic color family of a corresponding body, label, artwork, closure, or variant-coded region. It is stronger when readable variant evidence also changes and weaker when the difference follows scene lighting or reflection.",
      },
      {
        question: "Should every visible package recoloring automatically FAIL?",
        answer:
          "No. A color-only change receives REVIEW under the current M0 behavior because Pairvu cannot infer whether the user intended an approved redesign. A confirmed wrong readable variant combined with color drift can produce FAIL.",
      },
      {
        question: "Why can warmer light still produce PASS?",
        answer:
          "Lighting is a presentation variable. When color relationships remain stable across the bottle, label, print, and closure and other product facts match, a global warm shift does not mean the product itself was recolored.",
      },
      {
        question: "Why does a label-only crop receive REVIEW for product color?",
        answer:
          "The crop can verify facts inside the label, including logo and readable text, but cannot prove the package-body color outside its frame. Claiming either match or mismatch would exceed the visible evidence.",
      },
      {
        question: "Can Pairvu verify exact brand colors or Pantone values?",
        answer:
          "No. Pairvu performs semantic visual comparison from raster images. Exact brand-color certification requires controlled capture, calibrated displays, source artwork, color-managed production files, and often physical print measurement.",
      },
      {
        question: "How should reflective or holographic packaging be checked?",
        answer:
          "Use views that expose unaffected base-color areas and similar lighting when possible. If reflection covers the required region, mark color not observable and request another image rather than treating the reflected hue as printed color.",
      },
      {
        question: "Can a color match prove the candidate is the correct product?",
        answer:
          "No. Different variants can share a palette, and a candidate can preserve color while changing logo, label text, quantity, components, or shape. Product approval requires the full set of relevant checks.",
      },
    ],
  },
];

export function getCheckPageContent(route: string) {
  return checkPageContents.find((page) => page.route === route);
}
