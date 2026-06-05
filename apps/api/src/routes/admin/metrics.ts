import { Router } from "express";
import { MetricsAggregatorService } from "../../services/admin/metrics-aggregator.service";
import { QueueMonitorService } from "../../services/admin/queue-monitor.service";
import { LLMUsageAnalyzerService } from "../../services/admin/llm-usage-analyzer.service";

export const adminMetricsRouter = Router();

const metricsAggregator = new MetricsAggregatorService();
const queueMonitor = new QueueMonitorService();
const llmUsageAnalyzer = new LLMUsageAnalyzerService();

// GET /admin/system-health
adminMetricsRouter.get("/system-health", async (req, res) => {
  // READ-ONLY: Fetch aggregated system status
  const health = await metricsAggregator.getSystemHealth();
  res.json(health);
});

// GET /admin/queue-depth
adminMetricsRouter.get("/queue-depth", async (req, res) => {
  // READ-ONLY: Fetch BullMQ state from Redis/EventQueueLog
  const depth = await queueMonitor.getQueueDepth();
  res.json(depth);
});

// GET /admin/llm-usage
adminMetricsRouter.get("/llm-usage", async (req, res) => {
  // READ-ONLY: Fetch LLMCallLog aggregates
  const usage = await llmUsageAnalyzer.getUsageStats();
  res.json(usage);
});

// SSE Endpoint for real-time streaming
adminMetricsRouter.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // TODO: Connect to Redis PubSub for real-time broadcast
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);
});
