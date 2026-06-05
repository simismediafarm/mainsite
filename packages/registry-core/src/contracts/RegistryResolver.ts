import { RegistryDefinition } from "./RegistryDefinition";
import { RegistryStatus } from "./RegistryStatus";
import { RegistryType } from "./RegistryType";

export interface ResolveOptions {
  version?: number;
  status?: RegistryStatus;
  tenantId?: string;
  environment: "development" | "staging" | "production";
  workspace?: string;
}

export abstract class RegistryResolver {
  /**
   * Resolve a definition by its UID.
   */
  abstract resolveByUid(uid: string, opts?: ResolveOptions): Promise<RegistryDefinition>;

  /**
   * Resolve a definition by its business ID and Type.
   */
  abstract resolveById(id: string, type: RegistryType, opts?: ResolveOptions): Promise<RegistryDefinition>;
}
