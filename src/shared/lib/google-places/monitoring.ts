import { GoogleAuth } from "google-auth-library";
export type ProviderUsage = { service: string; method: string; requests: number };
interface TimeSeries { resource?: {labels?: Record<string,string>}; points?: {value?:{int64Value?:string}}[] }
interface MonitoringPage { timeSeries?: TimeSeries[]; nextPageToken?: string; executionErrors?: unknown[] }
export function sumMonitoringSeries(series: TimeSeries[]) {
  const rows = new Map<string,ProviderUsage>();
  for (const item of series) {
    const service=item.resource?.labels?.service ?? "unknown", method=item.resource?.labels?.method ?? "unknown";
    const key=JSON.stringify([service,method]); const row=rows.get(key) ?? {service,method,requests:0};
    for(const point of item.points ?? []) {
      const count=Number(point.value?.int64Value);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid monitoring count");
      row.requests+=count;
      if(!Number.isSafeInteger(row.requests)) throw new Error("Monitoring count overflow");
    }
    rows.set(key,row);
  }
  return [...rows.values()];
}
/** Observed request counts, NOT SKU billable events or remaining free credits. */
export async function readGoogleMonitoring(projectId:string,start:Date,end:Date) {
  if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$|^\d+$/.test(projectId)) throw new Error("Invalid project ID");
  const auth=new GoogleAuth({scopes:["https://www.googleapis.com/auth/monitoring.read"]});
  const client=await auth.getClient();
  const all:TimeSeries[]=[];
  let pageToken:string|undefined;
  const seen=new Set<string>();
  for(let page=0;page<20;page++) {
    const url=new URL(`https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/timeSeries`);
    url.searchParams.set("filter",`metric.type = "maps.googleapis.com/service/v2/request_count" AND resource.type = "maps.googleapis.com/Api" AND resource.labels.project_id = "${projectId}"`);
    url.searchParams.set("interval.startTime",start.toISOString());url.searchParams.set("interval.endTime",end.toISOString());
    url.searchParams.set("view","FULL");url.searchParams.set("pageSize","100000");
    if(pageToken)url.searchParams.set("pageToken",pageToken);
    const {data}=await client.request<MonitoringPage>({url:url.toString(),timeout:15000,retry:false});
    if(data.executionErrors?.length)throw new Error("Partial monitoring data");
    if(data.timeSeries && !Array.isArray(data.timeSeries))throw new Error("Invalid monitoring response");
    all.push(...(data.timeSeries ?? []));
    pageToken=data.nextPageToken;
    if(!pageToken)return {rows:sumMonitoringSeries(all),startAt:start.toISOString(),endAt:end.toISOString()};
    if(seen.has(pageToken))throw new Error("Repeated page token");seen.add(pageToken);
  }
  throw new Error("Monitoring pagination incomplete");
}
