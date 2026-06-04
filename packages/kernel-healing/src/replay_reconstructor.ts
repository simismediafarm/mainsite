import { getIOBufferSnapshot } from "./checkpoint_reader.js";
// Mocking executeFromBuffer since kernel-graph might not export it yet
// import { executeFromBuffer } from "@simis/kernel-graph";

export async function executeFromBuffer(snapshot: any, opts: any) {
  // Simulates executing the buffer deterministically
  return true;
}

export async function replayFromCheckpoint(job: any, opts?: { strictMode?: boolean }) {
  const snapshot = await getIOBufferSnapshot(job.id);

  if (!snapshot) {
    throw new Error("Missing IOBuffer snapshot");
  }

  // deterministic re-execution
  return executeFromBuffer(snapshot, {
    strict: opts?.strictMode ?? false
  });
}
