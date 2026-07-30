# Model Strategy

## Provider Abstraction

The core product must not couple to any single AI provider.

Create a `VisionProvider` interface and keep provider-specific output behind schema validation and domain normalization.

Initial provider:

- `OpenAIVisionProvider`

Future providers may include:

- another multimodal model;
- specialized OCR;
- custom detector;
- fine-tuned model;
- self-hosted model.

## Output Flow

Provider output must follow this path:

Vision Provider -> Structured Output -> Schema Validation -> Domain Normalization -> Risk Engine -> Product Verdict

Do not expose raw provider JSON directly to the UI or public API.

## Model Selection

Use the strongest reasonable model for the early baseline, then introduce routing after the evaluation harness exists.

The source master plan mentions future model tiers such as GPT-5.6 Luna/Terra/Sol. Treat those as placeholders until official model availability, price, latency, and quality are confirmed.

Future routing should be configuration-driven:

- deterministic checks first;
- cheaper model for obvious low-risk cases;
- stronger model for uncertain or high-risk cases;
- specialized tools for OCR or category-specific detection when benchmarks justify it.

## Required Telemetry

Every model invocation stores:

- provider;
- model;
- prompt version;
- input usage;
- output usage;
- latency;
- estimated cost;
- purpose;
- asset IDs sent;
- result status;
- error code if any.

Training or specialization should only happen after production data proves a concrete bottleneck in accuracy, latency, unit economics, privacy, or category specialization.
