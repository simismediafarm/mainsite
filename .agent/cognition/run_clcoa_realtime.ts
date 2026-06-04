import { buildRealGroundTruthGraph } from "../groundtruth/realtime_fusion_engine";
import fs from "fs";
import path from "path";

export async function runCLCOA() {
  const graph = await buildRealGroundTruthGraph();
  const outputDir = path.resolve(process.cwd(), ".agent/output");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!graph.grounded) {
    const report = {
      status: "UNGROUNDED",
      drift: graph.drift,
      timestamp: Date.now(),
    };

    fs.writeFileSync(
      path.join(outputDir, "UNGROUNDED.json"),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  const report = {
    status: "GROUNDED",
    drift: 0,
  };

  fs.writeFileSync(
    path.join(outputDir, "GROUNDED.json"),
    JSON.stringify(report, null, 2)
  );

  return report;
}

// Execute if run directly
if (require.main === module) {
  console.log("🚀 CLCOA v2.1: Initializing Ground Truth Stream...");
  runCLCOA().then(report => {
    console.log(`✅ System Status: ${report.status}`);
    console.log(JSON.stringify(report, null, 2));
    if (report.status === "UNGROUNDED") {
      process.exit(1);
    }
  }).catch(err => {
    console.error("❌ CLCOA Execution Failed", err);
    process.exit(1);
  });
}
