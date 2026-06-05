import { RegistryDefinition, RegistryVersion } from "../../contracts";
import { RegistryRepository } from "../RegistryRepository";

export class VersionConsistencyValidator {
  constructor(private readonly repository: RegistryRepository) {}

  /**
   * Validates that the currentVersionUid of a definition points to a valid version belonging to that definition.
   */
  async validate(definition: RegistryDefinition): Promise<void> {
    if (!definition.currentVersionUid) {
      return; // Permissible for drafts that might not have a version attached yet depending on the saving strategy
    }

    const version = await this.repository.getVersion(definition.currentVersionUid);
    
    if (!version) {
      throw new Error(`VersionConsistencyError: currentVersionUid ${definition.currentVersionUid} not found for definition ${definition.uid}`);
    }

    if (version.definitionUid !== definition.uid) {
      throw new Error(`VersionConsistencyError: currentVersionUid ${definition.currentVersionUid} belongs to definition ${version.definitionUid}, not ${definition.uid}`);
    }
  }
}
