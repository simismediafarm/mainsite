export interface RegistryContext {
  actorId: string;
  tenantId?: string;
  workspace?: string;
  environment: "development" | "staging" | "production";
  correlationId?: string;
}
