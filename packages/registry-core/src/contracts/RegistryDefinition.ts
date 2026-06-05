import { RegistryType } from "./RegistryType";
import { RegistryStatus } from "./RegistryStatus";

export interface RegistryDefinition {
  uid: string;
  id: string;
  type: RegistryType;
  currentVersionUid: string;
  status: RegistryStatus;
  tenantId?: string;
  environment: "development" | "staging" | "production";
  workspace?: string;
}
