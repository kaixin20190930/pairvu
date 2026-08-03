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
];

export function getCheckPageContent(route: string) {
  return checkPageContents.find((page) => page.route === route);
}
