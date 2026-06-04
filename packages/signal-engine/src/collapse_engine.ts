import { Signal, SignalType } from "./types.js";
import { IOBuffer, enqueueSignalWrite } from "./io_buffer_bridge.js";

export class SignalCollapseEngine {

  async run(graph: any, ioBuffer: IOBuffer): Promise<Signal[]> {
    if (!ioBuffer) {
      throw new Error('[DECT VIOLATION] SignalCollapseEngine.run called without IOBuffer');
    }

    const signals: Signal[] = [];

    for (const entity of graph.entities) {

      const score = this.computeScore(entity, graph);

      if (score > 0.7) {
        signals.push({
          id: this.hash(entity),
          entity_id: entity.id,
          type: this.classify(entity, graph),
          score,
          confidence: 0.95,
          metadata: {
            source_hash: graph.source_hash,
            embedding_cluster: this.cluster(entity),
            reasoning_path: "deterministic_graph_walk"
          },
          created_at: Date.now()
        });
      }
    }

    enqueueSignalWrite(ioBuffer, graph.intent_id || 'signal-engine-default', { signals });

    return signals;
  }

  computeScore(entity: any, graph: any): number {
    // deterministic scoring model (NO ML randomness)
    return (
      (entity.embedding_strength || 0.5) * 0.4 +
      (graph.relationship_density || 0.5) * 0.3 +
      (graph.recency_factor || 0.5) * 0.3
    );
  }

  classify(entity: any, graph: any): SignalType {
    if ((graph.relationship_density || 0) > 0.8) return "TREND_SIGNAL";
    if ((entity.importance || 0) > 0.7) return "VALUE_SIGNAL";
    if ((graph.anomaly_score || 0) > 0.6) return "ANOMALY_SIGNAL";

    return "CONTENT_GAP";
  }

  hash(entity: any): string {
    return `${entity.id}-${entity.name}`;
  }

  cluster(entity: any): string {
    return `cluster-${entity.type}`;
  }
}

