import type { Metadata } from "next";
import { CategoryQaPage } from "@/components/CategoryQaPage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/cosmetics-product-image-qa";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function CosmeticsProductImageQaPage() {
  return (
    <CategoryQaPage
      route={route}
      breadcrumbLabel="Cosmetics"
      deck="Compare approved cosmetics packaging with AI-generated or edited candidates before product pages, campaigns, or retailer assets go live. Focus on visible identity, shade and label color, printed values, packaging, and applicators."
      checks={[
        "Brand name, logo symbol, product line, variant, and identity-bearing label text.",
        "Net volume, concentration, shade name, strength, and other visible printed values.",
        "Bottle, jar, tube, cap, pump, dropper, applicator, and other major components.",
        "Semantic packaging colors and label layout, separated from lighting, reflections, and background changes.",
      ]}
      risks={[
        { title: "Logo drift", detail: "A symbol can be redrawn or replaced while the bottle and text remain plausible." },
        { title: "Variant color drift", detail: "A label or shade color can change enough to imply a different product variant." },
        { title: "Printed-value errors", detail: "Volume, concentration, or shade text can change while the rest of the artwork remains stable." },
        { title: "Added or missing accessories", detail: "A dropper, applicator, cap, or pump can appear, disappear, or change form." },
      ]}
      examples={[
        {
          href: "/examples/logo-change-ai-product-image",
          title: "Logo change detected",
          summary: "The crescent logo becomes a sun while the serum bottle and label wording remain stable.",
          original: "/examples/logo-change/original.jpg",
          candidate: "/examples/logo-change/candidate.jpg",
          alt: "Cosmetics serum logo comparison",
        },
        {
          href: "/examples/color-change-ai-product-image",
          title: "Main label color changed",
          summary: "The cream-and-orange label becomes dark green without changing the printed wording.",
          original: "/examples/color-change/original.jpg",
          candidate: "/examples/color-change/candidate.jpg",
          alt: "Cosmetics serum label color comparison",
        },
        {
          href: "/examples/background-change-ai-product-image",
          title: "Background changed, product passed",
          summary: "The serum moves into a lifestyle setting while its visible product identity remains faithful.",
          original: "/examples/background-change/original.jpg",
          candidate: "/examples/background-change/candidate.jpg",
          alt: "Cosmetics product background comparison",
        },
      ]}
      workflow={[
        { title: "Choose the approved pack image", detail: "Use the current, authorized variant with readable front-label details." },
        { title: "Match the candidate view", detail: "Include the packaging face and components that need approval." },
        { title: "Resolve FAIL and REVIEW", detail: "Correct confirmed identity changes and obtain better evidence for hidden or unreadable details." },
        { title: "Publish the approved version", detail: "Retain the final candidate and approval decision in the creative workflow." },
      ]}
      boundary="Pairvu evaluates visible packaging fidelity. It does not validate cosmetic ingredients, claims, safety, shade accuracy under calibrated color conditions, regulatory compliance, or whether the photographed item physically matches the package."
      ctaTitle="Check a cosmetics product image"
      ctaBody="Compare the approved package with the final creative before a logo, label, color, value, or component error reaches customers."
    />
  );
}
