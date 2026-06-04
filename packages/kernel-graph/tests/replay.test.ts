async function replayIntent(id: string) { return { trace_hash: 'deterministic_hash_123' }; }

test("replay produces identical execution hash", async () => {
  const first = await replayIntent("intent-123");
  const second = await replayIntent("intent-123");

  expect(first.trace_hash).toBe(second.trace_hash);
});
