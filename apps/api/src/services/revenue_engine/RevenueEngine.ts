import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { RevenueContextResolver } from './resolvers/RevenueContextResolver';
import { RevenueRuleResolver } from './resolvers/RevenueRuleResolver';
import { RevenueSignalResolver } from './resolvers/RevenueSignalResolver';
import { RuleEvaluator } from './evaluation/RuleEvaluator';
import { RevenueScorer } from './evaluation/RevenueScorer';
import { RevenueConfidenceScorer } from './evaluation/RevenueConfidenceScorer';
import { RevenueExplainer } from './evaluation/RevenueExplainer';
import { RevenueAnomalyDetector } from './evaluation/RevenueAnomalyDetector';
import { RevenueSnapshotWriter } from './exporters/RevenueSnapshotWriter';
import { RevenueEventPublisher } from './exporters/RevenueEventPublisher';

export class RevenueEngine {
  private prisma: PrismaClient;
  private contextResolver: RevenueContextResolver;
  private ruleResolver: RevenueRuleResolver;
  private signalResolver: RevenueSignalResolver;
  private ruleEvaluator: RuleEvaluator;
  private scorer: RevenueScorer;
  private confidenceScorer: RevenueConfidenceScorer;
  private explainer: RevenueExplainer;
  private anomalyDetector: RevenueAnomalyDetector;
  private snapshotWriter: RevenueSnapshotWriter;
  private eventPublisher: RevenueEventPublisher;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.contextResolver = new RevenueContextResolver();
    this.ruleResolver = new RevenueRuleResolver(prisma);
    this.signalResolver = new RevenueSignalResolver();
    this.ruleEvaluator = new RuleEvaluator();
    this.scorer = new RevenueScorer();
    this.confidenceScorer = new RevenueConfidenceScorer();
    this.explainer = new RevenueExplainer();
    this.anomalyDetector = new RevenueAnomalyDetector();
    this.snapshotWriter = new RevenueSnapshotWriter(prisma);
    this.eventPublisher = new RevenueEventPublisher(prisma);
  }

  public async evaluate(entityId: string, contextName: 'homepage' | 'search' | 'entity' | 'api', correlationId?: string, causationId?: string) {
    const traceId = uuidv4();
    const startTimeMs = Date.now();
    let engineLogId: string | undefined;

    try {
      // 1. Log Start
      const log = await this.prisma.engineExecutionLog.create({
        data: {
          engineId: 'revenue-engine',
          traceId,
          status: 'running',
          input: { entityId, contextName, correlationId }
        }
      });
      engineLogId = log.id;

      // 2. Resolve Context, Signals, and Rules
      const context = this.contextResolver.resolveContext(traceId, contextName);
      const signals = await this.signalResolver.resolve(entityId);
      const rules = await this.ruleResolver.resolve(context.context);

      // 3. Evaluate Rules
      const firedActions = this.ruleEvaluator.evaluate(rules, signals);

      // 4. Score Confidence and Revenue
      const confidence = this.confidenceScorer.score(signals);
      const result = this.scorer.score(signals, firedActions, confidence);

      // 5. Detect Anomalies
      const anomaly = this.anomalyDetector.detect(result);
      if (anomaly) {
        await this.eventPublisher.publish(traceId, 'revenue.anomaly.detected', 'failed', anomaly, entityId, correlationId, causationId);
      }

      // 6. Generate Explanation
      const explanation = this.explainer.generate(traceId, result, firedActions, signals);

      // 7. Write Immutable Snapshot
      await this.snapshotWriter.write(traceId, entityId, result.revenueScore, result.confidence);

      // 8. Log Decision for Audit
      for (const action of firedActions) {
        await this.prisma.revenueDecisionLog.create({
          data: {
            traceId,
            ruleId: action.ruleId,
            action: action.type,
            beforeScore: (signals.rankingScore * 0.5) + (signals.integrityScore * 0.5), // Base pre-action
            afterScore: result.revenueScore
          }
        });
      }

      // 9. Publish Success Event
      await this.eventPublisher.publish(traceId, 'revenue.scored', 'success', { result, explanation }, entityId, correlationId, causationId);

      // 10. Update Execution Log
      await this.prisma.engineExecutionLog.update({
        where: { id: engineLogId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          executionMs: Date.now() - startTimeMs,
          output: { result, traceId }
        }
      });

      return { traceId, result, explanation };

    } catch (error: any) {
      if (engineLogId) {
        await this.prisma.engineExecutionLog.update({
          where: { id: engineLogId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            executionMs: Date.now() - startTimeMs,
            error: { message: error.message, stack: error.stack }
          }
        });
      }

      await this.eventPublisher.publish(traceId, 'revenue.scored', 'failed', { error: error.message }, entityId, correlationId, causationId);
      throw error;
    }
  }
}
