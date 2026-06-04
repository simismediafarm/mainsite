import { authorizeExecution } from "./execution_authorizer.js";

export function kernelPolicy(intent: any, proof: any) {

  const auth = authorizeExecution(intent, proof);

  if (auth.status !== "AUTHORIZED") {
    return {
      action: "DROP",
      reason: auth.reason
    };
  }

  return {
    action: "EXECUTE",
    mode: "THEOREM_VERIFIED_RUNTIME"
  };
}
