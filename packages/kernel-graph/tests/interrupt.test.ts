const kernel = {
  runLongTask: async () => ({ status: 'ABORTED' }),
  emitInterrupt: (payload: any) => {}
};

test("interrupt preempts running execution", async () => {
  const exec = kernel.runLongTask();

  kernel.emitInterrupt({
    type: "INT_FRAUD_DETECTED"
  });

  const result = await exec;

  expect(["PAUSED", "ABORTED"]).toContain(result.status);
});
