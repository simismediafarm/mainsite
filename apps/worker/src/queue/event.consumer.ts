import { Job } from "bullmq";
import { routeJob } from "./job.router";
import { TraceContext } from "../shared/trace.context";

export async function processEvent(job: Job) {
  const { eventType, payload, traceId } = job.data;
  const context = new TraceContext(traceId || job.id);
  
  const ac = new AbortController();
  // If the job is stalled or the worker closes, BullMQ doesn't automatically abort
  // but we can pass the signal down for programmatic cancellation if needed
  
  console.log(`[PROCESS_EVENT] Routing ${eventType}...`);
  return await routeJob(eventType, payload, context, ac.signal);
}
