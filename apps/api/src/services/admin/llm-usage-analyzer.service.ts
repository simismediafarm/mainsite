import { prisma } from '../../prisma';

export interface LLMUsageSummary {
  provider: string;
  model: string;
  callCount: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  errorRate: number;
}

export interface LLMUsageReport {
  windowHours: number;
  totalCalls: number;
  totalCostUsd: number;
  byProvider: LLMUsageSummary[];
  topFailingProvider: string | null;
  generatedAt: string;
}

export class LLMUsageAnalyzerService {
  async analyze(windowHours = 24): Promise<LLMUsageReport> {
    const since = new Date(Date.now() - windowHours * 3_600_000);

    const logs = await prisma.lLMCallLog.findMany({
      where: { createdAt: { gte: since } },
      select: { provider: true, model: true, latencyMs: true, cost: true, status: true },
    });

    const grouped: Record<string, typeof logs> = {};
    for (const l of logs) {
      const key = `${l.provider}::${l.model}`;
      (grouped[key] ??= []).push(l);
    }

    const byProvider: LLMUsageSummary[] = Object.entries(grouped).map(([key, entries]) => {
      const [provider, model] = key.split('::');
      type LogEntry = { provider: string; model: string; latencyMs: number | null; cost: unknown; status: string };
      const typed = entries as LogEntry[];
      const errors = typed.filter((e: LogEntry) => e.status === 'error').length;
      const totalCost = typed.reduce((s: number, e: LogEntry) => s + (parseFloat(String(e.cost)) || 0), 0);
      const avgLatency = typed.reduce((s: number, e: LogEntry) => s + (e.latencyMs ?? 0), 0) / typed.length;
      return {
        provider,
        model,
        callCount: entries.length,
        totalCostUsd: Math.round(totalCost * 1e6) / 1e6,
        avgLatencyMs: Math.round(avgLatency),
        errorRate: entries.length > 0 ? errors / entries.length : 0,
      };
    });

    byProvider.sort((a, b) => b.totalCostUsd - a.totalCostUsd);

    const topFailing = byProvider.reduce<LLMUsageSummary | null>(
      (worst, cur) => (!worst || cur.errorRate > worst.errorRate ? cur : worst),
      null
    );

    return {
      windowHours,
      totalCalls: logs.length,
      totalCostUsd: byProvider.reduce((s, p) => s + p.totalCostUsd, 0),
      byProvider,
      topFailingProvider: topFailing && topFailing.errorRate > 0 ? topFailing.provider : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
