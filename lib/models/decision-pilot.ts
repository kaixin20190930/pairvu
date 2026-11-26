export const decisionProfiles: Record<string, { fit: string; avoid: string; alternatives: string[]; unknown: string }> = {
  "gpt-6-2-astra": {
    fit: "Consider for difficult professional or agent tasks when the documented 1,050,000-token context and supported tools meet your requirements. Validate output quality on your own cases.",
    avoid: "For repetitive extraction, first evaluate Sol at one quarter of the listed base input and output rates. Requests above 272K input tokens trigger additional billing.",
    alternatives: ["gpt-6-2-sol", "gemini-4-carbon"],
    unknown: "No common-setup Astra/Carbon benchmark is established here. Relative quality, latency and real task completion cost remain unverified.",
  },
  "gpt-6-2-sol": {
    fit: "Start evaluation with Sol for repeated extraction and document processing when its $2 input / $10 output base rates and shared 1.05M context fit your budget.",
    avoid: "Shared token limits do not establish equal quality to Astra. Escalate only after measuring failures on representative cases.",
    alternatives: ["gpt-6-2-astra", "gemini-4-argon"],
    unknown: "No independently reproduced Astra/Sol quality or latency comparison is established here. Batch turnaround and task completion costs have not been independently measured here.",
  },
  "gemini-4-argon": {
    fit: "Evaluate Argon for paid Gemini API workflows that need its documented shared 1,048,576-token window. Confirm model access and output settings before migration.",
    avoid: "An equal token price to Carbon does not prove equal capability or lower run cost. Budget using the announced post-introductory schedule for ongoing work.",
    alternatives: ["gemini-4-carbon", "gpt-6-2-sol"],
    unknown: "No shared-setup Argon/Carbon quality or latency comparison is established here. The pricing boundary timezone is not established in the cited snapshot.",
  },
  "gemini-4-carbon": {
    fit: "Evaluate Carbon for developer API tasks where its documented tool and model capabilities match the workload. The historical CursorBench record is evidence for its named setup only.",
    avoid: "A historical coding score does not establish superiority over Astra or Argon. Introductory prices ending November 30 are unsuitable as a permanent budget assumption.",
    alternatives: ["gemini-4-argon", "gpt-6-2-astra"],
    unknown: "A directly comparable Astra/Carbon or Argon/Carbon score is not established here. Current latency, actual access in your account and pricing-boundary timezone need confirmation.",
  },
};

export const decisionPairs: Record<string, { task: string; tradeoff: string; example: string }> = {
  "gpt-6-2-astra-vs-gpt-6-2-sol": {
    task: "Repeated document extraction: evaluate Sol first against your acceptance criteria. Difficult deliverables: evaluate whether Astra reduces errors enough to justify its higher rates.",
    tradeoff: "Both document the same context ceiling. Neither a shared context nor a fourfold price difference measures answer quality. Confirm endpoint-specific Batch support before planning discounted jobs.",
    example: "Illustration using Standard base rates, 100,000 uncached input tokens and 10,000 output tokens: Astra costs $1.20 and Sol $0.30. This excludes tools, retries, taxes and discounts and stays below the 272K long-input threshold.",
  },
  "gpt-6-2-astra-vs-gemini-4-carbon": {
    task: "For native audio, video or PDF inputs, evaluate Carbon. For an existing text/image OpenAI integration requiring up to 128,000 output tokens, evaluate Astra before changing interfaces. Carbon defaults to 65,536 synchronous output tokens, with a separate long-decode workflow.",
    tradeoff: "Carbon's input, thinking and output share one budget. Astra's 272K input billing threshold matters even below its maximum context. Measure total run cost with identical tasks; Carbon's historical coding score has no matched Astra result here.",
    example: "At 100,000 uncached input tokens and 10,000 output tokens, Standard base rates imply Astra $1.20; Carbon $0.30 through November 30 and $0.60 under the announced December 1 schedule. Tool calls, retries, cache, discounts and taxes are excluded; the provider boundary timezone remains unconfirmed.",
  },
  "gemini-4-argon-vs-gemini-4-carbon": {
    task: "Google positions Argon for the majority of software engineering and knowledge work, and Carbon for difficult multi-step coding, debugging and open-ended scientific reasoning. For routine work, start evaluating Argon; for problems needing deeper exploration, evaluate Carbon against the same acceptance criteria.",
    tradeoff: "Google says Carbon uses more tokens for deeper exploration and verification, so an equal per-token rate can still produce a larger bill. Neither the shared window nor the historical Carbon score establishes equal performance or a matched Argon ranking.",
    example: "At 100,000 uncached input tokens plus 10,000 output tokens, either model's published Standard schedule gives $0.30 through November 30 and $0.60 from December 1. This excludes retries, tools, caching, discounts and taxes. The pricing-boundary timezone remains unconfirmed.",
  },
};
