export type HealthSnapshot = {
  timestamp: number;
  api_error_rate: number;
  p95_latency: number;
  prisma_errors: number;
  contract_violations: number;
  deployment_id: string;
};

// In a real system, this would aggregate metrics from Prometheus, Datadog, etc.
// For now, it mocks telemetry gathering passively without impacting request flow.
export async function collectHealthSnapshot(): Promise<HealthSnapshot> {
  return {
    timestamp: Date.now(),
    api_error_rate: 0,
    p95_latency: 120,
    prisma_errors: 0,
    contract_violations: 0,
    deployment_id: process.env.VERCEL_URL || "local-dev",
  };
}
