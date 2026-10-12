export class ValueMetricsError extends Error {
  constructor(public code:string,message:string,public status=400){super(message);}
}
export interface ValueWindow {start:string;end:string;generatedAt:string;}
export interface MetricRatio {numerator:number;denominator:number;value:number|null;}
export interface ValueReport {
  version:"value-metrics-001";complete:true;generatedAt:string;sourceAsOf:string;window:{start:string;end:string};valueEvidence:false;qualityEvidence:false;
  scope:{cohort:number;unwindowable:number;business:number;test:number;unknown:number;unclassified:number;invalidClassification:number;classificationCoverage:MetricRatio};
  usage:{total:number;completed:number;failed:number;pending:number;completedTimeInvalid:number;unknownStatus:number};
  machine:{pass:number;review:number;fail:number;unknown:number;reviewRate:MetricRatio};
  sku:{linked:number;missing:number;coverage:MetricRatio;workflowMissing:number;invocations:number;reuses:number;groups:Array<{productId:string;referenceVersionId:string;skuLabels:Array<string|null>;analyses:number;invocations:number;reuses:number}>};
  reviews:{covered:number;none:number;invalid:number;approve:number;reject:number;revoke:number;coverage:MetricRatio;wait:{count:number;meanMs:number|null;missing:number;noDecision:number;invalidOrNegative:number}};
  detectionCost:{known:number;missing:number;sumUsd:number|null;coverage:MetricRatio};
  workflow:{single:number;batch:number;unknown:number};generationModel:{unknown:number};
  limitations:string[];
}
