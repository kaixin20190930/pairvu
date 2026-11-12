import Link from "next/link";
import { formatTokens, models, priceText, publishedModelSlugs } from "@/lib/models/catalog";

export function ModelTable({ subset }: { subset?: string[] }) {
  const allowed = new Set(subset ?? publishedModelSlugs);
  const rows = models.filter((model) => allowed.has(model.slug));
  return <div className="table-wrap"><table className="model-table"><thead><tr><th>Model</th><th>Provider</th><th>Context</th><th>Official price snapshot / 1M</th><th>Weights</th></tr></thead><tbody>{rows.map((model) => <tr key={model.slug}><th><Link href={`/models/${model.slug}`}>{model.name}</Link></th><td>{model.provider}</td><td>{formatTokens(model.contextTokens)}</td><td>{priceText(model.pricing[0])}</td><td>{model.openWeights ? "Open" : "Closed"}</td></tr>)}</tbody></table></div>;
}
