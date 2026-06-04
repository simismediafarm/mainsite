import { IOBuffer, enqueueKnowledgeWrite, kernel_llm_extract, kernel_embed_768d } from "./kernel_mocks.js";

export type ExtractionState =
  | "RAW_MARKDOWN"
  | "ENTITY_EXTRACTION"
  | "RELATION_BUILD"
  | "VECTOR_EMBEDDING"
  | "IOBUFFER_COMMIT"
  | "VALIDATED"
  | "REJECTED";

export interface ExtractionInput {
  crawl_job_id: string;
  source_hash: string;
  markdown: string;
  /** Injected IOBuffer for staging writes */
  ioBuffer: IOBuffer;
}

export interface Entity {
  name: string;
  type: string;
}

export interface ExtractedGraph {
  entities: Entity[];
  relations: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

/**
 * Deterministic FSM — NO probabilistic branching allowed
 */
export class KnowledgeExtractorFSM {
  state: ExtractionState = "RAW_MARKDOWN";

  async run(input: ExtractionInput): Promise<void> {
    this.state = "ENTITY_EXTRACTION";

    const graph = await this.extractEntities(input.markdown);

    this.state = "RELATION_BUILD";

    const enriched = await this.buildRelations(graph);

    this.state = "VECTOR_EMBEDDING";

    const embedded = await this.embedEntities(enriched.entities);

    this.state = "IOBUFFER_COMMIT";

    await this.commitToIOBuffer(input.ioBuffer, input.crawl_job_id, {
      ...embedded,
      relations: enriched.relations,
      source_hash: input.source_hash,
      crawl_job_id: input.crawl_job_id,
    });

    this.state = "VALIDATED";
  }

  private async extractEntities(markdown: string): Promise<ExtractedGraph> {
    // deterministic LLM call wrapper (Gemini Flash only)
    const raw = await kernel_llm_extract(markdown);
    return {
      entities: raw.entities,
      relations: raw.relations.map(r => ({
        from: r.from,
        to: r.to,
        type: r.label
      }))
    };
  }

  private async buildRelations(graph: ExtractedGraph) {
    // deterministic edge construction (NO ML inference here)
    return graph;
  }

  private async embedEntities(entities: Entity[]) {
    return kernel_embed_768d(entities);
  }

  private async commitToIOBuffer(ioBuffer: IOBuffer, intentId: string, payload: any) {
    return enqueueKnowledgeWrite(ioBuffer, intentId, payload);
  }
}

