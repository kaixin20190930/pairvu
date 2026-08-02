import type { Metadata } from "next";
import { CategoryQaPage } from "@/components/CategoryQaPage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/beverage-product-image-qa";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function BeverageProductImageQaPage() {
  return (
    <CategoryQaPage
      route={route}
      breadcrumbLabel="Beverages"
      deck="Review AI-generated and edited beverage images against an approved can, bottle, or carton. Verify the visible brand, flavor, capacity, product count, container, and color system without failing normal changes in lighting or composition."
      checks={[
        "Brand name, logo, flavor or variant wording, and identity-bearing front-panel text.",
        "Capacity, pack count, zero-sugar or formulation callouts, and other visible printed values.",
        "Can, bottle, cap, closure, carton, and the number of primary product units shown.",
        "Container and label colors while allowing ordinary highlights, shadows, reflections, and background changes.",
      ]}
      risks={[
        { title: "Wrong capacity", detail: "A candidate can preserve the design while changing 330 mL to another printed value." },
        { title: "Covered brand area", detail: "Props, stickers, crops, or overlays can prevent direct logo and brand verification." },
        { title: "False color alarms", detail: "Metal highlights and environmental reflections can alter pixels without changing the beverage variant." },
        { title: "Pack-count drift", detail: "One approved unit can become a multipack or several loose products in the candidate." },
      ]}
      examples={[
        {
          href: "/examples/label-value-change-ai-product-image",
          title: "Capacity value changed",
          summary: "The same NOVA FIZZ design changes from 330 mL to 500 mL.",
          original: "/examples/label-value-change/original.jpg",
          candidate: "/examples/label-value-change/candidate.jpg",
          alt: "Beverage capacity label comparison",
        },
        {
          href: "/examples/shadow-reflection-change-product-image",
          title: "Shadow and reflection passed",
          summary: "Stronger highlights and window shadows appear without changing the product.",
          original: "/examples/label-value-change/original.jpg",
          candidate: "/examples/shadow-reflection-change/candidate.jpg",
          alt: "Beverage shadow and reflection comparison",
        },
        {
          href: "/examples/partially-hidden-product-logo",
          title: "Covered brand area needs review",
          summary: "A sticker hides part of the brand text, so identity cannot be fully verified.",
          original: "/examples/label-value-change/original.jpg",
          candidate: "/examples/partially-hidden-logo/candidate.jpg",
          alt: "Beverage logo occlusion comparison",
        },
      ]}
      workflow={[
        { title: "Select the approved SKU artwork", detail: "Use the correct flavor, formulation, size, and container as the reference." },
        { title: "Check the final placement", detail: "Compare the actual listing or campaign candidate, not an earlier draft." },
        { title: "Review printed values first", detail: "Treat capacity, pack count, and variant wording as high-value identity checks." },
        { title: "Confirm visible evidence", detail: "Request another view when glare, crops, props, or overlays hide required details." },
      ]}
      boundary="Pairvu checks visible image fidelity. It does not validate beverage formulation, nutrition facts, deposit markings, barcode content, legal claims, marketplace rules, or calibrated print and color reproduction."
      ctaTitle="Check a beverage product image"
      ctaBody="Compare the approved can, bottle, or carton with the final AI creative before publishing the wrong value, variant, or pack presentation."
    />
  );
}
