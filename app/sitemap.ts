import type { MetadataRoute } from "next";
import { absoluteUrl, seoPages } from "@/lib/seo/content-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  return seoPages
    .filter((page) => page.status === "published" && page.indexable)
    .map((page) => ({
      url: absoluteUrl(page.route),
      lastModified: new Date(page.updatedAt),
      changeFrequency: page.changeFrequency,
      priority: page.sitemapPriority,
    }));
}
