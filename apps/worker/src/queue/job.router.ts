import { EntityOrchestrator } from "../os/entity/EntityOrchestrator";
import { AttentionOrchestrator } from "../os/attention/AttentionOrchestrator";
import { RecommendationOrchestrator } from "../os/recommendation/RecommendationOrchestrator";
import { DemandOrchestrator } from "../os/demand/DemandOrchestrator";
import { TraceContext } from "../shared/trace.context";

const entityOrchestrator = new EntityOrchestrator();
const attentionOrchestrator = new AttentionOrchestrator();
const recommendationOrchestrator = new RecommendationOrchestrator();
const demandOrchestrator = new DemandOrchestrator();

export async function routeJob(eventType: string, payload: any, context: TraceContext, signal?: AbortSignal) {
  switch (eventType) {
    case "entity_extraction":
      return await entityOrchestrator.execute(payload, context, signal);
    case "attention_processing":
      return await attentionOrchestrator.execute(payload, context, signal);
    case "recommendation_generation":
      return await recommendationOrchestrator.execute(payload, context, signal);
    case "trend_detection":
      return await demandOrchestrator.execute(payload, context, signal);
    default:
      throw new Error(`NO_ROUTE_FOR_EVENT: ${eventType}`);
  }
}
