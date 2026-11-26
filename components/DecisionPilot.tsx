import Link from "next/link";
import { modelMap } from "@/lib/models/catalog";
import { decisionPairs, decisionProfiles } from "@/lib/models/decision-pilot";

function Evidence({ slugs }: { slugs: string[] }) {
  return <section>
    <h3>Evidence for the facts used above</h3>
    {slugs.map(slug => {
      const model = modelMap.get(slug)!;
      const spec = model.sources[0];
      return <div key={slug}>
        <p>{model.name} context, interfaces and availability — <a href={spec.url} data-source-role="specification">{spec.label}</a> · checked {spec.accessed}.</p>
        {model.pricing.map((price, index) => <p key={index}>{model.name} prices and billing conditions — <a href={price.source.url} data-source-role="pricing">{price.source.label}</a> · checked {price.accessedAt} · {price.region}, {price.mode}.</p>)}
      </div>;
    })}
    {slugs.includes("gemini-4-carbon") && <p>Carbon coding evidence — <Link href="/benchmarks/cursorbench">retained CursorBench 4.0 High record, collected November 16, 2026</Link>. This is a historical setup-specific result.</p>}
    <p>Task recommendations are Pairvu editorial interpretations of these dated facts. They are not independently measured quality or speed results.</p>
  </section>;
}
export function ModelDecision({ slug }: { slug: string }) {
  const decision = decisionProfiles[slug];
  if (!decision) return null;
  return <section><h2>Task fit and alternatives</h2><p>{decision.fit}</p><h3>When to reconsider</h3><p>{decision.avoid}</p><h3>Closest alternatives</h3><ul>{decision.alternatives.map(other => <li key={other}><Link href={`/models/${other}`}>{modelMap.get(other)!.name}</Link> — {decisionProfiles[other].fit}</li>)}</ul><h3>Evidence still missing</h3><p>{decision.unknown}</p><Evidence slugs={[slug, ...decision.alternatives]}/></section>;
}
export function PairDecision({ slug, a, b }: { slug: string; a: string; b: string }) {
  const decision = decisionPairs[slug];
  if (!decision) return null;
  return <section><h2>Choose for your workload</h2><p>{decision.task}</p><h3>Tradeoffs and limits</h3><p>{decision.tradeoff}</p><h3>A defined cost example</h3><p>{decision.example}</p><Evidence slugs={[a,b]}/></section>;
}
