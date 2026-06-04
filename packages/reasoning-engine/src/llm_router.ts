import * as crypto from "crypto";

export function validateLLMOutput(output: any) {
  if (!output || typeof output !== "object") {
    throw new Error("LLM_INVALID_PAYLOAD");
  }

  return hash(JSON.stringify(output));
}

function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
