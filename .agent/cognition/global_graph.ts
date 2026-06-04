export type SystemNodeType =
  | "UI_COMPONENT"
  | "API_ENDPOINT"
  | "DB_SCHEMA"
  | "KERNEL_SYSCALL"
  | "THIRD_PARTY"
  | "CONFIG"
  | "INTENT_FLOW";

export interface SystemNode {
  id: string;
  type: SystemNodeType;
  path: string;
  hash: string;
  version: string;
}

export interface SystemEdge {
  from: string;
  to: string;
  relation:
    | "calls"
    | "reads"
    | "writes"
    | "renders"
    | "depends_on"
    | "maps_to";
  confidence: number;
}

export interface SystemGraph {
  nodes: SystemNode[];
  edges: SystemEdge[];
}
