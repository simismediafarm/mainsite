import { RegistryContext } from "../contracts/RegistryContext";
import { RegistryDefinition } from "../contracts/RegistryDefinition";

export class RegistryPermissionService {
  canCreate(context: RegistryContext, type: string): boolean {
    // Scaffold implementation, assumes permissions are validated downstream or injected
    return !!context.actorId;
  }

  canReview(context: RegistryContext, definition: RegistryDefinition): boolean {
    return !!context.actorId;
  }

  canPublish(context: RegistryContext, definition: RegistryDefinition): boolean {
    return !!context.actorId;
  }

  canRollback(context: RegistryContext, definition: RegistryDefinition): boolean {
    return !!context.actorId;
  }

  canPromote(context: RegistryContext, definition: RegistryDefinition): boolean {
    return !!context.actorId;
  }

  canArchive(context: RegistryContext, definition: RegistryDefinition): boolean {
    return !!context.actorId;
  }
}
