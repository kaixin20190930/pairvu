import type { Metadata } from "next";
import { ComponentCasePage } from "@/components/ComponentCasePage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/examples/candle-set-scene-change";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function CandleSetSceneChangePage() {
  return <ComponentCasePage route={route} eyebrow="Controlled hard-negative example" deck="The candle jar and wick trimmer move into a textured stone setting with a different composition. Every approved product and accessory remains present and readable." originalAlt="EMBERNOOK candle set on a neutral studio background" candidateAlt="Same EMBERNOOK candle set and wick trimmer in a textured stone setting" candidateImage="/examples/candle-components/scene-change.jpg" candidateDetail="Scene and composition changed; set preserved" changedAttribute="Environment and recomposition only" decision="PASS" decisionReason="Every required component remained observable" analysis="Pairvu verified the same candle container, lid, and wick trimmer together with matching logo, wording, 220 g value, main colors, and package form. The candidate also changes object scale and spacing slightly, so this is described as a harmless scene recomposition rather than a pixel-level background-only edit. Those presentation changes do not alter what the approved set contains." stable={["One complete candle jar, one fitted lid, and one complete wick trimmer remain visible.", "EMBERNOOK, CEDAR CANDLE SET, and 220 g remain readable on the corresponding front label.", "The forest-green jar, brass component family, circular flame mark, and container construction remain consistent."]} nextAction="Accept the component check and continue with channel-specific composition review if the new stone setting was part of the creative brief." />;
}
