import { replayIntent } from "../runtime/replay";
import { correlateTrace } from "./linker";

export async function validateReplayConsistency(intent_id: string) {
  const live = await correlateTrace(intent_id);
  const replay = await replayIntent(intent_id);

  return {
    intent_id,

    live_trace_hash: live.trace_hash,
    replay_trace_hash: replay.hash,

    execution_match:
      live.execution_hash === replay.hash,

    system_valid:
      live.aligned && live.execution_hash === replay.hash
  };
}
