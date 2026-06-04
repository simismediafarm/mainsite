export function buildArtifact(decision: any) {
  return {
    title: decision.title || "Auto-Generated",
    body: decision.content || "",
    entities: decision.signals || [],
    timestamp: Date.now()
  };
}
