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
  {
    route: "/categories/beverage-product-image-qa",
    founderApprovedAt: "2026-08-03",
    audience:
      "Beverage brand teams, ecommerce operators, distributors, creative agencies, and production reviewers checking AI-generated or AI-edited cans, bottles, cartons, and multipack imagery before a listing, campaign, retailer submission, or delivery asset is published.",
    searchIntentEvidence:
      "The page answers beverage-specific approval questions that a generic image checker cannot resolve alone: how to distinguish printed capacity from visible unit count, when flavor or formulation wording establishes another SKU, how to treat condensation and metallic reflections, and when an obscured front panel requires another image instead of a product-change verdict.",
    deck:
      "A beverage image can preserve the familiar can design while changing 330 mL to 500 mL, replacing a flavor, removing a zero-sugar claim, adding another unit, or hiding the brand behind a sticker. Pairvu compares the candidate with an approved reference and separates confirmed beverage identity changes from harmless lighting, shadow, reflection, and composition edits.",
    packagingFormats: [
      "Aluminum cans and slim cans",
      "Glass and plastic bottles with visible caps",
      "Cartons, aseptic packs, and juice boxes",
      "Single-serve pouches and drink sachets",
      "Multipack cartons, trays, and shrink-wrapped packs",
      "Primary product groups shown as an approved offer",
    ],
    identityHierarchy: [
      {
        priority: "1",
        attribute: "Brand and master logo",
        reason:
          "The visible brand name and mark establish product ownership. A star, wordmark, crest, or icon that is replaced or materially redrawn represents a different identity even when the container and color palette remain familiar.",
      },
      {
        priority: "2",
        attribute: "Product and flavor name",
        reason:
          "Lime, orange, cola, original, sparkling water, energy drink, and similar wording separates products that may share the same container and master brand system.",
      },
      {
        priority: "3",
        attribute: "Formula and customer-facing claims",
        reason:
          "Zero sugar, caffeine, electrolyte, organic, alcohol percentage, and other prominent visible statements can define the advertised formulation and must not drift during generation.",
      },
      {
        priority: "4",
        attribute: "Printed capacity or net contents",
        reason:
          "A printed 330 mL, 500 mL, 12 fl oz, or other net-content value describes the size of each package. It is different from the number of packages shown in the scene.",
      },
      {
        priority: "5",
        attribute: "Visible primary product count",
        reason:
          "One approved can becoming two cans changes the offer presented to the customer even if every printed label and capacity value remains identical.",
      },
      {
        priority: "6",
        attribute: "Container and closure",
        reason:
          "Can profile, bottle silhouette, carton form, cap, crown, tab, and closure style can distinguish pack revisions or formats and should be judged separately from perspective.",
      },
      {
        priority: "7",
        attribute: "Variant color system",
        reason:
          "A stable color block can identify a flavor or formulation, but metallic highlights, condensation, colored light, and reflected surroundings must not automatically become product-color failures.",
      },
      {
        priority: "8",
        attribute: "Multipack structure and pack count",
        reason:
          "A printed 6-pack or 12-pack claim and the visible multipack container describe a different commercial unit from a loose single beverage, even when the primary can artwork matches.",
      },
    ],
    decisionRules: [
      {
        attribute: "Brand or logo",
        pass: "The same beverage brand name, mark, and identifiable placement remain sufficiently visible.",
        review: "Condensation, a sticker, a hand, a crop, or glare hides enough of the brand area to prevent direct comparison.",
        fail: "The visible wordmark or symbol is replaced, removed, materially redrawn, or paired with a different brand name.",
      },
      {
        attribute: "Product or flavor",
        pass: "The product type and flavor wording match on corresponding visible package faces.",
        review: "The relevant flavor panel is turned away, below readable resolution, cropped, or hidden by a prop.",
        fail: "A visible product type, flavor name, or variant designation changes or disappears from the candidate.",
      },
      {
        attribute: "Formula or claim",
        pass: "Prominent identity-bearing claims such as ZERO SUGAR remain visibly consistent with the reference.",
        review: "The candidate does not provide readable coverage of the claim area required for approval.",
        fail: "A visible formulation, caffeine, sugar, alcohol, electrolyte, or comparable product-defining claim changes.",
      },
      {
        attribute: "Printed capacity",
        pass: "The same capacity or net-content value and unit remain visible on the corresponding package face.",
        review: "The value is too small, blurred, reflected, cropped, or located on a package face not shown in the candidate.",
        fail: "The printed package capacity changes, for example from 330 mL to 500 mL, even if the can artwork matches.",
      },
      {
        attribute: "Product unit count",
        pass: "The visible number of primary beverage units matches the approved composition or offer.",
        review: "A unit may be hidden behind another product, outside the frame, or ambiguous because of a tight crop.",
        fail: "The candidate visibly adds or removes a can, bottle, carton, or other primary product unit.",
      },
      {
        attribute: "Container and closure",
        pass: "Container form and visible closure remain consistent after allowing scale and minor perspective.",
        review: "The crop or viewpoint hides the top, base, side profile, cap, tab, or other geometry required for comparison.",
        fail: "The approved can, bottle, or carton becomes a materially different container or closure design.",
      },
      {
        attribute: "Packaging color",
        pass: "The semantic flavor and brand color system remains stable despite ordinary highlights and scene reflections.",
        review: "Colored light, metal reflection, translucency, frost, or condensation prevents a confident semantic comparison.",
        fail: "A deliberate artwork color block changes enough to indicate another flavor, formula, or packaging revision.",
      },
      {
        attribute: "Multipack presentation",
        pass: "The same approved single-unit or multipack structure and visible pack-count presentation remain present.",
        review: "The outer pack or printed pack-count area is partly hidden, unreadable, or outside the candidate frame.",
        fail: "A single unit becomes a multipack, the outer pack changes materially, or a visible pack-count claim changes.",
      },
      {
        attribute: "Scene and condensation",
        pass: "Only background, shadow, reflection, droplets, framing, or position changes while product identity remains observable.",
        review: "Scene effects cover identity-bearing text, color blocks, closure details, or the full unit count needed for approval.",
        fail: "The composition introduces or removes a product, package, attachment, or printed product attribute rather than only changing presentation.",
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
        alt: "NOVA FIZZ beverage cans with 330 mL and 500 mL printed capacities",
        observation:
          "The NOVA FIZZ name, star mark, LIME SPARKLING WATER wording, ZERO SUGAR claim, turquoise-and-white artwork, and can form remain stable. The bottom printed value alone changes from 330 mL to 500 mL.",
        lesson:
          "A plausible number is still the wrong approved package value. Printed capacity is a high-value identity attribute and must not be confused with product unit count or excused by overall visual similarity.",
      },
      {
        href: "/examples/shadow-reflection-change-product-image",
        title: "Window shadows and stronger reflections changed",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/shadow-reflection-change/candidate.jpg",
        alt: "The same NOVA FIZZ can under neutral and stronger reflected light",
        observation:
          "The candidate introduces a brighter environment, window shadows, stronger can highlights, and a changed contact shadow. The logo, product wording, 330 mL value, can count, color system, and container remain sufficiently visible and consistent.",
        lesson:
          "Beverage photography frequently uses condensation, specular highlights, ice, and reflected light. A useful QA system must preserve a PASS when those scene effects change without changing the approved product.",
      },
      {
        href: "/examples/partially-hidden-product-logo",
        title: "A sticker covers part of the brand area",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/label-value-change/original.jpg",
        candidate: "/examples/partially-hidden-logo/candidate.jpg",
        alt: "A NOVA FIZZ can compared with a candidate whose brand text is partly covered",
        observation:
          "The can, star symbol, lower product wording, 330 mL value, colors, and unit count remain visible, but a white sticker covers enough of NOVA FIZZ to prevent complete brand-text comparison.",
        lesson:
          "Occlusion is not evidence that the hidden wording changed. REVIEW directs the user to provide an unobstructed candidate instead of producing a false logo FAIL or an unsupported PASS.",
      },
    ],
    failureModes: [
      {
        title: "Capacity value regeneration",
        detail:
          "AI editing can preserve a full can design while replacing a small number and unit with another realistic value near the base or nutrition panel.",
        businessRisk:
          "A listing can advertise the wrong package size while appearing visually polished and consistent with the approved brand system.",
      },
      {
        title: "Flavor or formula substitution",
        detail:
          "Flavor names and visible claims may be rewritten, removed, or blended with another variant because adjacent packages use nearly identical master artwork.",
        businessRisk:
          "The final image may imply a different drink, sugar formulation, caffeine profile, or customer-facing SKU than the approved reference.",
      },
      {
        title: "Single-unit and multipack confusion",
        detail:
          "Generation may duplicate a can, convert a loose unit into a grouped offer, or change a printed pack count while preserving each visible label.",
        businessRisk:
          "Customers and retailers can interpret the image as a different quantity or commercial offer even though the individual package design is correct.",
      },
      {
        title: "Container and closure drift",
        detail:
          "Slim cans can become standard cans, bottle shoulders can change, caps can disappear, and tabs or closures can be redrawn into another form.",
        businessRisk:
          "The candidate can represent an outdated or nonexistent packaging format and create inconsistency across product pages and campaigns.",
      },
      {
        title: "Reflection mistaken for variant color",
        detail:
          "Metal, glass, liquid, ice, and condensation create highlights and environmental color spill that may change pixels without altering printed artwork.",
        businessRisk:
          "Over-sensitive color decisions create false alarms, delay creative approvals, and reduce trust in otherwise useful product-fidelity checks.",
      },
    ],
    uniqueInsights: [
      {
        title: "Capacity and product count answer different questions",
        paragraphs: [
          "Printed capacity describes the net contents of each visible container. Product count describes how many primary containers or approved sellable units appear in the image. One can marked 330 mL, two cans each marked 330 mL, and one outer carton marked 6 x 330 mL are three different presentations and should not collapse into one quantity check.",
          "Review systems need separate findings for printed value, visible unit count, and multipack structure. Otherwise a correct 330 mL reading can hide the fact that AI duplicated the product, while a correct one-can count can hide a regenerated 500 mL label value.",
        ],
      },
      {
        title: "Beverage color is inseparable from reflective materials",
        paragraphs: [
          "Aluminum cans, glass bottles, clear liquid, condensation, ice, and glossy labels react strongly to their environment. Window light can introduce long white highlights; a warm table can tint a bottle; droplets can distort a small printed region. Pixel difference alone is therefore a weak beverage-color signal.",
          "A stronger decision uses semantic evidence: stable printed color blocks, readable flavor names, consistent brand artwork, and color changes that occur independently of surrounding highlights. If reflection prevents that judgment, REVIEW is safer than calling a new flavor or silently passing it.",
        ],
      },
      {
        title: "The correct package face matters more than overall recognition",
        paragraphs: [
          "A model may recognize NOVA FIZZ from color and shape even when a sticker covers the brand or a rear view replaces the front panel. Recognition does not prove that the candidate preserves the required flavor, claim, or capacity text on the approved face.",
          "For pre-publish approval, the candidate must expose corresponding evidence. When the reference uses the front label and the candidate only shows a hidden or different face, the correct action is to request another image rather than infer invisible text from the rest of the package.",
        ],
      },
    ],
    inputRequirements: [
      {
        title: "Use the exact approved beverage SKU",
        detail:
          "The reference must match the intended product, flavor, formula, size, container, closure, and packaging revision rather than a related can from the same brand family.",
      },
      {
        title: "Make capacity and variant text readable",
        detail:
          "The candidate needs enough resolution for direct comparison of flavor, product type, claims, and net-content values. Overall can recognition is not sufficient evidence.",
      },
      {
        title: "Show all primary units being approved",
        detail:
          "Frame the complete single product or approved group so Pairvu can distinguish unit count from partial cropping and hidden products.",
      },
      {
        title: "Include the full container and closure",
        detail:
          "Show the top, base, side profile, cap, tab, or carton closure when packaging form is part of the approval decision.",
      },
      {
        title: "Provide corresponding package faces",
        detail:
          "A front-panel reference should be compared with a candidate that exposes the same identity-bearing area. Use another view when props, ice, hands, labels, or reflections cover it.",
      },
    ],
    workflow: [
      {
        title: "Lock the approved commercial unit",
        detail:
          "Record whether the reference represents one can, one bottle, one carton, or an approved multipack, together with its flavor, formula, capacity, and packaging revision.",
      },
      {
        title: "Check printed identity before styling",
        detail:
          "Verify brand, product, flavor, formula claims, and capacity before evaluating whether the new background, droplets, shadows, or reflections are acceptable creative changes.",
      },
      {
        title: "Check count, container, and closure separately",
        detail:
          "Confirm the number of primary units, then compare each container silhouette and visible closure so a duplicated product or packaging change cannot hide inside a general match.",
      },
      {
        title: "Resolve FAIL and REVIEW differently",
        detail:
          "Correct confirmed changed values, flavors, counts, colors, or packaging. For REVIEW, collect an unobstructed, readable, corresponding view instead of editing an attribute that was never proven wrong.",
      },
      {
        title: "Approve the actual final export",
        detail:
          "Run the final image delivered to the listing, retailer, or campaign and retain the reference, verdict, findings, and human feedback with the creative approval record.",
      },
    ],
    limitations: [
      "Pairvu does not verify ingredients, nutrition facts, allergens, formulation, taste, fill level, or the physical liquid inside the package.",
      "The system does not certify alcohol, caffeine, sugar, health, organic, recycling, deposit, or other legal and regulatory claims.",
      "Pairvu does not validate barcodes, batch codes, expiry dates, lot numbers, nutrition panels, or complete rear-label compliance.",
      "A visual PASS does not prove calibrated print color, physical flavor color, transparent-liquid color, or consistency across cameras and displays.",
      "Hidden, tiny, blurred, reflected, cropped, or non-corresponding package faces may require REVIEW even when the overall beverage is recognizable.",
      "The current M0 compares one reference image with one candidate image and does not build a complete multi-angle packaging record.",
    ],
    faq: [
      {
        question: "Why is changing 330 mL to 500 mL a FAIL if the can looks identical?",
        answer:
          "Capacity is customer-facing product information and may identify another package size. Preserving the logo, color, and can design does not make a different printed net-content value acceptable.",
      },
      {
        question: "Is printed capacity the same as the number of cans shown?",
        answer:
          "No. Capacity describes the contents of each package; product count describes how many primary units appear. Pairvu treats printed value, visible unit count, and multipack structure as separate approval questions.",
      },
      {
        question: "Should condensation, window shadows, or metal reflections make a beverage image fail?",
        answer:
          "Not by themselves. Those are presentation effects and should PASS when the brand, product, flavor, claims, capacity, count, container, and semantic color system remain sufficiently observable and faithful.",
      },
      {
        question: "What should happen when a sticker covers part of the beverage logo?",
        answer:
          "The affected brand attribute should go to REVIEW because hidden text cannot be confirmed as matching or changed. Supply an unobstructed candidate rather than accepting an unsupported PASS or false mismatch.",
      },
      {
        question: "Does Pairvu validate nutrition facts or beverage compliance?",
        answer:
          "No. Pairvu checks visible fidelity against the supplied approved image. Nutrition, ingredients, formulation, alcohol or caffeine rules, deposits, barcodes, legal claims, retailer requirements, and physical products require separate review.",
      },
    ],
  },
];

export function getCategoryPageContent(route: string) {
  return categoryPageContents.find((page) => page.route === route);
}
