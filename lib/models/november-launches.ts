import type {ModelRecord, Source} from './catalog';

export const novemberChecked = '2026-11-19';
const source = (label: string, url: string): Source => ({label, url, accessed: novemberChecked});
export const novemberSources = {
  neon: source('Google Gemini 4 Neon API documentation', 'https://aistudio.google.com/docs/models/gemini-4-neon'),
  pricing: source('Google Gemini API pricing: Standard mode', 'https://aistudio.google.com/docs/pricing'),
  changes: source('Google: What is new in Gemini 4 Neon', 'https://aistudio.google.com/docs/whats-new-gemini-4-neon'),
  launch: source('Google Gemini 4 Neon announcement, November 18, 2026', 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/'),
  card: source('Google DeepMind Gemini 4 Neon model card', 'https://deepmind.google/models/model-cards/gemini-4-neon/'),
  method: source('Google Gemini 4 Neon evaluation methodology', 'https://deepmind.google/models/evals-methodology/gemini-4-neon'),
  mai: source('Microsoft MAI Code 2 and Code 2 Flash announcement, November 17, 2026', 'https://microsoft.ai/news/introducing-mai-code-2-and-mai-code-2-flash/'),
  maiCard: source('Microsoft MAI Code 2 and Code 2 Flash model card v3', 'https://microsoft.ai/pdf/MAI-Code-2-And-MAI-Code-2-Flash-Model-Card.pdf?v=3'),
  copilot: source('GitHub Copilot models and AI-credit pricing', 'https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing'),
  opus: source('Anthropic Claude Opus 5.5 native API overview and pricing', 'https://platform.claude.com/docs/en/models/opus-5-5/overview'),
};

export const novemberModels: ModelRecord[] = [
  {slug: 'gemini-4-neon', name: 'Gemini 4 Neon', provider: 'Google', releaseDate: '2026-11-18', openWeights: false, contextTokens: 1048576, modelId: 'gemini-4-neon', availabilityStatus: 'Available on the paid Gemini API tier', summary: 'Gemini 4 Neon sits between Hydrogen and Carbon for frequent complex tasks. Its Standard Gemini API token rates are $3 input and $15 output per million; assess quality on your own workflow.', sources: [novemberSources.neon, novemberSources.pricing, novemberSources.changes, novemberSources.launch, novemberSources.card, novemberSources.method], pricing: [{provider: 'Google', region: 'Gemini API paid tier', currency: 'USD', mode: 'Standard Gemini API', accessedAt: novemberChecked, inputPerMillion: 3, outputPerMillion: 15, note: 'Implicit cached input $0.15/M; explicit caching unsupported. Output includes thinking. Tools and other processing modes are billed separately.', source: novemberSources.pricing}], modality: 'Text, image, audio, video and PDF input; text output', accessAndDeployment: 'Gemini API model gemini-4-neon; Google AI Studio with eligible paid plans'},
  {slug: 'mai-code-2-flash', name: 'MAI Code 2 Flash', provider: 'Microsoft', releaseDate: '2026-11-17', openWeights: false, contextTokens: 1050000, parameters: 'Exact total not established by the checked model-card versions', availabilityStatus: 'GA in GitHub Copilot; limited-access preview in Microsoft Foundry', summary: 'Microsoft’s lightweight coding model is billed through GitHub Copilot AI credits at promotional $0.05 input / $0.25 output per million tokens until May 17, 2027. Foundry is a separate limited-access preview.', sources: [novemberSources.mai, novemberSources.maiCard, novemberSources.copilot], pricing: [{provider: 'GitHub Copilot', region: 'Copilot AI-credit billing', currency: 'USD', mode: 'Promotional token-equivalent rates until May 17, 2027', accessedAt: novemberChecked, inputPerMillion: 0.05, outputPerMillion: 0.25, note: 'Cached input $0.005/M. Starting May 17, 2027: $0.10 input / $0.01 cached / $0.50 output per million. Not a Foundry API quote.', source: novemberSources.copilot}], modality: 'Text and image input; text output', accessAndDeployment: 'GitHub Copilot; Microsoft Foundry limited-access preview, not unrestricted API availability'},
];

export const neonComparison = {slug: 'gemini-4-neon-vs-claude-opus-5-5', a: 'gemini-4-neon', b: 'claude-opus-5-5', verdict: 'Neon has 25% lower Standard input, output and cached-read token rates than the native Claude API rates for Opus 5.5. Both support about one million context tokens. Evaluate your workflow and ecosystem requirements; the reported benchmark configurations below do not establish a universal quality or task-cost winner.'} as const;
export const novemberModelSeo = {
  'gemini-4-neon': {title: 'Gemini 4 Neon: $3/$15 Pricing, 1M Context, Limits', description: "Gemini 4 Neon from Google's official docs: $3 per million input tokens, $15 output, 1M context, thinking levels and where it sits in the Gemini 4 family.", h1: 'Gemini 4 Neon: pricing, context and where it sits in the Gemini 4 family'},
  'mai-code-2-flash': {title: 'MAI Code 2 Flash: $0.05/$0.25 Pricing and Limits', description: 'MAI Code 2 Flash costs $0.05 per million input tokens and $0.25 output in Copilot at the promotional rate, rising on 2027-05-17. Availability and Microsoft claims.', h1: 'MAI Code 2 Flash: pricing, availability and the promotional rate'},
};
export const neonComparisonSeo = {title: 'Gemini 4 Neon vs Claude Opus 5.5: Price and Limits', description: 'Gemini 4 Neon costs $3/$15 per million tokens; Claude Opus 5.5 costs $4/$20, with separate optional cache writes. Compare pricing, context and published evidence.', h1: 'Gemini 4 Neon vs Claude Opus 5.5', subtitle: 'Exact models, Standard native API prices, and Google-reported benchmark results with configuration limits.'};

export const neonReportedResults = [
  {name: 'CursorBench 4.1', neon: '65.4%', opus: '58.1%', setting: 'Results attributed by Google to Cursor; exact matched budget and effort are not established in the checked card.'},
  {name: 'Terminal-bench 4.1', neon: '65.2%', opus: '65.8%', setting: 'Cheating-adjusted accuracy; Neon uses Antigravity-CLI 1.5.9, while other models use official leaderboard settings. Harnesses are not independently matched.'},
  {name: 'FrontierCode 2.0', neon: '46.2%', opus: '47.3%', setting: 'Main score; Neon uses high thinking, an exception to Google’s generally highest-thinking evaluation setting. Equal cross-model compute is not established.'},
  {name: 'SWE-sweep · Mini-SWE harness', neon: '12.8%', opus: '3.6%', setting: 'Common named Mini-SWE harness, but exact version and budget are not established in the checked methodology. Separate provider-harness results use different agents and are not mixed here.'},
] as const;
