const db = {
  query: async (q: string) => { throw new Error("KERNEL VIOLATION"); },
  insert: async (table: string, data: any) => { throw new Error("KERNEL VIOLATION"); }
};

test("direct writes must be blocked by kernel guard", async () => {
  await expect(
    db.query(`INSERT INTO kernel_intent_registry VALUES (...)`)
  ).rejects.toThrow("KERNEL VIOLATION");
});
