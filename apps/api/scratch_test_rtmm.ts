import { RTMMEngine } from './src/services/rt-rml/rtmm-engine';
import { BanditEngine } from './src/services/rt-rml/bandit_engine';
import { ContextVector, BanditAction } from './src/services/rt-rml/types';

async function runSimulation() {
  console.log("=== SIMIS RT-RML v2 SIMULATION ===");

  const contextUS: ContextVector = { geo: "US", device: "mobile", category: "tech" };
  const contextSEA: ContextVector = { geo: "SEA", device: "mobile", category: "tech" };

  console.log("\n[TEST 1] Initial Selection (Exploration/UCB initialization)");
  const initialActionUS = await RTMMEngine.resolveMonetizationSlot(contextUS);
  console.log("Selected Action (US):", initialActionUS.type);

  console.log("\n[TEST 2] High Dwell & Conversion -> System should favor AFFILIATE or SPONSORED");
  const affiliateAction: BanditAction = { type: "AFFILIATE_SLOT", position: "inline" };
  for (let i = 0; i < 100; i++) {
    await BanditEngine.update(contextUS, affiliateAction, {
      ctr: 0.4,
      dwell_time: 15000,
      scroll_depth: 80,
      conversion: true,
      rpm: 10.5
    });
  }

  const trainedActionUS = await RTMMEngine.resolveMonetizationSlot(contextUS);
  console.log("Selected Action after 100 high-reward updates (US):", trainedActionUS.type);

  console.log("\n[TEST 3] High CTR but 0 Dwell/Conversion (Bot Fraud Simulation)");
  const displayAdAction: BanditAction = { type: "DISPLAY_AD", position: "sidebar" };
  for (let i = 0; i < 100; i++) {
    await BanditEngine.update(contextUS, displayAdAction, {
      ctr: 0.9,
      dwell_time: 100,
      scroll_depth: 10,
      conversion: false,
      rpm: 0
    });
  }

  const fraudTrainedActionUS = await RTMMEngine.resolveMonetizationSlot(contextUS);
  console.log("Selected Action after CTR spam (US):", fraudTrainedActionUS.type);

  console.log("\n[TEST 4] Geo Divergence (SEA context initially)");
  const seaAction = await RTMMEngine.resolveMonetizationSlot(contextSEA);
  console.log("Selected Action (SEA):", seaAction.type);

  console.log("\n[SUCCESS] RTMM Simulation Completed successfully.");
  process.exit(0);
}

runSimulation().catch(console.error);
