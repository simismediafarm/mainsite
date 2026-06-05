import { EventBus } from "../packages/registry-core/src/core/EventBus";
import { CdnDistributionService } from "../apps/api/src/distribution/CdnDistributionService";
import { MultiRegionCdnProvider } from "../apps/api/src/distribution/MultiRegionCdnProvider";
import { EdgeConvergenceTracker } from "../apps/api/src/distribution/EdgeConvergenceTracker";
import { InvalidationRetryWorker } from "../apps/api/src/distribution/InvalidationRetryWorker";
import { DistributionEventSubscriber } from "../apps/api/src/distribution/DistributionEventSubscriber";
import { RegistryRepository } from "../packages/registry-core/src/core/RegistryRepository";

async function main() {
  console.log("========================================");
  console.log(" SIMIS Phase 8: Global Edge Convergence ");
  console.log("========================================");

  const eventBus = new EventBus();
  const provider = new MultiRegionCdnProvider();
  
  // Inject partial failure into eu-west: it will drop 100% of purges initially
  provider.failureInjectionRates.set("eu-west", 1.0);
  console.log("[Simulation] Configured eu-west with 100% network partition drop rate");

  const service = new CdnDistributionService(provider);
  const mockRepo = {
    saveCDNPropagationReceipt: async (receipt: any) => {
      console.log(`[AuditLog] Receipt persisted to DB. Status: ${receipt.status}, ID: ${receipt.receiptId}`);
    }
  } as unknown as RegistryRepository;

  const tracker = new EdgeConvergenceTracker(eventBus, mockRepo);
  new InvalidationRetryWorker(eventBus, service);
  new DistributionEventSubscriber(eventBus, service);

  eventBus.subscribe("convergence_partial_failure", (e: any) => {
    const rcpt = e.payload;
    console.log(`[Event: convergence_partial_failure] Failed edges: ${rcpt.failedEdges.join(",")}, Retry: ${rcpt.retryCount}`);
    
    // Simulate partition recovery after 2 retries
    if (rcpt.retryCount === 2) {
      console.log("[Simulation] Network partition to eu-west recovered!");
      provider.failureInjectionRates.set("eu-west", 0.0);
    }
  });

  eventBus.subscribe("convergence_completed", (e: any) => {
    console.log(`[Event: convergence_completed] All edges converged! Score: ${tracker.getGlobalConvergenceScore() * 100}%`);
  });

  eventBus.subscribe("convergence_failed", (e: any) => {
    console.log(`[Event: convergence_failed] Exhausted retries or deadline passed.`);
  });

  console.log("\n[Simulation] Triggering theme promotion...");
  await eventBus.publish({
    eventUid: "test-event-1",
    correlationId: "corr-1",
    actorId: "system",
    environment: "production",
    type: "theme_promoted",
    payload: {
      themeDefinitionUid: "test-theme-x"
    },
    timestamp: new Date()
  });

  console.log("[Simulation] Waiting for eventual consistency (retries)...");
  
  // Wait enough time for 3 retries: 100ms + 200ms + 400ms = 700ms. We'll wait 2 seconds.
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("\n========================================");
  console.log(" SIMIS Phase 8: Dead Partition Test ");
  console.log("========================================");

  provider.failureInjectionRates.set("ap-southeast", 1.0);
  console.log("[Simulation] Configured ap-southeast with permanent 100% drop rate");

  await eventBus.publish({
    eventUid: "test-event-2",
    correlationId: "corr-2",
    actorId: "system",
    environment: "production",
    type: "theme_rolled_back",
    payload: {
      themeDefinitionUid: "test-theme-y"
    },
    timestamp: new Date()
  });

  // This will try up to MAX_RETRY_ATTEMPTS_PER_RECEIPT=5 
  // 100+200+400+800+1600+3200ms ~ 6.3 seconds. We'll wait 7 seconds.
  console.log("[Simulation] Waiting for maximum retry bounds to be hit...");
  await new Promise(r => setTimeout(r, 7000));

  console.log("\nSimulation finished.");
}

main().catch(console.error);
