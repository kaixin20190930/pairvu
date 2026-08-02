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
  {
    route: "/categories/personal-care-product-image-qa",
    founderApprovedAt: "2026-08-03",
    audience:
      "Personal-care brand managers, ecommerce teams, packaging reviewers, creative agencies, and production operators approving AI-generated or edited shampoo, conditioner, cleanser, lotion, deodorant, body-care, and grooming product images before publication or retailer delivery.",
    searchIntentEvidence:
      "The page addresses a distinct packaging-system problem: personal-care products often share label families while differing through bottle geometry, pump or cap design, dispensing mechanism, usage wording, volume, and lower-label coverage. It explains how to separate those changes from warmer light, a tighter composition, or details that are simply outside the frame.",
    deck:
      "Personal-care creatives often keep the brand and label looking right while changing a rounded bottle into a rectangular one, shortening a pump, replacing a cap, hiding the printed volume, or cropping away the lower package. Pairvu checks the complete visible packaging system and distinguishes confirmed product drift from harmless styling and insufficient coverage.",
    packagingFormats: [
      "Pump bottles for shampoo, conditioner, lotion, and wash",
      "Flip-top and screw-cap bottles",
      "Tubes for cleanser, cream, and treatment products",
      "Jars, tubs, and wide-mouth containers",
      "Deodorant, balm, and solid stick formats",
      "Trigger, spray, foam, and specialty dispensing packages",
    ],
    identityHierarchy: [
      {
        priority: "1",
        attribute: "Brand and product line",
        reason:
          "The wordmark, symbol, and line name establish the approved family. Similar botanical graphics or typography do not compensate for a changed brand or line identity.",
      },
      {
        priority: "2",
        attribute: "Product type and use",
        reason:
          "Shampoo, conditioner, body wash, lotion, cleanser, and FOR NORMAL HAIR wording distinguish products that may use almost identical bottles and label systems.",
      },
      {
        priority: "3",
        attribute: "Variant and benefit wording",
        reason:
          "Scent, hair type, skin type, strength, treatment, or benefit language can identify another sellable variant even when the master brand remains unchanged.",
      },
      {
        priority: "4",
        attribute: "Printed volume or weight",
        reason:
          "A visible 500 mL, 250 mL, or net-weight value is customer-facing package information and is commonly located near the lower edge that crops remove.",
      },
      {
        priority: "5",
        attribute: "Primary container body",
        reason:
          "Bottle shoulders, side walls, base, tube proportions, jar depth, and overall silhouette can distinguish a packaging revision or another product format.",
      },
      {
        priority: "6",
        attribute: "Closure and dispensing mechanism",
        reason:
          "Pump head, actuator, collar, dip-tube presentation, flip top, screw cap, spray trigger, and nozzle determine how the package is opened or dispensed.",
      },
      {
        priority: "7",
        attribute: "Label coverage and artwork placement",
        reason:
          "The visible label must cover the corresponding approved regions. A matching upper logo does not prove that lower instructions, volume, or variant text remain faithful.",
      },
      {
        priority: "8",
        attribute: "Semantic container and label color",
        reason:
          "Amber bottle, cream label, green print, and other stable material or artwork colors should remain consistent while allowing normal warmth, highlights, transparency, and reflections.",
      },
    ],
    decisionRules: [
      {
        attribute: "Brand and line",
        pass: "The same visible wordmark, symbol, and product-line identity remain sufficiently clear in both images.",
        review: "A crop, glare, hand, prop, or low resolution blocks direct comparison of the required brand area.",
        fail: "The visible brand, logo, or product-line name is replaced, removed, or materially altered.",
      },
      {
        attribute: "Product type or use",
        pass: "The same product-type and intended-use wording remains readable on corresponding label regions.",
        review: "The candidate hides or cannot resolve the wording needed to distinguish shampoo, conditioner, wash, lotion, or another use.",
        fail: "A visible product type, hair or skin use, or identity-bearing usage statement changes.",
      },
      {
        attribute: "Variant or benefit",
        pass: "The approved scent, treatment, benefit, and hair- or skin-type cues remain visibly consistent.",
        review: "Variant wording is too small, cropped, curved away, reflected, or otherwise not reliable enough to compare.",
        fail: "A visible variant, scent, treatment, or benefit designation changes or disappears.",
      },
      {
        attribute: "Printed volume or weight",
        pass: "The same visible net-content number and unit remain present on the corresponding package area.",
        review: "The lower value area is outside the crop, blurred, hidden, or too small for direct reading.",
        fail: "The candidate visibly changes the approved volume, weight, concentration, or related printed value.",
      },
      {
        attribute: "Container body",
        pass: "The bottle, tube, jar, or stick silhouette remains materially consistent after allowing scale and minor perspective.",
        review: "The base, shoulders, sides, or complete profile is not shown well enough to establish the container form.",
        fail: "The approved rounded, tapered, cylindrical, rectangular, or other primary container body materially changes.",
      },
      {
        attribute: "Pump, cap, or dispenser",
        pass: "The approved closure and dispensing parts remain present with consistent type and visible geometry.",
        review: "The closure is hidden, cropped, viewed from an incompatible angle, or too small to compare reliably.",
        fail: "A pump, cap, actuator, collar, trigger, or nozzle is removed, added, replaced, or materially reshaped.",
      },
      {
        attribute: "Label coverage",
        pass: "All label regions required for the approval decision are visible and correspond between the images.",
        review: "The candidate shows only part of the package and omits lower text, artwork, or silhouette evidence required for PASS.",
        fail: "A visible approved label region, panel, or artwork element is confirmed missing, replaced, or repositioned on the package.",
      },
      {
        attribute: "Product color system",
        pass: "Container material and label color families remain semantically stable despite ordinary lighting differences.",
        review: "Strong color cast, transparency, glare, reflection, or shadow prevents a confident material or artwork comparison.",
        fail: "A deliberate container, label, or variant color changes independently of the surrounding scene illumination.",
      },
      {
        attribute: "Scene and framing",
        pass: "Only light, background, shadow, position, or framing changes while all required package attributes remain observable.",
        review: "The styling or crop prevents complete verification of a label, component, value, or container region.",
        fail: "The composition visibly adds, removes, or changes a product component or package attribute rather than only changing presentation.",
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
        alt: "MIREVA shampoo in rounded and rectangular amber pump bottles",
        observation:
          "The MIREVA name, green leaf mark, DAILY BALANCE SHAMPOO wording, FOR NORMAL HAIR text, 500 mL value, amber material, cream label, and black pump remain stable. The primary bottle body changes from rounded cylindrical walls to a rectangular form with sharper edges.",
        lesson:
          "Stable artwork does not make a new container shape acceptable. The bottle body is an independent package-identity attribute and a confirmed material change requires correction before publishing.",
      },
      {
        href: "/examples/lighting-change-product-image",
        title: "Warmer lighting changed the scene, not the shampoo",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/lighting-change/candidate.jpg",
        alt: "The same MIREVA shampoo bottle under neutral and warmer light",
        observation:
          "The candidate uses a warmer background and warmer illumination. The amber bottle, black pump, cream label, green artwork, product wording, 500 mL value, complete silhouette, and dispensing system remain visible and semantically consistent.",
        lesson:
          "Personal-care lifestyle imagery often changes white balance and environment. The product should still PASS when material colors and identity remain stable under a normal lighting shift.",
      },
      {
        href: "/examples/partially-visible-product-image",
        title: "A tight crop hides the lower package",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/packaging-shape-change/original.jpg",
        candidate: "/examples/partial-product-coverage/candidate.jpg",
        alt: "A full MIREVA shampoo bottle compared with a crop that hides the lower label and base",
        observation:
          "The candidate clearly shows the pump, shoulders, brand, and upper label, but removes the bottle base, 500 mL area, lower label coverage, and enough of the silhouette to prevent complete package verification.",
        lesson:
          "Matching visible details cannot support a whole-product PASS when required regions are absent. REVIEW tells the user exactly what to reshoot or re-export: the full bottle and readable lower label.",
      },
    ],
    failureModes: [
      {
        title: "Label-preserving bottle substitution",
        detail:
          "AI can place an accurate label onto a cleaner but incorrect bottle body, changing shoulders, corners, taper, height, or base while the front artwork looks approved.",
        businessRisk:
          "Customers may see packaging that does not exist, an outdated pack revision, or a container belonging to another product in the same line.",
      },
      {
        title: "Dispensing-system drift",
        detail:
          "Pump spouts may shorten, actuator heads may rotate or change style, collars may simplify, and caps or nozzles may disappear during generation.",
        businessRisk:
          "The image can misrepresent how the product is used and undermine consistency across listings, instructions, and campaign assets.",
      },
      {
        title: "Lower-label information lost to crop",
        detail:
          "Tight compositions favor the brand area but can remove volume, use wording, lower artwork, base geometry, or regulatory-adjacent visible packaging regions.",
        businessRisk:
          "A polished close-up may be approved without evidence that the complete sellable package still matches the reference.",
      },
      {
        title: "Sibling product wording crossover",
        detail:
          "Shampoo, conditioner, body wash, scent, treatment, and hair- or skin-type wording can drift between visually related packages using the same master design.",
        businessRisk:
          "The creative may advertise another product or usage variant even when the brand and bottle family are correct.",
      },
      {
        title: "Warm light mistaken for package recoloring",
        detail:
          "Amber plastic, translucent liquids, cream labels, and glossy pumps react to white balance and reflected surroundings without changing approved materials.",
        businessRisk:
          "False color alarms create unnecessary rework and teach teams to ignore valid warnings about actual variant or artwork changes.",
      },
    ],
    uniqueInsights: [
      {
        title: "A personal-care package is a system, not one silhouette",
        paragraphs: [
          "A pump bottle consists of the primary vessel, shoulders and neck, closure collar, pump mechanism, actuator, spout, label, and visible printed attributes. Two packages can share a general shampoo silhouette while differing in the part that customers operate. Conversely, a pump can match while the bottle body changes underneath it.",
          "Pairvu therefore separates container body, closure, dispensing mechanism, label coverage, and printed identity. A single packaging-match field is too coarse for deciding whether the final image represents the approved sellable pack.",
        ],
      },
      {
        title: "Coverage is part of approval evidence",
        paragraphs: [
          "A close crop is not automatically wrong; it may be the intended campaign composition. But it cannot prove attributes outside the frame. If the approval requires the lower volume, complete label, bottle base, or full silhouette, those regions must appear in the candidate or the result must remain REVIEW.",
          "This distinction prevents two opposite errors: falsely failing a hidden attribute as if it changed, and falsely passing the entire package because the visible upper portion looks correct. REVIEW should identify the exact missing region and request a usable replacement view.",
        ],
      },
      {
        title: "Material color should survive ordinary lighting variation",
        paragraphs: [
          "Personal-care packs often combine translucent amber or colored plastic, liquid, glossy black closures, textured labels, and reflective bathrooms or studio sets. Warmer light can shift all of those pixels together while leaving the semantic material system unchanged.",
          "A confident product-color failure needs evidence from stable label blocks, variant cues, or material regions that change independently of the scene. When the whole environment becomes warmer but amber, cream, black, and green relationships remain intact, PASS is the useful decision.",
        ],
      },
    ],
    inputRequirements: [
      {
        title: "Use the exact approved package revision",
        detail:
          "Select the correct product type, variant, volume, bottle body, pump or cap, and label revision rather than a sibling item from the same personal-care family.",
      },
      {
        title: "Show the complete vessel when packaging matters",
        detail:
          "Include shoulders, side walls, base, neck, and enough profile detail to distinguish shape from scale, crop, and minor perspective.",
      },
      {
        title: "Expose the closure and dispensing mechanism",
        detail:
          "Keep the pump, spout, actuator, collar, trigger, cap, or nozzle visible in both images when it is part of the approved packaging system.",
      },
      {
        title: "Keep identity and volume text readable",
        detail:
          "Brand, product type, use, variant, and printed volume need enough resolution and corresponding label coverage for direct comparison.",
      },
      {
        title: "Use another view for hidden regions",
        detail:
          "If a hand, prop, crop, glare, curvature, or angle blocks a required area, supply a clearer candidate rather than asking the system to infer invisible packaging.",
      },
    ],
    workflow: [
      {
        title: "Define the approved packaging system",
        detail:
          "Record product type, variant, volume, container body, closure, dispensing parts, label regions, and semantic colors before comparing creative outputs.",
      },
      {
        title: "Verify label identity and lower values",
        detail:
          "Read the brand, product, use, variant, and volume on corresponding areas before deciding that a visually familiar package is the correct item.",
      },
      {
        title: "Inspect body and dispenser separately",
        detail:
          "Compare the complete vessel silhouette, then the closure and operating parts so a correct pump cannot hide an incorrect bottle or vice versa.",
      },
      {
        title: "Separate lighting from material change",
        detail:
          "Allow normal environmental warmth, highlight, and shadow while checking whether stable material and artwork colors changed independently of the scene.",
      },
      {
        title: "Correct failures and complete reviews",
        detail:
          "Fix confirmed text, value, body, closure, component, or color changes. Replace cropped or obscured candidates with images that expose the missing approval evidence.",
      },
    ],
    limitations: [
      "Pairvu does not verify ingredients, allergens, formula, fragrance, efficacy, safety, dermatological suitability, or the contents inside the package.",
      "The system does not certify cosmetic, drug, therapeutic, environmental, cruelty-free, or other legal and regulatory claims.",
      "Pairvu does not validate barcodes, batch codes, expiry dates, recycling marks, complete directions, or back-label compliance.",
      "A visual PASS does not prove physical fill level, dispenser function, leak resistance, material quality, or manufacturing conformity.",
      "Hidden, cropped, blurred, curved-away, tiny, reflective, or non-corresponding package regions may require REVIEW.",
      "The current M0 uses one approved reference and one candidate rather than a multi-angle product profile or full packaging specification.",
    ],
    faq: [
      {
        question: "Why should a rounded bottle becoming rectangular be a FAIL when the label matches?",
        answer:
          "The primary container is part of the approved packaging identity. Accurate brand and label artwork cannot authorize a materially different bottle body or packaging revision.",
      },
      {
        question: "Can Pairvu distinguish pump or cap changes from bottle changes?",
        answer:
          "Yes when those parts are visible. The model separates the vessel, closure, and dispensing mechanism so a missing pump, changed spout, replaced cap, or altered bottle body can be described independently.",
      },
      {
        question: "Should warmer bathroom lighting fail a personal-care image?",
        answer:
          "No, not when the product's semantic material and artwork colors remain consistent and identity attributes are readable. Lighting-only change is a presentation difference rather than a new package color.",
      },
      {
        question: "What happens if the candidate crops off the bottle base and volume?",
        answer:
          "The affected volume, lower-label, and full-shape checks should go to REVIEW. The user should provide a complete candidate instead of treating hidden regions as matching or changed.",
      },
      {
        question: "Does Pairvu verify personal-care ingredients or claims?",
        answer:
          "No. It compares visible packaging fidelity with the approved image. Ingredient, efficacy, safety, regulatory, marketplace, barcode, manufacturing, and physical-product checks remain separate responsibilities.",
      },
    ],
  },
];

export function getCategoryPageContent(route: string) {
  return categoryPageContents.find((page) => page.route === route);
}
