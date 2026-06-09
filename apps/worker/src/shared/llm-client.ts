import { withBackoff } from './backoff';

export interface LLMRequest {
  prompt: string;
  model?: string;
  signal?: AbortSignal;
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

const TIMEOUT_MS = 10_000;

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const model = req.model ?? 'gemini-2.5-flash';
  const start = Date.now();

  return withBackoff(async (signal) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const merged = req.signal ?? signal ?? ac.signal;

    try {
      // Delegate to API orchestrator endpoint — workers do not hold provider keys
      const res = await fetch(`${process.env.API_BASE_URL}/v2/intelligence/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-SIMIS-OPS-KEY': process.env.SIMIS_OPS_KEY! },
        body: JSON.stringify({ text: req.prompt, model }),
        signal: merged,
      });
      if (!res.ok) throw new Error(`LLM proxy error: ${res.status}`);
      const data = await res.json() as { result: string };
      return { text: data.result, provider: 'api-proxy', model, latencyMs: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  }, 3, 500, req.signal);
}
