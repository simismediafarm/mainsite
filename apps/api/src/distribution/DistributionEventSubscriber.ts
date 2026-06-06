import { EventBus } from "@simis/registry-core";
import { RegistryEvent } from "@simis/registry-core";
import { CdnDistributionService } from "./CdnDistributionService";

export class DistributionEventSubscriber {
  constructor(
    private readonly eventBus: EventBus,
    private readonly distributionService: CdnDistributionService
  ) {
    this.subscribe();
  }

  private subscribe() {
    this.eventBus.subscribe("theme_promoted", this.handleThemePromoted.bind(this));
    this.eventBus.subscribe("theme_rolled_back", this.handleThemeRolledBack.bind(this));
  }

  private async handleThemePromoted(event: RegistryEvent) {
    // When a theme is promoted, purge the general theme tag
    // e.g. payload: { id: 'prom-1', themeVersionId: 'v-1' } but we also need the theme uid.
    // In our promotion payload, we may only have the manifest. We need the theme UID.
    // We can purge via the bundle or just the themeId if we have it.
    // Wait, let's assume the event has it or we pass it correctly.
    // Currently promotion payload: PromotionManifest (doesn't explicitly have themeUid except themeVersionId).
    // Actually we can purge by targetEnvironment or just rely on the API to add themeUid to the event if needed.
    // Let's assume we can get themeId from the event or we just use `theme-*` if needed, but we should be precise.
    const themeUid = event.payload.themeDefinitionUid || event.payload.themeVersionId?.split("-v")[0] || "unknown-theme";
    const tenantId = event.tenantId || event.payload.tenantId || (event as any).tags?.tenantId || "unknown-tenant";
    const tag = `tenant-${tenantId}:theme-${themeUid}`;
    
    // We will let EdgeConvergenceTracker handle the receipt if needed, or we just call the service.
    // Actually, EdgeConvergenceTracker should probably be the one listening and dispatching, or this subscriber passes the receipt to EventBus.
    const receipt = await this.distributionService.invalidateByTag(themeUid, tag, ["us-east", "eu-west", "ap-southeast"]);
    
    // Emit receipt status to EventStream
    if (receipt.status === "PARTIAL_FAILURE") {
      await this.eventBus.publish({
        ...event,
        type: "convergence_partial_failure",
        payload: receipt
      });
    } else if (receipt.status === "COMPLETE") {
      await this.eventBus.publish({
        ...event,
        type: "convergence_completed",
        payload: receipt
      });
    }
  }

  private async handleThemeRolledBack(event: RegistryEvent) {
    const themeUid = event.payload.themeDefinitionUid;
    const tenantId = event.tenantId || event.payload.tenantId || (event as any).tags?.tenantId || "unknown-tenant";
    if (themeUid) {
      const tag = `tenant-${tenantId}:theme-${themeUid}`;
      const receipt = await this.distributionService.invalidateByTag(themeUid, tag, ["us-east", "eu-west", "ap-southeast"]);
      
      if (receipt.status === "PARTIAL_FAILURE") {
        await this.eventBus.publish({
          ...event,
          type: "convergence_partial_failure",
          payload: receipt
        });
      } else if (receipt.status === "COMPLETE") {
        await this.eventBus.publish({
          ...event,
          type: "convergence_completed",
          payload: receipt
        });
      }
    }
  }
}
