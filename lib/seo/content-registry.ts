import type { Metadata, MetadataRoute } from "next";

export const SITE_URL = "https://pairvu.com";
export const SITE_NAME = "Pairvu";

export type SeoPageFamily = "product" | "market" | "hub" | "guide" | "case_study" | "use_case" | "legal";
export type SeoPageStatus = "published" | "planned" | "deferred";

export type SeoPage = {
  route: string;
  family: SeoPageFamily;
  status: SeoPageStatus;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: string;
  parentRoute?: string;
  relatedRoutes: string[];
  title: string;
  h1: string;
  description: string;
  indexable: boolean;
  sitemapPriority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  publishedAt?: string;
  updatedAt: string;
  evidenceSource: string;
  evidenceDate: string;
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export const seoPages: readonly SeoPage[] = [
  {
    route: "/",
    family: "product",
    status: "published",
    primaryKeyword: "AI product image checker",
    secondaryKeywords: ["product image checker", "compare original and AI product image", "product visual QA"],
    intent: "Use a tool to compare an approved product image with an AI-generated or edited candidate.",
    relatedRoutes: ["/ai-product-photography", "/examples", "/guides", "/use-cases"],
    title: "Pairvu - AI Product Image Checker",
    h1: "Did AI change your product?",
    description:
      "Compare an AI-generated or edited product image with the original. Check visible changes to logos, label text, color, quantity, components, and packaging before publishing.",
    indexable: true,
    sitemapPriority: 1,
    changeFrequency: "weekly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Founder positioning decision and live SERP intent review",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/ai-product-photography",
    family: "market",
    status: "published",
    primaryKeyword: "AI product photography",
    secondaryKeywords: ["AI product photos", "AI product photography quality control"],
    intent: "Understand AI product photography and how to keep generated or edited images accurate.",
    parentRoute: "/",
    relatedRoutes: ["/", "/examples", "/guides/ai-product-photography-checklist", "/use-cases"],
    title: "AI Product Photography: Keep Product Images Accurate",
    h1: "AI Product Photography Without Changing the Product",
    description:
      "Learn how AI product photography works, where product details can drift, and how to compare AI product photos with an approved original before publishing.",
    indexable: true,
    sitemapPriority: 0.9,
    changeFrequency: "monthly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Live SERP review: market intent is dominated by generators and educational guides",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/examples",
    family: "hub",
    status: "published",
    primaryKeyword: "AI product image changes",
    secondaryKeywords: ["AI changed product logo", "wrong text in AI product image", "product image comparison"],
    intent: "See the kinds of visible product changes that require pre-publish review.",
    parentRoute: "/",
    relatedRoutes: [
      "/",
      "/ai-product-photography",
      "/examples/logo-change-ai-product-image",
      "/examples/label-value-change-ai-product-image",
      "/examples/packaging-shape-change-ai-product-image",
      "/guides/ai-product-photography-checklist",
    ],
    title: "AI Product Image Comparison Examples",
    h1: "Product Changes to Check in AI Images",
    description:
      "Explore the logo, label text, color, quantity, component, and packaging changes that can appear in AI-generated or edited product images.",
    indexable: true,
    sitemapPriority: 0.8,
    changeFrequency: "monthly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Pairvu M0 real-image behavior matrix",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/examples/logo-change-ai-product-image",
    family: "case_study",
    status: "published",
    primaryKeyword: "AI changed product logo",
    secondaryKeywords: ["AI product logo change", "compare product logo in AI image"],
    intent: "See a controlled comparison where an AI-edited product image changes a visible logo.",
    parentRoute: "/examples",
    relatedRoutes: [
      "/",
      "/examples",
      "/examples/label-value-change-ai-product-image",
      "/guides/ai-product-photography-checklist",
    ],
    title: "AI Product Logo Change: Original vs Candidate",
    h1: "Logo Change in an AI Product Image",
    description:
      "See an original-versus-candidate cosmetics example where the visible logo changes from a crescent moon to a sun while the product text and packaging remain stable.",
    indexable: true,
    sitemapPriority: 0.75,
    changeFrequency: "yearly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Founder-approved Pairvu controlled real-image fixture T02",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/examples/label-value-change-ai-product-image",
    family: "case_study",
    status: "published",
    primaryKeyword: "AI changed product label value",
    secondaryKeywords: ["wrong quantity in AI product image", "AI product label text change"],
    intent: "See a controlled comparison where a visible printed product value changes.",
    parentRoute: "/examples",
    relatedRoutes: [
      "/",
      "/examples",
      "/examples/logo-change-ai-product-image",
      "/guides/ai-product-photography-checklist",
    ],
    title: "AI Product Label Value Change: 330 mL vs 500 mL",
    h1: "Printed Product Value Changed from 330 mL to 500 mL",
    description:
      "Compare two beverage images where the product, logo, and design remain stable but the visible capacity changes from 330 mL to 500 mL.",
    indexable: true,
    sitemapPriority: 0.8,
    changeFrequency: "yearly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Founder-approved Pairvu controlled real-image fixture T01",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/examples/packaging-shape-change-ai-product-image",
    family: "case_study",
    status: "published",
    primaryKeyword: "AI changed product packaging shape",
    secondaryKeywords: ["AI product bottle shape change", "compare product packaging in AI image"],
    intent: "See a controlled comparison where an AI-edited product image changes packaging shape.",
    parentRoute: "/examples",
    relatedRoutes: [
      "/",
      "/examples",
      "/examples/logo-change-ai-product-image",
      "/guides/ai-product-photography-checklist",
    ],
    title: "AI Product Packaging Shape Change Example",
    h1: "Packaging Shape Changed from Round to Rectangular",
    description:
      "See an original-versus-candidate shampoo comparison where the bottle changes from a rounded cylinder to a rectangular container while label content remains stable.",
    indexable: true,
    sitemapPriority: 0.75,
    changeFrequency: "yearly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Founder-approved Pairvu controlled real-image fixture T03",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/guides",
    family: "hub",
    status: "published",
    primaryKeyword: "AI product photography guides",
    secondaryKeywords: ["AI product image workflow", "product photo quality control"],
    intent: "Build a repeatable process for reviewing AI product images.",
    parentRoute: "/",
    relatedRoutes: ["/", "/ai-product-photography", "/guides/ai-product-photography-checklist"],
    title: "AI Product Photography Guides",
    h1: "Guides for Accurate AI Product Images",
    description:
      "Practical workflows for comparing original and AI product images, reviewing visible fidelity, and deciding when a product photo needs human review.",
    indexable: true,
    sitemapPriority: 0.7,
    changeFrequency: "monthly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Founder-approved pre-publish workflow",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/guides/ai-product-photography-checklist",
    family: "guide",
    status: "published",
    primaryKeyword: "AI product photography checklist",
    secondaryKeywords: ["AI product photo checklist", "check AI product images before publishing"],
    intent: "Follow a checklist before publishing an AI-generated or edited product image.",
    parentRoute: "/guides",
    relatedRoutes: ["/", "/ai-product-photography", "/examples", "/use-cases"],
    title: "AI Product Photography Pre-Publish Checklist",
    h1: "AI Product Photography Pre-Publish Checklist",
    description:
      "Use this practical checklist to review logos, label text, color, product count, components, packaging, and observability before publishing an AI product photo.",
    indexable: true,
    sitemapPriority: 0.8,
    changeFrequency: "monthly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Pairvu M0 check families and real-image test results",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/use-cases",
    family: "hub",
    status: "published",
    primaryKeyword: "AI product image quality control",
    secondaryKeywords: ["ecommerce product image QA", "brand product photo review", "creative agency image QA"],
    intent: "Understand where a reference-based image check fits different publishing workflows.",
    parentRoute: "/",
    relatedRoutes: [
      "/",
      "/ai-product-photography",
      "/examples",
      "/guides/ai-product-photography-checklist",
      "/use-cases/ecommerce-product-image-qa",
      "/use-cases/amazon-product-image-qa",
      "/use-cases/shopify-product-image-qa",
    ],
    title: "AI Product Image Quality Control Use Cases",
    h1: "Where Pairvu Fits Before Publishing",
    description:
      "See how brands, creative teams, agencies, and commerce workflows can compare AI-generated product images with an approved original before publishing.",
    indexable: true,
    sitemapPriority: 0.7,
    changeFrequency: "monthly",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    evidenceSource: "Founder positioning and workflow review",
    evidenceDate: "2026-07-29",
  },
  {
    route: "/use-cases/ecommerce-product-image-qa",
    family: "use_case",
    status: "published",
    primaryKeyword: "ecommerce product image QA",
    secondaryKeywords: ["ecommerce image quality control", "check AI ecommerce product photos"],
    intent: "Add reference-based product fidelity review before ecommerce images are published.",
    parentRoute: "/use-cases",
    relatedRoutes: [
      "/",
      "/use-cases",
      "/examples",
      "/guides/ai-product-photography-checklist",
      "/use-cases/amazon-product-image-qa",
      "/use-cases/shopify-product-image-qa",
    ],
    title: "Ecommerce Product Image QA for AI-Assisted Photos",
    h1: "Ecommerce Product Image QA Before Publishing",
    description:
      "Use an approved product image as the reference, compare the final AI-assisted candidate, and route visible fidelity issues before catalog or campaign publishing.",
    indexable: true,
    sitemapPriority: 0.75,
    changeFrequency: "monthly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Founder-approved Pairvu pre-publish workflow",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/use-cases/amazon-product-image-qa",
    family: "use_case",
    status: "published",
    primaryKeyword: "Amazon product image QA",
    secondaryKeywords: ["check AI Amazon product images", "Amazon seller product image accuracy"],
    intent: "Check product fidelity before applying Amazon's separate image and listing requirements.",
    parentRoute: "/use-cases",
    relatedRoutes: [
      "/",
      "/use-cases",
      "/examples",
      "/guides/ai-product-photography-checklist",
      "/use-cases/ecommerce-product-image-qa",
    ],
    title: "Amazon Product Image QA for AI-Assisted Images",
    h1: "Check Product Fidelity Before an Amazon Listing",
    description:
      "Compare an AI-assisted product image with an approved original before separately checking Amazon image requirements. Pairvu is not affiliated with Amazon.",
    indexable: true,
    sitemapPriority: 0.75,
    changeFrequency: "monthly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Amazon official listing guidance and Pairvu workflow review",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/use-cases/shopify-product-image-qa",
    family: "use_case",
    status: "published",
    primaryKeyword: "Shopify product image QA",
    secondaryKeywords: ["check AI Shopify product images", "Shopify product media quality control"],
    intent: "Review product fidelity before adding final media to a Shopify product.",
    parentRoute: "/use-cases",
    relatedRoutes: [
      "/",
      "/use-cases",
      "/examples",
      "/guides/ai-product-photography-checklist",
      "/use-cases/ecommerce-product-image-qa",
    ],
    title: "Shopify Product Image QA Before Uploading Media",
    h1: "Check AI Product Images Before Adding Them to Shopify",
    description:
      "Compare final AI-assisted product images with approved originals before adding them to Shopify product media and publishing them across store surfaces.",
    indexable: true,
    sitemapPriority: 0.7,
    changeFrequency: "monthly",
    publishedAt: "2026-07-30",
    updatedAt: "2026-07-30",
    evidenceSource: "Shopify official product media documentation and Pairvu workflow review",
    evidenceDate: "2026-07-30",
  },
  {
    route: "/privacy",
    family: "legal",
    status: "published",
    primaryKeyword: "Pairvu privacy",
    secondaryKeywords: [],
    intent: "Understand how Pairvu handles anonymous uploads and analysis data.",
    parentRoute: "/",
    relatedRoutes: ["/"],
    title: "Pairvu Privacy and Image Retention",
    h1: "Privacy",
    description:
      "Learn how Pairvu processes anonymous product images, limits retention to 24 hours, uses OpenAI for requested analysis, and protects session-bound results.",
    indexable: true,
    sitemapPriority: 0.3,
    changeFrequency: "yearly",
    publishedAt: "2026-07-27",
    updatedAt: "2026-07-29",
    evidenceSource: "Pairvu privacy and retention architecture",
    evidenceDate: "2026-07-29",
  },
];

export function getSeoPage(route: string): SeoPage {
  const page = seoPages.find((candidate) => candidate.route === route);
  if (!page) {
    throw new Error(`SEO registry has no page for route: ${route}`);
  }

  return page;
}

export function absoluteUrl(route: string) {
  return new URL(route, SITE_URL).toString();
}

export function pageMetadata(page: SeoPage): Metadata {
  return {
    title: {
      absolute: page.title,
    },
    description: page.description,
    alternates: {
      canonical: page.route,
    },
    openGraph: {
      type: "website",
      url: page.route,
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
    robots: {
      index: page.indexable,
      follow: page.indexable,
    },
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: getSeoPage("/").description,
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    description:
      "Pairvu is an AI product image checker that compares an AI-generated or edited product image against an original reference image.",
  };
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: getSeoPage("/").description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Capped anonymous public beta access",
    },
  };
}

export function articleSchema(page: SeoPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.description,
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
    mainEntityOfPage: absoluteUrl(page.route),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
  };
}
