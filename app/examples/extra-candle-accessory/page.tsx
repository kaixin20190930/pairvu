import type { Metadata } from "next";
import { ComponentCasePage } from "@/components/ComponentCasePage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/examples/extra-candle-accessory";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function ExtraCandleAccessoryPage() {
  return <ComponentCasePage route={route} eyebrow="Controlled extra-component example" deck="The candidate keeps the approved candle jar, fitted lid, and wick trimmer, then adds a separate brass candle snuffer that plausibly reads as another included accessory." originalAlt="Approved EMBERNOOK candle jar with one wick trimmer" candidateAlt="EMBERNOOK candle set with wick trimmer and an extra brass candle snuffer" candidateImage="/examples/candle-components/extra-snuffer.jpg" candidateDetail="Approved set plus one extra snuffer" changedAttribute="Extra included-looking accessory" decision="REVIEW" decisionReason="The visible set changed, but intent is unknown" analysis="Pairvu identified the candle snuffer as an extra high-impact component while preserving the approved jar, lid, trimmer, logo, text, color, count, and shape findings. REVIEW is the honest action because the image clearly contains another product-related object, but the checker cannot know whether the merchandising brief intentionally expanded the set. The scene is also recomposed, which does not invalidate the clearly observable addition." stable={["The original candle jar, fitted brass lid, and separate wick trimmer remain visible.", "EMBERNOOK, CEDAR CANDLE SET, and 220 g remain readable and unchanged.", "The dark-green jar, brass material family, logo, and cylindrical package remain consistent."]} nextAction="If the snuffer is not part of the approved offer, remove it and rerun the check. If it is intentional, create or select an approved reference that shows the expanded set." />;
}
