import type { Metadata } from "next";
import { ComponentCasePage } from "@/components/ComponentCasePage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/examples/candle-accessory-outside-crop";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function CandleAccessoryOutsideCropPage() {
  return <ComponentCasePage route={route} eyebrow="Controlled component-observability example" deck="The candidate shows the complete candle jar and lid but excludes the approved right-side accessory area. The wick trimmer cannot be confirmed present or missing from this crop." originalAlt="Complete EMBERNOOK candle set with wick trimmer visible on the right" candidateAlt="Tight crop of the EMBERNOOK candle jar with the wick trimmer outside the frame" candidateImage="/examples/candle-components/trimmer-crop.jpg" candidateDetail="Jar visible; accessory area outside frame" changedAttribute="Accessory coverage" decision="REVIEW" decisionReason="The trimmer is not observable" analysis="Pairvu correctly avoided calling the wick trimmer missing. The approved reference proves that it belongs to the set, but the candidate frame supplies no pixels for the area where the trimmer would appear. Logo, label text, product count, color, and the jar silhouette can still be verified. Component approval remains unresolved until a wider candidate shows the complete included set." stable={["The candle jar and fitted circular lid remain fully visible and retain their approved geometry.", "The EMBERNOOK logo, CEDAR CANDLE SET wording, and 220 g value match.", "No visible candidate evidence establishes a replacement or an extra accessory."]} nextAction="Request a wider candidate export that includes the complete product set. Do not remove or recreate an accessory based only on this REVIEW result." />;
}
