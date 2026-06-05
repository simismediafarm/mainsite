export interface RegistryEvent {
  eventUid: string;
  correlationId: string;
  causationId?: string;
  actorId: string;
  tenantId?: string;
  environment: string;
  workspace?: string;
  
  type: 
    | "created" 
    | "updated" 
    | "deleted" 
    | "published" 
    | "rollback" 
    | "status_change"
    | "theme_promoted"
    | "theme_rolled_back"
    | "artifact_rejected"
    | "signature_mismatch_detected"
    | "cdn_cache_state_changed"
    | "convergence_partial_failure"
    | "convergence_completed"
    | "convergence_failed";
  payload: any;
  timestamp: Date;
}
