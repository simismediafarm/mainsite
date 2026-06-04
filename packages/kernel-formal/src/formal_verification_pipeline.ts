import { encodeTrace } from "./execution_trace_encoder.js";
import { generateProof } from "./poe_to_proof.js";
import { validateProof } from "./proof_validator.js";

export class FormalVerificationPipeline {

  async verify(jobId: string) {
    // 1. encode execution trace
    const trace = await encodeTrace(jobId);

    // 2. convert to proof object
    const proof = await generateProof(trace);

    // 3. validate proof correctness
    const valid = await validateProof(proof);

    if (!valid) {
      throw new Error("[FORMAL VERIFICATION FAILED]");
    }

    return {
      jobId,
      proof,
      status: "VERIFIED"
    };
  }
}
