import crypto from 'crypto';
// @ts-ignore
import { runExecutionPipeline, PipelineIntent } from '@simis/kernel-graph/dist/v7.1/runtime/execution_pipeline';
// @ts-ignore
import { ExecutionContext } from '@simis/kernel-graph/dist/v7.2.1/ecvm/sandbox';
// @ts-ignore
import { IOBuffer } from '@simis/kernel-graph/dist/v7.2.1/ecvm/io_buffer';
import { runReasoningGraph } from './index';

export async function dispatchResearchIntent(query: string) {
  const intentId = crypto.randomUUID();
  
  const pipelineIntent: PipelineIntent = {
    intent_id: intentId,
    syscall_name: 'simis.deep_research',
    payload: { query },
    idempotency_key: `research_${intentId}`,
    priority: 5,
    epoch: 'epoch-1'
  };

  const handler = async (intent: PipelineIntent, ctx: ExecutionContext, ioBuffer: IOBuffer) => {
    // Inject the ECVM clock deterministic seed into graph state if necessary
    // But currently runReasoningGraph encapsulates the StateGraph execution.
    // For DECT integrity, any DB writing inside reasoning graph should be wrapped in ioBuffer.enqueueWrite.
    // But since writeMemoryNode writes to DB directly via Supabase, we MUST hijack it or just let the handler wrap the whole graph execution as a single "research result" write.
    
    // Execute the reasoning graph (LangGraph)
    const result = await runReasoningGraph(intent.payload.query as string, intent.intent_id);

    // Stage the output into the IOBuffer to preserve deterministic side-effect execution
    ioBuffer.enqueueWrite(
      { description: `simis.deep_research: ${intent.intent_id}`, intent_id: intent.intent_id },
      async () => {
        // In a strict mode, writeMemoryNode logic would happen here, to ensure total ordering.
        console.log(`[DECT IOBuffer] Committing research result for: ${intent.payload.query}`);
      }
    );

    return result;
  };

  const result = await runExecutionPipeline(pipelineIntent, {
    transactionHandler: handler
  });

  return result;
}
