import type { Metadata } from "next";
import { CategoryQaPage } from "@/components/CategoryQaPage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/packaged-food-product-image-qa";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function PackagedFoodProductImageQaPage() {
  return (
    <CategoryQaPage
      route={route}
      breadcrumbLabel="Packaged Food"
      deck="Review AI-generated and edited packaged-food images against approved boxes, bags, pouches, jars, or wrappers. Verify visible brand and flavor wording, net weight, package count, color system, components, and packaging form."
      checks={[
        "Brand, product name, flavor, variety, dietary or product-line wording, and other visible identity text.",
        "Net weight, unit count, pack size, and printed values that distinguish packaged-food variants.",
        "Primary product count, package closures, windows, caps, labels, and other major visible components.",
        "Box, pouch, bag, jar, or wrapper silhouette together with stable semantic color blocks and layout.",
      ]}
      risks={[
        { title: "Unreadable label text", detail: "A package can look correct at a glance while brand, flavor, or weight text becomes pixelated." },
        { title: "Product-count changes", detail: "One approved package can become two or more units in the final creative." },
        { title: "Weight or count drift", detail: "A printed value can change without altering the rest of the front panel." },
        { title: "Composition false alarms", detail: "Repositioning, scale, or minor perspective should not become a packaging mismatch." },
      ]}
      examples={[
        {
          href: "/examples/product-count-change-ai-image",
          title: "Product count changed",
          summary: "One GRAINLY box becomes two matching boxes in the candidate.",
          original: "/examples/product-count-change/original.jpg",
          candidate: "/examples/product-count-change/candidate.jpg",
          alt: "Packaged-food product count comparison",
        },
        {
          href: "/examples/product-repositioning-perspective-change",
          title: "Repositioning and perspective passed",
          summary: "The box moves or turns slightly while visible product identity remains stable.",
          original: "/examples/product-count-change/original.jpg",
          candidate: "/examples/reposition-perspective/perspective.jpg",
          alt: "Packaged-food position and perspective comparison",
        },
        {
          href: "/examples/unreadable-product-label-text",
          title: "Unreadable text needs review",
          summary: "The package design remains recognizable, but pixelated identity text cannot be verified.",
          original: "/examples/product-count-change/original.jpg",
          candidate: "/examples/unreadable-text/candidate.jpg",
          alt: "Readable and unreadable packaged-food text comparison",
        },
      ]}
      workflow={[
        { title: "Select the approved package face", detail: "Use the correct flavor, size, count, and packaging format as the reference." },
        { title: "Check readable identity text", detail: "Ensure brand, product name, claims, and net quantity are visible at useful resolution." },
        { title: "Verify count and package form", detail: "Compare the number of primary units, closures, silhouette, and major components." },
        { title: "Allow ordinary recomposition", detail: "Do not fail the same product merely because it moves, scales, or turns slightly in the frame." },
      ]}
      boundary="Pairvu checks visible product-image fidelity. It does not validate ingredients, allergens, nutrition facts, expiry dates, barcode content, legal claims, food safety, print production, or marketplace-specific compliance."
      ctaTitle="Check a packaged-food image"
      ctaBody="Compare the approved package with the final AI creative before a text, weight, count, color, component, or packaging error is published."
    />
  );
}
