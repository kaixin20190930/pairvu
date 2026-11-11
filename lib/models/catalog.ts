export type Source = { label: string; url: string; accessed: string };
export type ModelRecord = {
  slug: string; name: string; provider: string; releaseDate: string; openWeights: boolean;
  parameters?: string; contextTokens: number; inputUsd?: number; outputUsd?: number;
  summary: string; sources: Source[];
  fieldSources: { releaseDate: number; contextTokens: number; parameters: number | null; inputUsd: number | null; outputUsd: number | null };
};

export const accessed = "2026-11-11";

export const models: ModelRecord[] = [
  {
    slug: "gpt-5-2", name: "GPT-5.2", provider: "OpenAI", releaseDate: "2025-12-11",
    openWeights: false, contextTokens: 400000, inputUsd: 1.75, outputUsd: 14,
    summary: "A proprietary reasoning model for professional and agentic work.",
    sources: [{ label: "OpenAI model documentation", url: "https://developers.openai.com/api/docs/models/gpt-5.2", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 0, parameters: null, inputUsd: 0, outputUsd: 0 },
  },
  {
    slug: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", releaseDate: "2025-11-24",
    openWeights: false, contextTokens: 200000, inputUsd: 5, outputUsd: 25,
    summary: "A proprietary Claude model aimed at coding, agents, and complex professional tasks.",
    sources: [{ label: "Anthropic launch announcement", url: "https://www.anthropic.com/news/claude-opus-4-5", accessed }, { label: "Anthropic model overview", url: "https://docs.anthropic.com/en/docs/about-claude/models/overview", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 1, parameters: null, inputUsd: 0, outputUsd: 0 },
  },
  {
    slug: "gemini-3-1-pro-preview", name: "Gemini 3.1 Pro Preview", provider: "Google", releaseDate: "2026 (preview)",
    openWeights: false, contextTokens: 1000000, inputUsd: 2, outputUsd: 12,
    summary: "A preview multimodal reasoning model; listed prices apply below 200k input tokens.",
    sources: [{ label: "Google Gemini 3 developer guide", url: "https://ai.google.dev/gemini-api/docs/gemini-3", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 0, parameters: null, inputUsd: 0, outputUsd: 0 },
  },
  {
    slug: "qwen3-8b", name: "Qwen3-8B", provider: "Qwen / Alibaba", releaseDate: "2025-04-29",
    openWeights: true, parameters: "8B", contextTokens: 32768,
    summary: "An open-weight hybrid thinking/non-thinking model with strong Chinese and multilingual coverage.",
    sources: [
      { label: "Qwen3 release", url: "https://qwenlm.github.io/blog/qwen3/", accessed },
      { label: "Qwen3-8B model card", url: "https://huggingface.co/Qwen/Qwen3-8B", accessed },
    ],
    fieldSources: { releaseDate: 0, contextTokens: 1, parameters: 1, inputUsd: null, outputUsd: null },
  },
  {
    slug: "glm-5", name: "GLM-5", provider: "Z.ai", releaseDate: "2026-02-12",
    openWeights: true, parameters: "744B total / 40B active", contextTokens: 200000,
    summary: "An MIT-licensed mixture-of-experts model focused on coding and long-horizon agents.",
    sources: [{ label: "Z.ai GLM-5 release", url: "https://z.ai/blog/glm-5", accessed }, { label: "GLM-5 official model card", url: "https://huggingface.co/zai-org/GLM-5", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 1, parameters: 0, inputUsd: null, outputUsd: null },
  },
  {
    slug: "fable-5-2", name: "Claude Fable 5.2", provider: "Anthropic", releaseDate: "2026-11-09",
    openWeights: false, contextTokens: 1000000, inputUsd: 8, outputUsd: 40,
    summary: "Anthropic's model for demanding reasoning and long-horizon agentic work, with always-on adaptive thinking.",
    sources: [{ label: "Anthropic Fable 5.2 model documentation", url: "https://platform.claude.com/docs/en/models/fable-5-2/overview", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 0, parameters: null, inputUsd: 0, outputUsd: 0 },
  },
  {
    slug: "claude-opus-5-5", name: "Claude Opus 5.5", provider: "Anthropic", releaseDate: "2026-09-22",
    openWeights: false, contextTokens: 1000000, inputUsd: 4, outputUsd: 20,
    summary: "Anthropic's general-purpose flagship for agentic coding and knowledge work.",
    sources: [{ label: "Anthropic Fable 5.2 model comparison", url: "https://platform.claude.com/docs/en/models/fable-5-2/overview", accessed }],
    fieldSources: { releaseDate: 0, contextTokens: 0, parameters: null, inputUsd: 0, outputUsd: 0 },
  },
];

export const modelMap = new Map(models.map((model) => [model.slug, model]));
export const publishedModelSlugs = ["qwen3-8b", "fable-5-2", "glm-5"] as const;

export const comparisons = [
  { slug: "claude-vs-gpt", a: "claude-opus-4-5", b: "gpt-5-2", verdict: "Choose GPT-5.2 when API token cost and a larger context window dominate. Choose Claude Opus 4.5 when your own evaluation favors its coding or agent behavior; its published token price is higher." },
  { slug: "gpt-vs-gemini", a: "gpt-5-2", b: "gemini-3-1-pro-preview", verdict: "Gemini offers the larger listed context window, while GPT-5.2 has lower listed input pricing. Gemini is a preview, so production buyers should re-check availability and price tiers." },
  { slug: "claude-vs-gemini", a: "claude-opus-4-5", b: "gemini-3-1-pro-preview", verdict: "Gemini has the larger listed context window and lower standard token prices. Claude Opus 4.5 is the older stable release in this snapshot; evaluate both in your own agent harness before choosing." },
  { slug: "fable-5-2-vs-opus", a: "fable-5-2", b: "claude-opus-5-5", verdict: "Start with Opus 5.5 for general coding and knowledge work: its listed token prices are half of Fable 5.2's. Move to Fable 5.2 only when your evaluation shows that its higher-effort reasoning justifies the added cost and mandatory 30-day data retention." },
] as const;
export const comparisonMap: Map<string, (typeof comparisons)[number]> = new Map(comparisons.map((item) => [item.slug, item]));

export const cursorBench = {
  source: { label: "CursorBench 4.0 official leaderboard", url: "https://cursor.com/cursorbench", accessed },
  rows: [
    { model: "Gemini 4 Carbon High", score: 60.4, cost: 9.22 },
    { model: "Gemini 4 Carbon Medium", score: 60.1, cost: 8.49 },
    { model: "Fable 5.2 Max", score: 60.0, cost: 32.79 },
    { model: "Gemini 4 Carbon Low", score: 58.6, cost: 11.89 },
    { model: "Opus 5.5 Max", score: 57.8, cost: 13.43 },
  ],
};

export const browseComp = {
  source: { label: "OpenAI BrowseComp release and paper", url: "https://openai.com/index/browsecomp/", accessed },
  rows: [
    { model: "Deep research (64 trials)", score: 51.5 },
    { model: "OpenAI o1", score: 9.9 },
    { model: "GPT-4o with browsing", score: 1.9 },
    { model: "GPT-4.5", score: 0.9 },
  ],
};

export function formatTokens(value: number) { return value >= 1000000 ? `${value / 1000000}M` : `${Math.round(value / 1000)}K`; }
export function usd(value?: number) { return value === undefined ? "Not listed" : `$${value.toFixed(value % 1 ? 2 : 0)}`; }
