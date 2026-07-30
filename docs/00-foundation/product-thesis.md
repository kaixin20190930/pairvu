# Product Thesis

## Category

VisualQA is a Commerce Visual QA / Product Visual Assurance product.

It is an independent quality gate between product-image creation and publication. The product does not generate images. It verifies whether candidate product visuals are accurate, compliant enough to review, and ready to publish.

## Core Thesis

AI generation and automated editing make product-image creation cheaper and faster. The bottleneck moves from image production to image trust:

Can this visual ship?

The product answers that question with one of three verdicts:

- `PASS`: no meaningful issue was detected within the selected checks.
- `REVIEW`: the system found uncertainty, non-observability, or a possible issue that needs human judgment.
- `FAIL`: a high-risk or confirmed issue should block publication until fixed.

`REVIEW` is a first-class outcome. It protects trust and prevents false certainty.

## Strategic Positioning

The product must stay independent of:

- image-generation model;
- creative platform;
- marketplace;
- product category;
- image source.

An asset may come from GPT Image, Gemini, Midjourney, Flux, Photoroom, a studio, an agency, a supplier, or an internal design team. The validation process should work the same way.

## North Star

Primary metric:

Human Reviews Avoided

Example:

- 100,000 images analyzed
- 78,000 auto-pass
- 17,000 review
- 5,000 fail
- Human Reviews Avoided = 78%

Supporting quality metrics:

- False Pass Rate
- False Fail Rate
- Auto-pass Rate
- Review Rate
- Critical Issue Recall
- Precision by issue type
- Precision by product category
- Cost per analyzed asset
- Median validation latency
- P95 validation latency

False Pass is the primary quality risk. A false fail costs time; a false pass may publish incorrect product information.

Therefore the product must maximize safely automated reviews, not automation rate at any cost. Human Reviews Avoided is only healthy when constrained by False Pass Rate, Critical Issue Recall, and repeatability.

## Commercial Endpoint

The product succeeds when a customer can say:

We used to manually inspect every product visual. Now the system safely clears most of them and sends our team only the exceptions that require judgment.
