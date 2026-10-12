import {ValueMetricsError,type ValueWindow} from "./types";
export const VALUE_METRICS_VERSION="value-metrics-001" as const;
export const MAX_COHORT=5000;
export const strictUtc=(v:unknown):v is string=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
export const safeId=(v:unknown):v is string=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
export const valueMetricsEnabled=(env:{VALUE_METRICS_ENABLED?:string})=>env.VALUE_METRICS_ENABLED==="true";
export function parseValueWindow(params:URLSearchParams,now=new Date().toISOString()):ValueWindow {
  const fail=()=>{throw new ValueMetricsError("invalid_window","Use one start and end in UTC, a positive window of at most 90 days, ending no later than now.");};
  for(const k of params.keys())if(!["start","end"].includes(k)||params.getAll(k).length!==1)fail();
  if(params.has("start")!==params.has("end"))fail();
  const end=params.get("end")??now,start=params.get("start")??new Date(Date.parse(now)-30*86400000).toISOString();
  if(!strictUtc(start)||!strictUtc(end)||Date.parse(start)>=Date.parse(end)||Date.parse(end)-Date.parse(start)>90*86400000||Date.parse(end)>Date.parse(now))fail();
  return {start,end,generatedAt:now};
}
