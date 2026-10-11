import type {ProductSnapshot} from "@/lib/products/types";
export type Eligibility = "eligible" | "needs_review" | "blocked";
export type ReleaseStateFilter = "all" | "pending_review" | "blocked" | "decided";
export interface ReleaseFilters {sku:string;productId:string;batchId:string;state:ReleaseStateFilter;limit:number;cursor:string;}
export interface ReleaseRow {
  analysisId:string;createdAt:string;batchId:string|null;productSnapshot:ProductSnapshot|null;productSnapshotJson:string|null;productSnapshotHash:string|null;
  machine:{status:string;verdict:string|null;qaEngineVersion:string|null;riskPolicyVersion:string|null;modelPolicyVersion:string|null;completedAt:string|null;issueCount:number;limitations:Array<{type:string;message:string}>;sourceHash:string|null;sourceComplete:boolean;sourceSnapshotJson:string};
  assets:{referenceAvailable:boolean;candidateAvailable:boolean};
  human:{action:string|null;category:string|null;reason:string|null;revision:number;createdAt:string|null;machineHash:string|null};
  eligibility:Eligibility;reasons:Array<{code:string;message:string}>;evaluatedAt:string;policyVersion:string;policyHash:string;
}
export interface ReleasePage {
  rows:ReleaseRow[];policy:{version:string;hash:string;description:string};evaluatedAt:string;
  pagination:{limit:number;scanLimit:number;scanned:number;scanWindowExhausted:boolean;hasMore:boolean;nextCursor:string|null;order:string};
}
export class ReleaseError extends Error {
  constructor(public code:string,message:string,public status=400){super(message);this.name="ReleaseError";}
}
