import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { EngagementSignalResolver } from './signals/EngagementSignalResolver';
import { SessionSignalResolver } from './signals/SessionSignalResolver';
import { TrafficSignalResolver } from './signals/TrafficSignalResolver';
import { QualityScorer } from './scoring/QualityScorer';
import { AuthenticityScorer } from './scoring/AuthenticityScorer';
import { IntegrityExplainer } from './scoring/IntegrityExplainer';
import { IntegritySnapshotWriter } from './exporters/IntegritySnapshotWriter';
import { IntegrityEventPublisher } from './exporters/IntegrityEventPublisher';

export interface IntegrityResult {
  engagementQualityScore: number;
  sessionQualityScore: number;
  attentionAuthenticityScore: number;
  integrityScore: number;
}

export class IntegrityEngine {
  private prisma: PrismaClient;
  private engResolver: EngagementSignalResolver;
  private sessResolver: SessionSignalResolver;
  private trafficResolver: TrafficSignalResolver;
  private qualityScorer: QualityScorer;
  private authScorer: AuthenticityScorer;
  private explainer: IntegrityExplainer;
  private snapshotWriter: IntegritySnapshotWriter;
  private eventPublisher: IntegrityEventPublisher;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.engResolver = new EngagementSignalResolver();
    this.sessResolver = new SessionSignalResolver();
    this.trafficResolver = new TrafficSignalResolver();
    this.qualityScorer = new QualityScorer();
    this.authScorer = new AuthenticityScorer();
    this.explainer = new IntegrityExplainer();
    this.snapshotWriter = new IntegritySnapshotWriter(prisma);
    this.eventPublisher = new IntegrityEventPublisher(prisma);
  }

  public async evaluate(entityId: string, correlationId?: string) {
    const traceId = uuidv4();
    const startTimeMs = Date.now();
    let engineLogId: string | undefined;

    try {
      // 1. Log Start
      const log = await this.prisma.engineExecutionLog.create({
        data: {
          engineId: 'integrity-engine',
          traceId,
          status: 'running',
          input: { entityId, correlationId }
        }
      });
      engineLogId = log.id;

      // 2. Resolve Signals
      const engSignals = await this.engResolver.resolve(entityId);
      const sessSignals = await this.sessResolver.resolve(entityId);
      const trafficSignals = await this.trafficResolver.resolve(entityId);

      // 3. Score Quality & Authenticity
      const engagementQualityScore = this.qualityScorer.scoreEngagement(engSignals);
      const sessionQualityScore = this.qualityScorer.scoreSession(sessSignals);
      const attentionAuthenticityScore = this.authScorer.score(trafficSignals);

      // 4. Final Integrity Score (Weighted Composition)
      const integrityScore = (engagementQualityScore * 0.4) + (sessionQualityScore * 0.3) + (attentionAuthenticityScore * 0.3);

      const result: IntegrityResult = {
        engagementQualityScore,
        sessionQualityScore,
        attentionAuthenticityScore,
        integrityScore
      };

      // 5. Explainability
      const allSignals = [...engSignals, ...sessSignals, ...trafficSignals];
      const explanation = this.explainer.generate(
        traceId,
        engagementQualityScore,
        sessionQualityScore,
        attentionAuthenticityScore,
        allSignals
      );

      // 6. Snapshot Persistence
      await this.snapshotWriter.write(traceId, entityId, integrityScore);

      // 7. Event Publishing
      await this.eventPublisher.publish(
        traceId,
        'integrity.scored',
        'success',
        { entityId, result, explanation },
        entityId,
        correlationId
      );

      // 8. Log Success
      await this.prisma.engineExecutionLog.update({
        where: { id: engineLogId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          executionMs: Date.now() - startTimeMs,
          output: { result, traceId } as any
        }
      });

      return {
        traceId,
        result,
        explanation
      };

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

      await this.eventPublisher.publish(
        traceId,
        'integrity.scored',
        'failed',
        { error: error.message },
        entityId,
        correlationId
      );

      throw error;
    }
  }
}
