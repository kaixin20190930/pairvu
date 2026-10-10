"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ImageEvidenceLocation, ObservationEvidence, RegionUnavailableReason } from "@/lib/domain/semantics";
import { normalizeBoundEvidence, unavailableRegion } from "@/lib/qa/evidence-regions";

type Preview = {assetId:string;previewUrl:string} | null;
const reasonLabels:Record<RegionUnavailableReason,string>={
  not_recorded:"Region not recorded for this result.",
  not_visible:"Relevant evidence is not visible.",
  insufficient_evidence:"Visible evidence is insufficient to locate this region.",
  not_present:"The feature is not present; no location was invented.",
  cannot_locate:"The evidence could not be located reliably.",
  uncertain_location:"Location is too uncertain to draw a box.",
  invalid_region:"Region data is invalid; no box is shown.",
};
export function StructuredEvidence({evidence,referenceAssetId,candidateAssetId,reference,candidate}:{evidence:ObservationEvidence;referenceAssetId:string;candidateAssetId:string;reference:Preview;candidate:Preview}) {
  const normalized=normalizeBoundEvidence(evidence,{referenceAssetId,candidateAssetId},{reference:evidence.referenceVisible,candidate:evidence.candidateVisible});
  return <div className="structured-evidence-grid">
    <EvidenceImage label="Reference · visible expected" location={normalized.regions?.reference??unavailableRegion(referenceAssetId,"not_recorded")} preview={reference}/>
    <EvidenceImage label="Candidate · observed" location={normalized.regions?.candidate??unavailableRegion(candidateAssetId,"not_recorded")} preview={candidate}/>
  </div>;
}
function EvidenceImage({label,location,preview}:{label:string;location:ImageEvidenceLocation;preview:Preview}) {
  const [zoom,setZoom]=useState(100),[failedUrl,setFailedUrl]=useState<string|null>(null);
  const imageAvailable=!!preview?.previewUrl&&preview.assetId===location.assetId&&preview.previewUrl!==failedUrl;
  const box=location.region;
  return <figure className="structured-evidence-figure" aria-label={label}>
    <figcaption><strong>{label}</strong></figcaption>
    {imageAvailable?<>
      <div className="structured-evidence-viewport"><div className="structured-evidence-image" style={{width:`${zoom}%`}}>
        <img src={preview.previewUrl} alt={`${label} image`} onError={()=>setFailedUrl(preview.previewUrl)}/>
        {box?<span aria-label={`${label} ${location.confidence==="medium"?"approximate":"model estimated"} region`} className={`structured-evidence-box ${location.confidence==="medium"?"approximate":""}`} style={{left:`${box.x*100}%`,top:`${box.y*100}%`,width:`${box.width*100}%`,height:`${box.height*100}%`}}/>:null}
      </div></div>
      <label className="structured-evidence-zoom">Image zoom <input aria-label={`${label} image zoom`} type="range" min={100} max={200} step={25} value={zoom} onChange={event=>setZoom(Number(event.target.value))}/><span>{zoom}%</span></label>
    </>:<p className="muted">Image preview unavailable. Recorded evidence remains readable.</p>}
    {box?<p className="structured-evidence-note">{location.confidence==="medium"?"Approximate region · medium location confidence.":"Model estimated region · high location confidence."} Location confidence is model reported, not a calibrated probability.{!imageAvailable?" The recorded region cannot be shown without its image.":""}</p>:<p className="structured-evidence-note">{reasonLabels[location.reason??"invalid_region"]}</p>}
  </figure>;
}
