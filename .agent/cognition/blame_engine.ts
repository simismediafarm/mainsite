import { SystemNode } from "./global_graph";

export function traceBackward(node_id: string): SystemNode[] {
  // Stub implementation
  return [{ id: node_id, type: "API_ENDPOINT", path: "", hash: "", version: "" }];
}

export function attributeRootCause(drift: any) {
  const chain = traceBackward(drift.node);

  return {
    rootCause: chain[chain.length - 1],
    propagationPath: chain,
    affectedLayers: chain.map((n) => n.type),
  };
}
