import type { Metadata } from "next";
import { ComponentCasePage } from "@/components/ComponentCasePage";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/examples/candle-set-component-removed";
export const metadata: Metadata = pageMetadata(getSeoPage(route));

export default function CandleSetComponentRemovedPage() {
  return <ComponentCasePage route={route} eyebrow="Controlled missing-component example" deck="The approved EMBERNOOK set includes a candle jar, fitted lid, and separate wick trimmer. The candidate removes the trimmer and also changes CEDAR CANDLE SET to CEDAR CANDLE." originalAlt="EMBERNOOK candle set with jar, gold lid, and separate wick trimmer" candidateAlt="EMBERNOOK candle without the approved wick trimmer and with changed set wording" candidateImage="/examples/candle-components/missing-trimmer.jpg" candidateDetail="Wick trimmer removed; SET wording removed" changedAttribute="Required accessory and set wording" decision="FAIL" decisionReason="Confirmed text change plus missing accessory" analysis="Pairvu confirmed two independent differences. The readable product name drops the word SET, producing a critical visible-text finding, and the separate wick trimmer is confirmed missing because its approved location is fully represented in both images. Under the current policy, the critical wording change drives FAIL; this case must not be presented as proof that every component-only omission automatically fails." stable={["The EMBERNOOK wordmark and circular flame symbol remain readable and unchanged.", "The dark-green cylindrical jar, fitted brushed-brass lid, 220 g value, and package silhouette remain stable.", "Both images show one primary candle jar, so the finding is not a duplicate-product count alarm."]} nextAction="Restore the approved wick trimmer and exact CEDAR CANDLE SET wording, then rerun the final export against the same approved original." />;
}
