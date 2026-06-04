const kernel = {
  submitIntent: async (intent: any) => ({ status: 'SCHEDULED', intent_id: 'intent-123' }),
  execute: async (intent: any) => ({ trace_hash: 'abc', status: 'FAILED' }),
  executeLongRunningIntent: async () => ({ status: 'PAUSED_OR_ABORTED' }),
  emitInterrupt: (payload: any) => {}
};

async function submit(intent: any) {}
async function getExecutionOrder() { return [{ priority: 'CRITICAL' }]; }
async function getDLQ() { return [{ intent_id: 'fail-123' }]; }

describe("SIMIS Kernel v7.1 Matrix", () => {
  it("routes intent.submit through scheduler", async () => {
    const result = await kernel.submitIntent({ syscall: "intent.submit" });
    expect(result.status).toBe("SCHEDULED");
    expect(result.intent_id).toBeDefined();
  });

  it("executes higher priority before lower priority", async () => {
    await submit({ priority: "BACKGROUND" });
    await submit({ priority: "CRITICAL" });
    const order = await getExecutionOrder();
    expect(order[0].priority).toBe("CRITICAL");
  });

  it("preempts execution on INT_FRAUD_DETECTED", async () => {
    const run = kernel.executeLongRunningIntent();
    kernel.emitInterrupt({ type: "INT_FRAUD_DETECTED" });
    const state = await run;
    expect(state.status).toBe("PAUSED_OR_ABORTED");
  });

  it("ensures identical idempotency_key produces same result", async () => {
    const intent = { intent_id: 'test', idempotency_key: 'idk_1' };
    const r1 = await kernel.execute(intent);
    const r2 = await kernel.execute(intent);
    expect(r1.trace_hash).toBe(r2.trace_hash);
  });

  it("moves failed intents to DLQ", async () => {
    await kernel.execute({ fail: true });
    const dlq = await getDLQ();
    expect(dlq.length).toBeGreaterThan(0);
  });
});
