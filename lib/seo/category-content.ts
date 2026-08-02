export type CategoryDecision = "PASS" | "REVIEW" | "FAIL";
export type CategoryEvidenceRole = "product_change" | "hard_negative" | "observability";

export type CategoryPageContent = {
  route: string;
  founderApprovedAt: string;
  audience: string;
  searchIntentEvidence: string;
  deck: string;
  packagingFormats: string[];
  identityHierarchy: Array<{
    priority: string;
    attribute: string;
    reason: string;
  }>;
  decisionRules: Array<{
    attribute: string;
    pass: string;
    review: string;
    fail: string;
  }>;
  evidence: Array<{
    href: string;
    title: string;
    role: CategoryEvidenceRole;
    decision: CategoryDecision;
    original: string;
    candidate: string;
    alt: string;
    observation: string;
    lesson: string;
  }>;
  failureModes: Array<{
    title: string;
    detail: string;
    businessRisk: string;
  }>;
  uniqueInsights: Array<{
    title: string;
    paragraphs: string[];
  }>;
  inputRequirements: Array<{
    title: string;
    detail: string;
  }>;
  workflow: Array<{
    title: string;
    detail: string;
  }>;
  limitations: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
};

export const categoryPageContents: readonly CategoryPageContent[] = [
  {
    route: "/categories/cosmetics-product-image-qa",
    founderApprovedAt: "2026-08-03",
    audience:
      "Cosmetics brand owners, ecommerce operators, creative agencies, and production teams reviewing AI-generated or AI-edited pack shots before a product page, retailer asset, campaign, or marketplace listing is published.",
    searchIntentEvidence:
      "The page answers a category-specific decision question rather than repeating the generic checker: which visible attributes establish the identity of a cosmetics SKU, which scene changes are harmless, and when incomplete evidence should stop an automatic approval.",
    deck:
      "Cosmetics packaging can look polished while a logo, product line, shade cue, volume, concentration, closure, or applicator has drifted. Pairvu compares the final candidate with an approved reference and separates confirmed product changes from harmless scene changes and details that cannot be verified.",
    packagingFormats: [
      "Dropper bottles and treatment serums",
      "Pump bottles and airless dispensers",
      "Jars, pots, and compacts",
      "Tubes and squeeze packaging",
      "Lipstick, mascara, and stick formats",
      "Cartons shown as the primary approved pack",
    ],
    identityHierarchy: [
      {
        priority: "1",
        attribute: "Brand and logo",
        reason:
          "The brand name and its symbol establish who the product belongs to. A plausible replacement mark is still the wrong product identity, even when the bottle and typography look polished.",
      },
      {
        priority: "2",
        attribute: "Product line and product type",
        reason:
          "SERUM, CLEANSER, SPF, MASCARA, and other line or type wording distinguish products that may share the same parent brand and packaging family.",
      },
      {
        priority: "3",
        attribute: "Variant, shade, strength, or finish",
        reason:
          "Shade names, concentrations, SPF values, finish names, and variant color systems can identify a different sellable SKU even when the master packaging is unchanged.",
      },
      {
        priority: "4",
        attribute: "Printed quantity and concentration",
        reason:
          "Net volume, weight, percentage, or strength is customer-facing product information. A 30 mL reference must not silently become 50 mL in the final creative.",
      },
      {
        priority: "5",
        attribute: "Container and closure",
        reason:
          "Bottle, jar, tube, cap, pump, and dropper geometry can distinguish a product or pack revision. Shape must be compared separately from crop and viewpoint.",
      },
      {
        priority: "6",
        attribute: "Applicators and included components",
        reason:
          "A wand, spatula, brush, pipette, cap, or separate applicator changes what customers believe is included and should not appear or disappear without approval.",
      },
      {
        priority: "7",
        attribute: "Semantic packaging color",
        reason:
          "A deliberate label or shade-family color can signal a variant. Pairvu should compare that semantic color while allowing normal warmth, reflections, highlights, and background spill.",
      },
    ],
    decisionRules: [
      {
        attribute: "Brand or logo",
        pass: "The same mark, wording, and visible placement remain identifiable.",
        review: "A crop, glare, hand, prop, or overlay hides enough of the mark to prevent direct comparison.",
        fail: "The mark is replaced, redrawn into a different symbol, removed, or paired with another brand name.",
      },
      {
        attribute: "Product line or type",
        pass: "Identity-bearing line and product-type wording matches on corresponding package faces.",
        review: "The required label face is turned away, too small, blurred, or partly hidden.",
        fail: "The visible product name or type changes, disappears, or is replaced by different wording.",
      },
      {
        attribute: "Shade, variant, strength, or finish",
        pass: "The same visible variant name, strength, and approved semantic cues remain present.",
        review: "Lighting or reflection makes the shade cue uncertain and printed variant text is not readable.",
        fail: "A visible shade name, percentage, SPF value, finish, or variant designation changes.",
      },
      {
        attribute: "Volume or weight",
        pass: "The candidate preserves the approved visible quantity.",
        review: "The quantity area is outside the crop or below readable resolution.",
        fail: "The printed quantity changes, for example from 30 mL to 50 mL.",
      },
      {
        attribute: "Container shape",
        pass: "The same container silhouette remains after allowing scale and minor perspective.",
        review: "A tight crop or large viewpoint difference hides the base, shoulders, or side profile.",
        fail: "The approved bottle, jar, compact, or tube becomes a materially different packaging form.",
      },
      {
        attribute: "Closure and applicator",
        pass: "Approved pumps, caps, droppers, wands, and included tools are present without extras.",
        review: "A component is plausibly hidden behind the product or outside the photographed face.",
        fail: "A required component is missing, materially changed, or an unapproved applicator is added.",
      },
      {
        attribute: "Packaging color",
        pass: "Label and container color families remain semantically consistent despite ordinary scene lighting.",
        review: "Strong colored light, glare, translucency, or reflection prevents a confident semantic comparison.",
        fail: "A deliberate packaging color block changes enough to indicate different artwork or a different variant.",
      },
      {
        attribute: "Background and composition",
        pass: "Only the setting, shadow, framing, or product position changes while visible product identity remains stable.",
        review: "The new composition hides identity-bearing attributes required for approval.",
        fail: "The composition introduces or removes a product, accessory, or visible packaging element that changes the offer.",
      },
    ],
    evidence: [
      {
        href: "/examples/logo-change-ai-product-image",
        title: "Crescent logo changed to a sun",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/logo-change/original.jpg",
        candidate: "/examples/logo-change/candidate.jpg",
        alt: "Cosmetics serum with an approved crescent logo compared with a candidate sun logo",
        observation:
          "The ELARA brand name, VITAMIN C SERUM wording, BRIGHTENING text, 30 mL value, bottle, and dropper remain stable. Only the symbol above the brand changes from a crescent to a sun.",
        lesson:
          "A localized symbol change is enough to fail brand identity. The system should not excuse it because most of the package is visually similar.",
      },
      {
        href: "/examples/background-change-ai-product-image",
        title: "Lifestyle background changed, product stayed faithful",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/background-change/original.jpg",
        candidate: "/examples/background-change/candidate.jpg",
        alt: "The same cosmetics serum on a plain background and in a lifestyle setting",
        observation:
          "The serum moves from a neutral studio background into a bathroom-style setting. The crescent mark, ELARA name, label wording, 30 mL value, dropper, bottle, and label colors remain visible and consistent.",
        lesson:
          "Background replacement is a normal creative operation. A useful product QA system must preserve a PASS when the scene changes but the approved product does not.",
      },
      {
        href: "/examples/partially-visible-product-image",
        title: "Incomplete package coverage requires another view",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/partial-product-coverage/candidate.jpg",
        alt: "A full personal-care bottle compared with a close crop that hides the lower package",
        observation:
          "The upper label and pump remain visible, but the candidate crop removes the lower package and prevents complete verification of quantity, lower-panel wording, and the full silhouette.",
        lesson:
          "Visible matching details do not justify PASS when other required attributes are outside the image. REVIEW means the input does not provide enough evidence, not that a defect was confirmed.",
      },
    ],
    failureModes: [
      {
        title: "Brand mark substitution",
        detail:
          "Generative editing may preserve typography and layout while redrawing a simple moon, leaf, flower, monogram, or geometric mark into a different symbol.",
        businessRisk:
          "The image can look professionally finished while representing the wrong brand asset or an unapproved logo revision.",
      },
      {
        title: "Variant and shade drift",
        detail:
          "A model may alter a shade name, strength, finish, color band, or variant cue because those details occupy a small portion of the image.",
        businessRisk:
          "Customers may receive a product page or campaign visual that implies another sellable SKU even though the container looks familiar.",
      },
      {
        title: "Plausible printed-value changes",
        detail:
          "Numbers and units are especially easy to regenerate into another plausible value while surrounding label text remains coherent.",
        businessRisk:
          "A wrong net volume, percentage, or strength creates a concrete mismatch between the approved pack and the published creative.",
      },
      {
        title: "Component hallucination or removal",
        detail:
          "Droppers, pumps, wands, spatulas, lids, brushes, and caps may be simplified, removed, duplicated, or placed beside the product as a separate accessory.",
        businessRisk:
          "The candidate can misrepresent how the product is dispensed or what the customer receives with the package.",
      },
      {
        title: "Scene color mistaken for product color",
        detail:
          "Warm lighting, reflected surfaces, translucent glass, and colored environments can shift pixels without changing the approved packaging artwork.",
        businessRisk:
          "Over-sensitive comparison creates false alarms, slows approvals, and makes teams stop trusting the checker.",
      },
    ],
    uniqueInsights: [
      {
        title: "Cosmetics identity is hierarchical, not one visual score",
        paragraphs: [
          "A cosmetics image can match at the brand level and still show the wrong sellable variant. The correct comparison order is brand, product line, product type, variant or shade, strength, quantity, container, and included components. Matching a crescent logo does not prove that a 10% serum, a 15% serum, and a 30 mL travel size are interchangeable.",
          "For that reason Pairvu groups evidence by attribute and returns PASS, REVIEW, or FAIL instead of leading with a single similarity score. Teams need to know which identity layer changed and whether the change was actually observable.",
        ],
      },
      {
        title: "Color needs semantic evidence",
        paragraphs: [
          "Cosmetics frequently use color to identify shades and variants, but photography also introduces highlight, white-balance, translucency, and reflection changes. A pixel-level color difference is not enough to call the product wrong.",
          "A confident color failure should be supported by a deliberate packaging region, readable shade or variant text, or a stable color block that changes independently of the surrounding light. When the only evidence is glare or a colored reflection, REVIEW is more honest than FAIL.",
        ],
      },
      {
        title: "A polished image can still be unapprovable",
        paragraphs: [
          "AI product images often fail through small, plausible edits rather than obvious visual corruption. A sharp, attractive candidate may contain a new icon, altered 30 mL value, missing dropper, or cropped lower label. Production quality and product fidelity are different approval questions.",
          "Pairvu focuses on visible fidelity. A PASS means the observable attributes checked against the reference matched; it does not certify ingredients, regulatory wording, physical shade accuracy, or marketplace compliance.",
        ],
      },
    ],
    inputRequirements: [
      {
        title: "Use the approved SKU, not a related variant",
        detail:
          "The reference should be the exact product line, shade or formulation, size, and packaging revision that the candidate is expected to represent.",
      },
      {
        title: "Keep required label text readable",
        detail:
          "Brand, product name, variant, strength, and quantity must occupy enough pixels for direct comparison. Recognition of the overall pack is not a substitute for readable identity text.",
      },
      {
        title: "Show the components being approved",
        detail:
          "If a pump, cap, dropper, wand, or applicator is part of the approval decision, it must be visible in both images or explicitly routed to REVIEW.",
      },
      {
        title: "Include the complete silhouette when shape matters",
        detail:
          "Avoid crops that remove the base, shoulders, cap, or side profile when container identity or size presentation needs verification.",
      },
      {
        title: "Compare corresponding package faces",
        detail:
          "A front-label reference and back-label candidate do not provide evidence that front identity text matches. Supply another view instead of treating different faces as changed wording.",
      },
    ],
    workflow: [
      {
        title: "Lock the approval reference",
        detail:
          "Select the current approved SKU image and confirm its brand, line, variant, quantity, container, closure, and included-component expectations before creative production begins.",
      },
      {
        title: "Compare the final candidate",
        detail:
          "Run the image that will actually be delivered or published. Earlier drafts do not prove that the final export preserved small label details.",
      },
      {
        title: "Resolve confirmed FAIL findings",
        detail:
          "Correct changed identity text, values, logos, colors, packaging, or components. Do not override a confirmed change merely because the overall image looks similar.",
      },
      {
        title: "Collect evidence for REVIEW findings",
        detail:
          "Replace tiny, cropped, hidden, reflective, or non-corresponding views with a candidate that exposes the required attribute. REVIEW should create a concrete next action.",
      },
      {
        title: "Approve and retain the decision",
        detail:
          "Publish only the checked candidate and keep the reference, result, and human feedback connected to the creative approval record used by the team.",
      },
    ],
    limitations: [
      "Pairvu does not verify ingredient lists, allergens, formulation, efficacy, safety, or whether claims are legally permitted.",
      "A visible match does not prove calibrated shade accuracy across cameras, displays, print processes, or physical products.",
      "Pairvu does not validate barcodes, batch codes, expiry dates, regulatory symbols, or complete back-panel compliance.",
      "The system compares what is visible in the supplied images; hidden, cropped, blurred, tiny, or reflective attributes may require REVIEW.",
      "A PASS is not marketplace certification and does not replace retailer, legal, regulatory, or brand-governance review.",
      "The current M0 supports one reference image and one candidate image rather than a full multi-angle product record.",
    ],
    faq: [
      {
        question: "Can Pairvu check whether an AI cosmetics image uses the correct logo?",
        answer:
          "Yes, when the logo is sufficiently visible in both images. A replaced or materially changed mark can produce FAIL; a hidden, cropped, or unreadable mark should produce REVIEW rather than a false PASS.",
      },
      {
        question: "Should a new background make the cosmetics image fail?",
        answer:
          "No. Background, shadow, lighting, and ordinary repositioning are presentation changes. They should pass when the observable product identity, label, color system, quantity, container, and components remain faithful.",
      },
      {
        question: "Can Pairvu verify an exact makeup shade?",
        answer:
          "Pairvu can compare visible shade names, variant cues, and semantic packaging colors. It does not provide calibrated physical color measurement, so strong reflection, translucency, or uncertain lighting may require human review.",
      },
      {
        question: "What happens when label text is too small to read?",
        answer:
          "The honest result is REVIEW for the affected attribute. The candidate should be replaced with a higher-resolution or better-framed image before approval rather than being treated as a match.",
      },
      {
        question: "Does PASS mean the cosmetics image is legally compliant?",
        answer:
          "No. PASS only means the sufficiently observable visual fidelity checks matched the supplied approved reference. Claims, ingredients, regulation, safety, retailer requirements, and physical product accuracy remain separate reviews.",
      },
    ],
  },
];

export function getCategoryPageContent(route: string) {
  return categoryPageContents.find((page) => page.route === route);
}
