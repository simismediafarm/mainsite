import { Job } from "bullmq";
import { routeJob } from "./job.router";
import { TraceContext } from "../shared/trace.context";

export async function processEvent(job: Job) {
  const { eventType, payload, traceId } = job.data;
  const context = new TraceContext(traceId || job.id);
  
  console.log(`[PROCESS_EVENT] Routing ${eventType}...`);
  return await routeJob(eventType, payload, context);
}
