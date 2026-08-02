import type { Metadata } from "next";
import { CategoryQaPage } from "@/components/CategoryQaPage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/personal-care-product-image-qa";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function PersonalCareProductImageQaPage() {
  return (
    <CategoryQaPage
      route={route}
      breadcrumbLabel="Personal Care"
      deck="Compare approved shampoo, body-care, and other packaged personal-care images with final AI candidates. Check visible brand identity, usage wording, volume, bottle shape, dispensing components, and complete product coverage."
      checks={[
        "Brand, product type, variant, hair or skin-use wording, and other readable front-label identity text.",
        "Printed volume and other values that distinguish one packaged variant from another.",
        "Bottle, tube, jar, cap, pump, dispenser, and major packaging components.",
        "Full container silhouette and label coverage when shape and lower-panel details require approval.",
      ]}
      risks={[
        { title: "Bottle-shape drift", detail: "A rounded container can become rectangular while the label is preserved." },
        { title: "Pump or cap changes", detail: "Dispensing components can be shortened, removed, replaced, or added." },
        { title: "Incomplete coverage", detail: "A close crop can hide the base, volume, or lower label while visible details still look correct." },
        { title: "Lighting mistaken for color", detail: "Warm or cool illumination can change appearance without changing product identity." },
      ]}
      examples={[
        {
          href: "/examples/packaging-shape-change-ai-product-image",
          title: "Bottle shape changed",
          summary: "The MIREVA bottle changes from rounded to rectangular while label details remain stable.",
          original: "/examples/packaging-shape-change/original.jpg",
          candidate: "/examples/packaging-shape-change/candidate.jpg",
          alt: "Personal-care bottle shape comparison",
        },
        {
          href: "/examples/lighting-change-product-image",
          title: "Warmer lighting passed",
          summary: "The shampoo moves into warmer light while the product remains faithful.",
          original: "/examples/packaging-shape-change/original.jpg",
          candidate: "/examples/lighting-change/candidate.jpg",
          alt: "Personal-care product lighting comparison",
        },
        {
          href: "/examples/partially-visible-product-image",
          title: "Partial product coverage needs review",
          summary: "The close crop preserves the upper bottle but hides lower text and the complete silhouette.",
          original: "/examples/packaging-shape-change/original.jpg",
          candidate: "/examples/partial-product-coverage/candidate.jpg",
          alt: "Full and cropped personal-care bottle comparison",
        },
      ]}
      workflow={[
        { title: "Start from the approved package", detail: "Choose the correct bottle, component set, label, and size variant." },
        { title: "Preserve complete coverage", detail: "Keep the full silhouette and required label regions visible in the candidate." },
        { title: "Separate scene from product", detail: "Allow lighting and background changes while checking semantic product colors and form." },
        { title: "Resolve uncertain areas", detail: "Use another candidate or view when crop, glare, or angle prevents a reliable comparison." },
      ]}
      boundary="Pairvu evaluates visible packaging identity. It does not validate personal-care ingredients, efficacy, safety claims, regulatory labeling, physical fill level, or marketplace-specific listing compliance."
      ctaTitle="Check a personal-care product image"
      ctaBody="Compare the approved package with the final creative before a bottle, pump, label, volume, or coverage issue reaches a listing or campaign."
    />
  );
}
