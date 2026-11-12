import type { MetadataRoute } from "next";
import { comparisons, publishedModelSlugs } from "@/lib/models/catalog";
const base="https://pairvu.com"; const fixed=["/","/compare","/compare/chatgpt-vs-claude-vs-gemini","/llm-pricing","/best/chinese-models","/best/open-source-models","/benchmarks","/benchmarks/cursorbench","/benchmarks/browsecomp","/leaderboard","/privacy","/legacy"];
export default function sitemap():MetadataRoute.Sitemap{const routes=[...fixed,...publishedModelSlugs.map(s=>`/models/${s}`),...comparisons.map(c=>`/compare/${c.slug}`)];return routes.map(route=>({url:`${base}${route}`,lastModified:new Date("2026-11-12"),changeFrequency:route==="/"?"weekly":"monthly",priority:route==="/"?1:0.7}));}
