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
  {
    route: "/categories/packaged-food-product-image-qa",
    founderApprovedAt: "2026-08-03",
    audience:
      "Packaged-food brand managers, ecommerce operators, retail content teams, creative agencies, and production reviewers approving AI-generated or edited boxes, bags, pouches, jars, wrappers, and multipack images before they enter product pages, catalogs, campaigns, or retailer submissions.",
    searchIntentEvidence:
      "The page answers a packaged-food approval problem that generic visual comparison does not: whether the candidate still represents the same sellable pack. Reviewers must distinguish printed net contents from the number of packages shown, confirm flavor and variety wording, preserve package-face identity, and avoid failing harmless repositioning while refusing to approve text that is too pixelated to read.",
    deck:
      "A packaged-food image can preserve its colors and logo while changing one box into two, altering a flavor or net-weight value, losing a closure, or reducing label text below readable resolution. Pairvu compares the approved pack with the candidate and separates a changed sellable offer from harmless composition changes and missing visual evidence.",
    packagingFormats: [
      "Folding cartons and upright product boxes",
      "Flexible bags, pillow packs, and gusseted pouches",
      "Resealable stand-up pouches and zipper bags",
      "Jars, tubs, cans, and bottles used as the primary food pack",
      "Wrapped bars, trays, sleeves, and flow-wrap packages",
      "Multipack cartons, bundled units, and retail-ready pack presentations",
    ],
    identityHierarchy: [
      {
        priority: "1",
        attribute: "Brand and product family",
        reason:
          "The wordmark, symbol, and family name establish the source of the product. Similar colors, grain graphics, or natural-food styling cannot substitute for the approved brand identity.",
      },
      {
        priority: "2",
        attribute: "Food type, flavor, and variety",
        reason:
          "HONEY OAT BITES, chocolate, sea salt, whole grain, spicy, original, and other visible wording can distinguish a different food or variant inside an otherwise shared package system.",
      },
      {
        priority: "3",
        attribute: "Printed net contents and count statement",
        reason:
          "A visible 300 g, 12 oz, 6 count, or 10-pack statement describes what one approved sellable package contains. It is not the same as the number of packages pictured in the scene.",
      },
      {
        priority: "4",
        attribute: "Visible primary package count",
        reason:
          "One approved box becoming two boxes changes the offer represented by the image even if each duplicated front panel is individually accurate.",
      },
      {
        priority: "5",
        attribute: "Package face and artwork hierarchy",
        reason:
          "Brand, product name, flavor, claims, net contents, and color blocks occupy purposeful front-panel positions. Corresponding faces must be compared instead of treating a back or side panel as changed front text.",
      },
      {
        priority: "6",
        attribute: "Container form and closure",
        reason:
          "Carton proportions, pouch gussets, zipper tracks, jar lids, tear notches, caps, windows, sleeves, and wrapper ends are part of the visible approved pack.",
      },
      {
        priority: "7",
        attribute: "Semantic variant color system",
        reason:
          "Stable color blocks often organize flavor and product families. They should remain semantically consistent while allowing ordinary shadow, white balance, print texture, and reflected light.",
      },
      {
        priority: "8",
        attribute: "Readable approval-critical text",
        reason:
          "Recognizing a familiar layout is not enough. Brand, product, variant, and quantity text required for approval must be legible at the supplied resolution or the result must remain REVIEW.",
      },
    ],
    decisionRules: [
      {
        attribute: "Brand and family",
        pass: "The same visible wordmark, symbol, and product-family name remain readable on corresponding package faces.",
        review: "Pixelation, blur, glare, crop, fold, or an incompatible package face prevents a direct identity comparison.",
        fail: "The candidate visibly replaces, removes, redraws, or materially alters the approved brand or family identity.",
      },
      {
        attribute: "Food type or product name",
        pass: "The approved product name and food-type wording remain readable and semantically identical in both images.",
        review: "The product-name region exists but is too small, distorted, covered, turned away, or blurred to verify.",
        fail: "The visible food type or product name changes to another item, line, or meaningfully different wording.",
      },
      {
        attribute: "Flavor, variety, or visible claim",
        pass: "The same flavor, variety, and identity-bearing front-panel statements remain visibly consistent.",
        review: "Required variant wording cannot be read reliably because resolution, perspective, reflection, or package curvature is insufficient.",
        fail: "A visible flavor, variety, dietary descriptor, or identity-bearing claim changes, disappears, or is replaced.",
      },
      {
        attribute: "Net contents or printed count",
        pass: "The candidate preserves the approved readable weight, volume, or count statement for each sellable package.",
        review: "The net-contents area is hidden, below readable resolution, cropped out, or shown on a non-corresponding face.",
        fail: "The printed weight, volume, unit count, pack size, or other approved numeric content visibly changes.",
      },
      {
        attribute: "Visible package quantity",
        pass: "The scene contains the same number of primary sellable packages as the approved reference image.",
        review: "Overlap, crop, props, or partial visibility makes the number of complete primary packages uncertain.",
        fail: "A primary box, bag, jar, pouch, or wrapped unit is visibly duplicated, removed, or added in the candidate.",
      },
      {
        attribute: "Pack configuration",
        pass: "A single unit, bundle, multipack, tray, or retail carton remains the same approved commercial configuration.",
        review: "The outer wrap, grouping, or pack boundary cannot be seen well enough to establish the sellable configuration.",
        fail: "A loose unit becomes a bundle or multipack, or an approved multipack is represented as another configuration.",
      },
      {
        attribute: "Package form and closure",
        pass: "The box, bag, pouch, jar, wrapper, closure, and major structural features remain materially consistent.",
        review: "A crop or viewpoint hides the top, base, side depth, closure, gusset, seal, window, or wrapper ends needed for comparison.",
        fail: "The primary package form or a major visible closure, window, seal, cap, or structural component materially changes.",
      },
      {
        attribute: "Artwork color system",
        pass: "Variant-signaling color blocks and artwork remain semantically stable despite ordinary light, shadow, and print texture.",
        review: "Strong color cast, glare, transparency, or low resolution prevents a confident distinction between scene light and artwork color.",
        fail: "A deliberate package color block, flavor cue, or artwork palette changes independently of the surrounding scene.",
      },
      {
        attribute: "Position, scale, and perspective",
        pass: "The same observable package may move, scale, or turn slightly without changing the sellable item or hiding required evidence.",
        review: "The new angle exposes a different face or removes enough identity detail that the required attributes cannot be verified.",
        fail: "The composition change also duplicates, removes, substitutes, or materially changes a package or visible product attribute.",
      },
    ],
    evidence: [
      {
        href: "/examples/product-count-change-ai-image",
        title: "One approved food box became two packages",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/product-count-change/candidate.jpg",
        alt: "One GRAINLY food box compared with two duplicated boxes",
        observation:
          "The GRAINLY logo, HONEY OAT BITES product name, WHOLE GRAIN wording, 300 g value, cream-orange-green color blocks, and rectangular carton design remain stable on each visible box. The candidate changes the primary package count from one complete sellable box to two.",
        lesson:
          "Printed net weight and scene quantity answer different questions. Two boxes that each say 300 g do not represent the same offer as one 300 g box, so the duplicated package requires correction before publication.",
      },
      {
        href: "/examples/product-repositioning-perspective-change",
        title: "The same carton moved and turned slightly",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/reposition-perspective/perspective.jpg",
        alt: "The same GRAINLY food box shown front-on and at a minor perspective angle",
        observation:
          "The candidate changes position, apparent scale, and minor perspective while retaining one carton, readable GRAINLY and HONEY OAT BITES wording, 300 g value, the same color hierarchy, and the same rectangular packaging structure.",
        lesson:
          "Marketplace and campaign compositions routinely move or rotate a package. A useful QA system should normalize harmless framing differences and PASS the image when all approval-critical attributes remain observable and faithful.",
      },
      {
        href: "/examples/unreadable-product-label-text",
        title: "Recognizable packaging had unreadable identity text",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/product-count-change/original.jpg",
        candidate: "/examples/unreadable-text/candidate.jpg",
        alt: "A readable GRAINLY carton compared with a pixelated food package label",
        observation:
          "The candidate preserves the apparent carton, orange center panel, cream top, and dark-green base, but the brand, product name, WHOLE GRAIN statement, and 300 g value are pixelated or too soft for reliable direct comparison.",
        lesson:
          "Layout recognition cannot authorize text fidelity. REVIEW identifies a concrete remedy: provide a higher-resolution candidate in which the front-panel identity and quantity values can actually be read.",
      },
    ],
    failureModes: [
      {
        title: "Scene count confused with net contents",
        detail:
          "Generation may duplicate an accurate box or bag while preserving the printed weight on every copy. A generic quantity check can overlook the difference between package count and contents per package.",
        businessRisk:
          "The creative can imply a two-pack, bundle, or larger offer that the listing price and delivered product do not include.",
      },
      {
        title: "Sibling flavor or variety crossover",
        detail:
          "Food lines often share logos, carton geometry, and most artwork while changing one flavor name, variety descriptor, color band, or dietary cue.",
        businessRisk:
          "A visually credible image may represent another sellable variant and conflict with title, inventory, customer expectations, or campaign targeting.",
      },
      {
        title: "Plausible but wrong numeric labeling",
        detail:
          "AI can alter 300 g, 12 oz, 6 count, serving-related front text, or pack-size wording without disturbing surrounding typography and layout.",
        businessRisk:
          "An incorrect visible value can misstate the offer and create content inconsistency even when the physical package is otherwise depicted correctly.",
      },
      {
        title: "Readable design replaced by text-like texture",
        detail:
          "At small output sizes, letter-shaped marks can preserve the impression of a label while losing exact brand, flavor, and quantity wording.",
        businessRisk:
          "Teams may approve a thumbnail that looks polished but fails at zoom, on a product detail page, or in retailer content review.",
      },
      {
        title: "Package structure simplified during recomposition",
        detail:
          "Pouch seals, zipper tracks, carton depth, wrapper ends, jar lids, windows, and closure details can disappear when the pack is rotated or placed in a new scene.",
        businessRisk:
          "The final image can imply another pack format, resealability, opening method, or included structure that the approved product does not have.",
      },
    ],
    uniqueInsights: [
      {
        title: "Food quantity has three independent layers",
        paragraphs: [
          "Packaged-food approval must separate net contents per package, the number of primary packages pictured, and the commercial pack configuration. A carton marked 300 g is one quantity fact. Two such cartons in the image are a second fact. A printed 2-pack sleeve or bundled offer is a third. Treating all three as one quantity field creates false passes and unclear findings.",
          "Pairvu should report the layer that changed. A 300 g to 500 g edit is a printed-value problem; one box becoming two is a visible package-count problem; a loose unit becoming a bundled multipack is a configuration problem. Clear naming helps the reviewer understand whether to fix artwork, remove a duplicate, or replace the entire offer image.",
        ],
      },
      {
        title: "The compared package face determines what can be approved",
        paragraphs: [
          "Food packs distribute information across front, back, side, top, and closure regions. Front-panel brand and flavor text cannot be compared directly with ingredients or preparation text on the back. A changed viewpoint may still verify carton shape and count while leaving flavor, net contents, or claims unverified.",
          "The correct result depends on the approval question. A front-versus-front pair with minor perspective can PASS when all required front attributes remain readable. A front-versus-side pair may need REVIEW for identity text without implying that the hidden wording changed. Face correspondence is evidence, not a cosmetic preference.",
        ],
      },
      {
        title: "Recognizable typography is not readable typography",
        paragraphs: [
          "People and models can infer a familiar label from color blocks and word length even when individual letters are no longer resolvable. That inference is useful for locating a package region but unsafe for approving exact product text. A nearly correct brand or weight is still wrong customer-facing information.",
          "For approval-critical wording, the candidate must support direct reading at the supplied resolution. If it does not, REVIEW is the productive answer because it asks for a better export without accusing the package of a confirmed text change. This protects both recall and false-alarm performance.",
        ],
      },
    ],
    inputRequirements: [
      {
        title: "Use the exact approved food variant",
        detail:
          "The reference should correspond to the intended brand, food type, flavor, variety, net contents, package size, and commercial configuration rather than a visually related sibling pack.",
      },
      {
        title: "Show the package face required for approval",
        detail:
          "If brand, flavor, claims, and net contents are front-panel requirements, both images must expose that front panel at a comparable and useful angle.",
      },
      {
        title: "Keep identity text readable",
        detail:
          "Supply enough resolution and focus to read the brand, product name, variant, and numeric values instead of relying on layout or color recognition.",
      },
      {
        title: "Include complete package and unit boundaries",
        detail:
          "The frame should make every primary package countable and show enough top, sides, base, closure, or outer wrap to establish the intended package form.",
      },
      {
        title: "Separate hero product from props and serving suggestions",
        detail:
          "Food pieces, bowls, ingredients, and decorative props should not obscure whether the candidate contains one primary sellable package, several packages, or another included component.",
      },
    ],
    workflow: [
      {
        title: "Lock the sellable offer",
        detail:
          "Record the exact flavor, net contents, primary package count, and pack configuration the final image is meant to represent before comparing visual styling.",
      },
      {
        title: "Read the identity hierarchy",
        detail:
          "Verify brand and product family first, then food type, flavor or variety, visible claims, and printed quantity on corresponding package faces.",
      },
      {
        title: "Count complete primary packages",
        detail:
          "Count boxes, bags, jars, pouches, or wrapped units in the approved image and candidate independently from any count printed on the package.",
      },
      {
        title: "Inspect form, closure, and color cues",
        detail:
          "Check carton depth, pouch seals, lids, windows, wrapper ends, and variant color blocks while allowing ordinary scene light and minor perspective.",
      },
      {
        title: "Route by evidence quality",
        detail:
          "Correct confirmed package, value, variant, or count changes; request a clearer export for unreadable or hidden regions; approve only when required attributes visibly match.",
      },
    ],
    limitations: [
      "Pairvu does not verify ingredients, allergen declarations, nutrition facts, recipes, food composition, freshness, taste, serving accuracy, food safety, or the physical contents inside a package.",
      "The system does not certify legal claims, health claims, organic status, dietary suitability, country-of-origin statements, or regulatory and marketplace compliance.",
      "Pairvu does not validate barcode data, lot codes, expiry or best-before dates, recycling symbols, preparation instructions, or complete back-panel labeling.",
      "A visual PASS does not prove package dimensions, fill weight, seal integrity, print color calibration, substrate, material quality, or manufacturing conformity.",
      "Tiny, pixelated, blurred, reflective, folded, curved-away, cropped, or non-corresponding label regions may require REVIEW even when the overall pack is recognizable.",
      "The current M0 compares one approved reference with one candidate and does not replace a multi-face packaging specification, prepress proof, retailer certification, or legal review.",
    ],
    faq: [
      {
        question: "Why does one food box becoming two fail if both boxes are accurate?",
        answer:
          "The number of visible primary packages is part of the offer represented by the image. Two accurate 300 g boxes can imply a bundle or twice the delivered quantity, so they do not match a one-box reference.",
      },
      {
        question: "Is printed net weight the same as product count?",
        answer:
          "No. Printed net weight describes the contents of each package. Product count describes how many primary packages appear in the scene. Pack configuration describes whether those units form a single, bundle, or multipack offer.",
      },
      {
        question: "Should moving or slightly rotating a food package cause a failure?",
        answer:
          "No, provided the same package remains observable and all approval-critical brand, variant, quantity, count, color, and form attributes can still be verified. Ordinary recomposition is a hard negative, not product drift.",
      },
      {
        question: "What happens when the package looks familiar but label text is pixelated?",
        answer:
          "The affected text checks should be REVIEW. Color and layout can identify where text belongs, but they cannot prove exact brand, flavor, claim, or net-content wording without readable letters and numbers.",
      },
      {
        question: "Does Pairvu validate nutrition, ingredients, allergens, or food claims?",
        answer:
          "No. Pairvu checks visible image fidelity against an approved reference. Nutrition, ingredients, allergens, legal claims, barcodes, expiry dates, food safety, printing, and regulatory compliance require separate source data and specialist review.",
      },
    ],
  },
  {
    route: "/categories/household-packaged-goods-image-qa",
    founderApprovedAt: "2026-08-04",
    audience:
      "Household-product brand owners, ecommerce operators, marketplace teams, packaging reviewers, and creative agencies checking AI-generated or AI-edited images of cleaners, detergents, wipes, refills, and other packaged home-care goods before publication.",
    searchIntentEvidence:
      "This page answers the household-specific approval question: whether a generated image still represents the approved cleaner or home-care product when labels, capacities, liquid colors, dispensing hardware, package faces, or functional components may have changed while the surrounding room and lighting are allowed to vary.",
    deck:
      "Household packaging is a functional system, not just a decorated bottle. Pairvu compares an AI-generated or edited image with an approved reference and checks the visible identity, capacity, liquid and package colors, trigger or closure, included components, and container form without treating every kitchen background or natural shadow as product drift.",
    packagingFormats: [
      "Trigger-spray bottles with visible actuator, nozzle, closure, and dip tube",
      "Pump dispensers for soaps, detergents, and concentrated cleaners",
      "Squeeze bottles with flip caps, angled necks, or dosing closures",
      "Rigid jugs and handled containers for laundry or bulk cleaning products",
      "Stand-up refill pouches, flexible sachets, and concentrated refill packs",
      "Aerosol cans and pressurized household-product containers",
      "Tubs, canisters, cartons, wipe packs, and lidded household consumables",
    ],
    identityHierarchy: [
      {
        priority: "1",
        attribute: "Brand, product family, and intended job",
        reason:
          "The brand name and product wording distinguish kitchen cleaner, bathroom cleaner, glass cleaner, disinfectant, detergent, and other home-care jobs that may share the same container family.",
      },
      {
        priority: "2",
        attribute: "Variant, scent, formula, and visible claims",
        reason:
          "CITRUS, fragrance-free, concentrate, antibacterial, refill, and surface-specific wording can identify a different sellable variant even when the master brand and bottle remain familiar.",
      },
      {
        priority: "3",
        attribute: "Printed capacity, dose, or concentration",
        reason:
          "A visible 750 mL, 500 mL, dilution ratio, or dose statement is customer-facing product information and must match the approved package rather than merely look typographically plausible.",
      },
      {
        priority: "4",
        attribute: "Dispensing and closure system",
        reason:
          "A trigger, pump, cap, spout, nozzle, collar, or dosing cup establishes how the package functions. Missing or substituted hardware can change both usability and the offer represented by the image.",
      },
      {
        priority: "5",
        attribute: "Container, handle, neck, and base geometry",
        reason:
          "Bottle shoulders, grip recesses, handles, neck threads, pouch seams, can profiles, and base shapes distinguish approved packaging from a generic AI reconstruction.",
      },
      {
        priority: "6",
        attribute: "Liquid, container, and label color layers",
        reason:
          "Transparent household packs can expose three separate color facts: the liquid, the plastic container, and the printed label. Scene light should not collapse these into one dominant-color judgment.",
      },
      {
        priority: "7",
        attribute: "Major components and fluid path",
        reason:
          "An internal dip tube, attached trigger, pump head, closure, cap, refill spout, or separate dosing tool may be necessary for the product shown to work as the approved package promises.",
      },
      {
        priority: "8",
        attribute: "Primary package count and refill relationship",
        reason:
          "One ready-to-use bottle, two bottles, a bottle plus refill, or a refill alone are different visible offers even when their brand family and color system correspond.",
      },
    ],
    decisionRules: [
      {
        attribute: "Brand and intended use",
        pass: "The same readable brand, product family, and household-use wording remain visible on corresponding package faces.",
        review: "The required front label is turned away, cropped, blurred, reflected, or too small to verify the exact product job.",
        fail: "The brand, cleaner type, intended surface, or primary product wording is visibly replaced, removed, or changed.",
      },
      {
        attribute: "Variant, scent, and claims",
        pass: "The candidate preserves the approved visible scent, formula, concentration, and identity-bearing claim wording.",
        review: "Small variant or claim text is unreadable or appears on a package face that is not shown in both supplied images.",
        fail: "A visible scent, formula, refill designation, concentration, or surface-specific variant changes to another offer.",
      },
      {
        attribute: "Capacity and dose",
        pass: "Readable net contents, dose, and concentration values match the approved household package exactly.",
        review: "The numeric area is hidden, curved away, washed out by glare, or below the resolution needed for direct reading.",
        fail: "A visible quantity or dose changes, such as an approved 750 mL cleaner becoming 500 mL in the candidate.",
      },
      {
        attribute: "Trigger, pump, cap, or spout",
        pass: "The approved dispensing and closure hardware is present with the same functional type and visible construction.",
        review: "A component may be behind the package, outside the crop, or hidden by viewpoint, so presence cannot be established.",
        fail: "A clearly observable required trigger, pump, cap, spout, or dosing closure is removed or replaced by another system.",
      },
      {
        attribute: "Container and grip geometry",
        pass: "The same bottle, jug, pouch, can, tub, handle, neck, shoulder, and base form remain visibly consistent.",
        review: "The frame or viewpoint hides enough of the side profile, handle, base, or closure interface to prevent comparison.",
        fail: "The approved container materially changes form, for example from trigger bottle to straight bottle or pouch to jug.",
      },
      {
        attribute: "Liquid and package color",
        pass: "Liquid, container, label, and closure color families remain semantically consistent under ordinary room lighting.",
        review: "Tinted glare, translucency, reflections, or mixed illumination makes the underlying liquid or package color uncertain.",
        fail: "A deliberate liquid, label, container, or closure color change visibly indicates different artwork or a different variant.",
      },
      {
        attribute: "Components and product count",
        pass: "The same primary package count and all observable approved major parts are present without unapproved extras.",
        review: "A possible component or additional unit cannot be separated from background objects, occlusion, or incomplete coverage.",
        fail: "A clearly visible package, dosing tool, sprayer, cap, refill, or other major included element is added or removed.",
      },
      {
        attribute: "Background, room, and composition",
        pass: "Only the kitchen, bathroom, laundry setting, shadows, framing, or product position changes while product evidence remains complete.",
        review: "The new scene overlaps package boundaries, hides required text, or introduces reflections that prevent direct verification.",
        fail: "The composition changes the visible offer by adding or removing a product, attachment, refill, or functional accessory.",
      },
    ],
    evidence: [
      {
        href: "/examples/household-cleaner-capacity-change",
        title: "Kitchen cleaner capacity changed from 750 mL to 500 mL",
        role: "product_change",
        decision: "FAIL",
        original: "/examples/household-capacity-change/original.jpg",
        candidate: "/examples/household-capacity-change/candidate.jpg",
        alt: "BRIGHTLEAF household cleaner with a front-label capacity change from 750 mL to 500 mL",
        observation:
          "Pairvu confirmed the readable capacity mismatch and returned FAIL. The BRIGHTLEAF logo, KITCHEN CLEANER and CITRUS wording, light-blue bottle, liquid, trigger, product count, and package form were verified as stable.",
        lesson:
          "Correct the candidate label value before publishing; the result isolates a customer-facing capacity error rather than a generic visual difference.",
      },
      {
        href: "/examples/household-cleaner-background-change",
        title: "Same cleaner moved from studio to kitchen",
        role: "hard_negative",
        decision: "PASS",
        original: "/examples/household-background-change/original.jpg",
        candidate: "/examples/household-background-change/candidate.jpg",
        alt: "The same BRIGHTLEAF cleaner bottle on neutral studio and bright kitchen backgrounds",
        observation:
          "Pairvu returned PASS with no product issue or observability limitation. Logo, text, 750 mL value, count, color, components, and package shape all matched after the environment changed.",
        lesson:
          "Approve the scene variation when product evidence remains faithful; a new room, plant, countertop, and natural shadow are not product mutations.",
      },
      {
        href: "/examples/missing-product-component-ai-image",
        title: "Trigger sprayer is visibly absent",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/missing-component/original.jpg",
        candidate: "/examples/missing-component/candidate.jpg",
        alt: "BRIGHTLEAF cleaner with an approved trigger compared with a candidate open threaded neck",
        observation:
          "Pairvu identified the missing white trigger sprayer while preserving the bottle, front label, liquid color, and one-product count. The current policy routes this high-impact component finding to REVIEW.",
        lesson:
          "Do not publish until a human confirms whether the open-neck candidate is intentional; the component is observable and the visible package system changed.",
      },
      {
        href: "/examples/large-viewpoint-difference-product-image",
        title: "Front and back views do not prove the same label attributes",
        role: "observability",
        decision: "REVIEW",
        original: "/examples/missing-component/original.jpg",
        candidate: "/examples/large-viewpoint/candidate.jpg",
        alt: "Household cleaner front label compared with its back package face",
        observation:
          "The bottle, trigger, quantity of primary products, major colors, and container shape correspond, but the candidate exposes the back while the approved reference exposes the front identity panel.",
        lesson:
          "Request a candidate view that shows the corresponding front label instead of treating unseen brand and front-label wording as changed.",
      },
    ],
    failureModes: [
      {
        title: "A functional dispenser becomes generic packaging",
        detail:
          "AI may preserve a cleaner bottle body while deleting the trigger, shortening the pump, closing an open spout, or inventing a cap that no longer matches the approved dispensing method.",
        businessRisk:
          "Customers see a package that cannot deliver the product as represented, and teams may publish an image of a nonexistent packaging configuration.",
      },
      {
        title: "Capacity, concentration, or dilution information drifts",
        detail:
          "Small numeric text can change while the overall label looks convincing, including net contents, concentrated formulas, dose amounts, or refill yield statements.",
        businessRisk:
          "The visual can misstate how much product is sold or how it should be used, creating offer, support, and compliance exposure.",
      },
      {
        title: "Liquid color is confused with container tint",
        detail:
          "Transparent packs can show colored liquid through tinted plastic under room reflections. A model may treat scene spill, liquid hue, and printed label color as one attribute.",
        businessRisk:
          "A different formula or variant can pass unnoticed, or a faithful product can be rejected because the room cast changes apparent color.",
      },
      {
        title: "Front and back package information is compared as if corresponding",
        detail:
          "The back may show directions, ingredients, warning text, or a barcode while the front carries brand, intended use, variant, and capacity. Both can be authentic without directly matching.",
        businessRisk:
          "Reviewers receive false text failures instead of an honest request for a corresponding view, slowing production and reducing trust.",
      },
      {
        title: "Background props look like included accessories",
        detail:
          "Cloths, brushes, cups, plants, spray mist, or sink hardware placed near the pack can overlap it or appear to be attached, bundled, or supplied with the product.",
        businessRisk:
          "The final creative can imply included items or package functions that are not part of the approved household-product offer.",
      },
      {
        title: "Ready-to-use and refill packages are conflated",
        detail:
          "A branded refill pouch and a trigger bottle may share color and wording while representing different packaging, quantities, closures, and customer usage expectations.",
        businessRisk:
          "A listing can show the wrong delivery format even though the brand family and product purpose appear correct at first glance.",
      },
    ],
    uniqueInsights: [
      {
        title: "The package must form a credible dispensing chain",
        paragraphs: [
          "For a trigger cleaner, the visible system runs from the nozzle and actuator through the closure and internal dip tube into the container. For a pump, it includes the head, collar, and bottle interface. These parts are not independent decorations. Their presence and relationship explain how the packaged product is used.",
          "A household review should therefore inspect the chain rather than asking only whether a bottle exists. A candidate with a clean open neck may preserve the label and silhouette but still represent a materially different product experience. Pairvu reports visible component evidence; a human decides whether an intentional packaging revision has been approved.",
        ],
      },
      {
        title: "Transparent packaging creates three color questions",
        paragraphs: [
          "A translucent cleaner can expose the hue of the liquid, the tint of the bottle resin, and the colors printed on the label. A white trigger adds another stable reference. Kitchen daylight or bathroom tiles may alter the pixels without changing any of those underlying product choices.",
          "Approval should name the affected layer. A blue liquid becoming green is different from a blue label becoming green, and both differ from a warm room reflection on clear plastic. When reflection masks the true layer, REVIEW is more accurate than a confident PASS or a fabricated color mismatch.",
        ],
      },
      {
        title: "Package faces are complementary evidence, not duplicates",
        paragraphs: [
          "Household packs often put brand, use, scent, and capacity on the front while directions, warnings, ingredients, and barcode information live on the back. Rotating the bottle can verify the container and trigger but cannot verify front-label fidelity from memory or inference.",
          "A front-versus-back pair should preserve what is observable and route hidden attributes to REVIEW. Teams can then request the missing face rather than redesigning a valid package or approving a detail that never appeared in the candidate pixels.",
        ],
      },
      {
        title: "Scene context must not redefine what is included",
        paragraphs: [
          "Household product photography naturally uses counters, sinks, plants, tiles, cloths, and brushes. These contextual objects can explain use, but they must remain visibly separate from the package and should not cover the trigger, label, base, or bottle boundary needed for approval.",
          "A clean background substitution is a valuable hard negative: it proves the system can ignore creative context while preserving product fidelity. When a prop touches or overlaps the product, however, the reviewer may need to decide whether it is merely staging or an apparent accessory added to the offer.",
        ],
      },
    ],
    inputRequirements: [
      {
        title: "Use the approved product format and variant",
        detail:
          "Choose a reference for the exact cleaner, detergent, refill, scent, concentration, capacity, closure, and commercial configuration intended for the final image.",
      },
      {
        title: "Show the complete dispensing system",
        detail:
          "Include the trigger, pump, cap, spout, closure interface, neck, and any visible tube or dosing component required for the package approval decision.",
      },
      {
        title: "Keep identity and numeric text readable",
        detail:
          "The brand, intended use, variant, capacity, and other approval-critical wording must have enough pixels, focus, and contrast for direct reading.",
      },
      {
        title: "Expose corresponding package faces",
        detail:
          "Use front-to-front or another intentional face pairing when label fidelity matters; a front and back pair cannot prove the same text attributes.",
      },
      {
        title: "Preserve full product and component boundaries",
        detail:
          "Avoid crops or props that hide the base, shoulders, handle, closure, actuator, or included accessories needed to establish package form and count.",
      },
      {
        title: "Control glare on transparent or glossy packs",
        detail:
          "Retain enough clean surface area to distinguish liquid color, container tint, and label palette rather than letting one reflection dominate every color-bearing region.",
      },
    ],
    workflow: [
      {
        title: "Define the approved household offer",
        detail:
          "Record product job, variant, capacity, package format, dispensing system, included parts, and whether the asset represents a bottle, refill, bundle, or other sellable configuration.",
      },
      {
        title: "Read the identity-bearing label face",
        detail:
          "Compare brand, use wording, scent or formula, claims, and numeric values only on corresponding visible regions with enough resolution for direct inspection.",
      },
      {
        title: "Trace the dispensing and closure system",
        detail:
          "Verify nozzle, trigger or pump, collar, neck, cap, spout, dip tube, and any separate dosing part that is both approved and observable in the pair.",
      },
      {
        title: "Separate product colors from room light",
        detail:
          "Judge liquid, container, label, and closure layers independently while allowing natural highlights, reflections, contact shadows, and a different room setting.",
      },
      {
        title: "Confirm package geometry and visible offer",
        detail:
          "Check complete container form, handle or grip, base, primary product count, refills, and accessories before deciding whether the candidate represents the same item.",
      },
      {
        title: "Route the evidence to the right action",
        detail:
          "Fix confirmed identity, value, component, count, color, or packaging changes; request a better image for hidden details; approve harmless scene differences when required product evidence matches.",
      },
    ],
    limitations: [
      "Pairvu does not verify chemical composition, cleaning performance, disinfecting efficacy, active ingredients, dilution safety, toxicity, fragrance, or suitability for a surface or appliance.",
      "The system does not certify hazard communication, warning statements, child-safety requirements, regulatory claims, marketplace policy, country-specific labeling, or legal compliance.",
      "Pairvu does not inspect physical seal integrity, tamper evidence, trigger mechanics, leakage, pressure, fill level accuracy, material quality, or whether an internal tube functions in the real package.",
      "A visual PASS does not validate barcode data, lot codes, recycling marks, ingredient lists, directions, contact information, manufacturing details, or every small back-label statement.",
      "Strong glare, transparent layers, colored reflections, mist, condensation, blur, small text, crop, occlusion, or non-corresponding package faces may require REVIEW even when the product is recognizable.",
      "Background props and detached objects may be ambiguous when they overlap the package or resemble accessories; the current system does not infer contractual contents beyond visible evidence.",
      "The M0 workflow compares one approved reference with one candidate and does not replace a multi-angle packaging specification, production proof, retailer approval, safety review, or legal sign-off.",
    ],
    faq: [
      {
        question: "Why can a missing trigger return REVIEW instead of FAIL?",
        answer:
          "Pairvu can confirm that the visible package system differs, but the current M0 risk policy routes a high-impact component finding to REVIEW unless a critical identity rule also fails. A reviewer should confirm whether the open-neck package is intentional before publication.",
      },
      {
        question: "Should a kitchen or bathroom background change cause an issue?",
        answer:
          "No. A new room, countertop, tile pattern, plant, contact shadow, or ordinary daylight can PASS when the bottle, label, values, colors, components, product count, and package shape remain observable and faithful.",
      },
      {
        question: "How should Pairvu judge color in a transparent cleaner bottle?",
        answer:
          "Liquid hue, container tint, label palette, and closure color should be considered separately. If reflection or mixed lighting prevents those layers from being distinguished, the affected color check should need review rather than guessing.",
      },
      {
        question: "Can a front image be compared with a back image of the same cleaner?",
        answer:
          "Container, trigger, count, and some colors may still be verified, but front-label brand, product, variant, and capacity cannot be approved from a back view. Those hidden attributes require REVIEW or a corresponding front view.",
      },
      {
        question: "Does Pairvu validate cleaning claims, warnings, or ingredients?",
        answer:
          "No. Pairvu checks visible image fidelity against an approved reference. Product efficacy, chemical safety, claims, warnings, ingredients, legal requirements, and regulatory compliance need separate source data and specialist review.",
      },
      {
        question: "Is a refill pouch interchangeable with a trigger bottle in an image?",
        answer:
          "No. Even within the same brand and formula, a refill and ready-to-use bottle have different packaging, closures, capacities, and customer expectations. The reference must represent the exact offer intended for publication.",
      },
    ],
  },
];

export function getCategoryPageContent(route: string) {
  return categoryPageContents.find((page) => page.route === route);
}
