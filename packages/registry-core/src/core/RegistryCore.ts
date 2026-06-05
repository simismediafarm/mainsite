import { RegistryRepository } from "./RegistryRepository";
import { EventBus } from "./EventBus";
import { TransactionBoundary } from "./TransactionBoundary";
import { CreateRegistryParams } from "./RegistryRepository";
import { RegistryDefinition, RegistryVersion, RegistryEvent } from "../contracts";

export class RegistryCore {
  constructor(
    private readonly repository: RegistryRepository,
    private readonly eventBus: EventBus,
    private readonly txBoundary: TransactionBoundary
  ) {}

  async createDefinition(params: CreateRegistryParams): Promise<{ definition: RegistryDefinition; version: RegistryVersion }> {
    return this.txBoundary.execute(async (tx) => {
      const result = await this.repository.create(params, tx);
      
      await this.eventBus.publish({
        eventUid: "sys-" + result.version.uid,
        correlationId: "core-create",
        actorId: "system",
        environment: result.definition.environment,
        type: "created",
        payload: {
          definitionUid: result.definition.uid,
          versionUid: result.version.uid,
          versionNumber: result.version.versionNumber,
        },
        timestamp: new Date(),
      } as RegistryEvent);

      return result;
    });
  }

  async updateDefinition(uid: string, newDefinition: Record<string, any>): Promise<RegistryVersion> {
    return this.txBoundary.execute(async (tx) => {
      const version = await this.repository.update(uid, newDefinition, tx);
      
      await this.eventBus.publish({
        eventUid: "sys-" + version.uid,
        correlationId: "core-update",
        actorId: "system",
        environment: "unknown",
        type: "updated",
        payload: {
          definitionUid: uid,
          versionUid: version.uid,
          versionNumber: version.versionNumber,
        },
        timestamp: new Date(),
      } as RegistryEvent);

      return version;
    });
  }
}
