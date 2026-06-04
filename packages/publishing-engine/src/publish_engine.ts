/**
 * publish_engine.ts — Publishing Pipeline Execution Engine
 *
 * PRODUCTION HARDENING: IOBuffer must be passed in — no mock allowed.
 * All PUBLISH_COMMIT writes go through IOBuffer.enqueueWrite().
 */

import { PublishIntent } from "./publish_fsm.js";
import { buildArtifact } from "./artifact_builder.js";
import { injectSchema } from "./schema_injector.js";
import { renderPage } from "./renderer.js";
import { deployToEdge } from "./edge_publisher.js";
import * as crypto from "crypto";
// @ts-ignore — will be resolved when exports are added to kernel-graph/package.json
import { IOBuffer } from '@simis/kernel-graph/dist/v7.2.1/ecvm/io_buffer';

export class PublishEngine {

  async execute(intent: PublishIntent, ioBuffer: IOBuffer) {
    if (!ioBuffer) {
      throw new Error('[DECT VIOLATION] PublishEngine.execute called without IOBuffer — direct write forbidden');
    }

    const artifact = buildArtifact(intent);
    const schema = injectSchema(artifact);
    const rendered = renderPage(schema);
    const deploy = await deployToEdge(rendered);

    // Stage PUBLISH_COMMIT through IOBuffer — never write to DB directly.
    ioBuffer.enqueueWrite({
      type: "PUBLISH_COMMIT",
      payload: {
        deploy,
        artifact_hash: this.hash(artifact)
      }
    }, async () => {
      // Actual DB commit happens during ECVM flush via kernel_execute RPC.
      console.log(`[PUBLISH ENGINE] Publish commit staged for artifact hash: ${this.hash(artifact)}`);
    });

    return deploy;
  }

  hash(obj: any) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(obj))
      .digest("hex");
  }
}

