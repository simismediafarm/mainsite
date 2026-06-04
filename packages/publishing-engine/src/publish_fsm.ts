export type PublishState =
  | "PENDING"
  | "ARTIFACT_BUILDING"
  | "SCHEMA_INJECTED"
  | "RENDERED"
  | "DEPLOYED"
  | "FAILED"
  | "DEFERRED";

export interface PublishIntent {
  decision_id: string;
  content: any;
  signals: any[];
}
