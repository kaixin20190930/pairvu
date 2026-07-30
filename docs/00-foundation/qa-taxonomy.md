# QA Taxonomy

Image quality must not be reduced to one generic score. Validation has independent dimensions.

## 1. Technical QA

Deterministic or low-cost checks:

- dimensions;
- resolution;
- aspect ratio;
- file type;
- file size;
- transparency;
- image corruption;
- blur;
- exposure;
- crop;
- background properties.

Use deterministic code where possible. Do not spend multimodal model budget on checks that can be measured reliably.

## 2. Product Fidelity

Core differentiator: compare a candidate image against trusted reference images or a Product Identity Profile.

M0 checks:

- logo consistency;
- visible text consistency;
- product quantity;
- dominant product color;
- major components;
- major shape / packaging identity.

Later checks:

- material;
- texture;
- patterns;
- proportions;
- ports;
- buttons;
- variants;
- hardware;
- garment details;
- accessories;
- dimensions.

## 3. Cross-Image Consistency

Compare images in a listing, campaign, or batch:

- inconsistent button count;
- altered color between views;
- changed logo;
- duplicate or missing view;
- conflicting packaging.

This is not part of M0.

## 4. Marketplace Compliance

Marketplace-specific rule packs such as Amazon, Walmart, eBay, Etsy, TikTok Shop, and Google Merchant Center.

Rules must live in versioned `RuleSet` records, not in UI components or hard-coded application branches.

## 5. Catalog / Set Readiness

Evaluate the whole image set:

- required image types;
- product consistency;
- information coverage;
- technical quality;
- marketplace compliance;
- duplicate assets;
- missing views.

This is not part of MVP.
