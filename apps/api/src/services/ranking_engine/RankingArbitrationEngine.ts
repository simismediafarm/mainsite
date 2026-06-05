import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { ContextResolver, RankingContext } from './resolvers/ContextResolver';
import { ProfileResolver } from './resolvers/ProfileResolver';
import { ExperimentResolver } from './resolvers/ExperimentResolver';
import { FactorResolver } from './resolvers/FactorResolver';
import { ScoreCalculator } from './core/ScoreCalculator';
import { ScoreExplainer } from './core/ScoreExplainer';
import { SnapshotWriter } from './exporters/SnapshotWriter';
import { EventPublisher } from './exporters/EventPublisher';
import { FactorValidator } from './core/FactorValidator';
import { RankingDriftAnalyzer } from './core/RankingDriftAnalyzer';

export class RankingArbitrationEngine {
  private prisma: PrismaClient;
  private contextResolver: ContextResolver;
  private profileResolver: ProfileResolver;
  private experimentResolver: ExperimentResolver;
  private factorResolver: FactorResolver;
  private scoreCalculator: ScoreCalculator;
  private scoreExplainer: ScoreExplainer;
  private snapshotWriter: SnapshotWriter;
  private eventPublisher: EventPublisher;
  private factorValidator: FactorValidator;
  private driftAnalyzer: RankingDriftAnalyzer;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.contextResolver = new ContextResolver();
    this.profileResolver = new ProfileResolver(prisma);
    this.experimentResolver = new ExperimentResolver(prisma);
    this.factorResolver = new FactorResolver(prisma);
    this.scoreCalculator = new ScoreCalculator();
    this.scoreExplainer = new ScoreExplainer();
    this.snapshotWriter = new SnapshotWriter(prisma);
    this.eventPublisher = new EventPublisher(prisma);
    this.factorValidator = new FactorValidator();
    this.driftAnalyzer = new RankingDriftAnalyzer();
  }

  public async evaluate(
    entityId: string, 
    entityType: string, 
    contextName: 'homepage' | 'search' | 'entity' | 'recommendation' | 'newsletter' | 'api',
    workspaceId?: string
  ) {
    const traceId = uuidv4();
    const startTimeMs = Date.now();
    let engineLogId: string | undefined;

    // Stage metrics
    let resolverMs = 0;
    let calculationMs = 0;
    let snapshotMs = 0;
    let eventMs = 0;
    let t0 = Date.now();

    try {
      // 1. Log Engine Start
      const log = await this.prisma.engineExecutionLog.create({
        data: {
          engineId: 'ranking-engine',
          traceId,
          status: 'running',
          input: { entityId, entityType, contextName, workspaceId }
        }
      });
      engineLogId = log.id;

      // --- RESOLVER STAGE ---
      t0 = Date.now();
      const context = this.contextResolver.resolveContext(traceId, contextName, workspaceId);

      const resolvedProfile = await this.profileResolver.resolve(context.context, context.workspaceId);
      if (!resolvedProfile) {
        throw new Error(`No active RankingProfile found for context: ${context.context}`);
      }

      const resolvedExperiment = await this.experimentResolver.resolve(resolvedProfile.id, entityId);
      const activeProfileId = resolvedExperiment.profileId;
      
      let activeProfile = resolvedProfile;
      if (activeProfileId !== resolvedProfile.id) {
        const variantProfile = await this.prisma.rankingProfile.findUnique({ where: { id: activeProfileId } });
        if (!variantProfile) throw new Error(`Variant profile ${activeProfileId} not found.`);
        activeProfile = { ...variantProfile, schemaVersion: variantProfile.schemaVersion, weights: variantProfile.weights as any };
      }

      const weightKeys = Object.keys(activeProfile.weights || {});
      const resolvedFactors = await this.factorResolver.resolveFactors(entityId, entityType, weightKeys);
      resolverMs = Date.now() - t0;

      // --- CALCULATION STAGE ---
      t0 = Date.now();
      
      // P1.10 Validation
      for (const factor of resolvedFactors) {
        this.factorValidator.validate(factor.rawValue, factor.metadata);
      }

      const calculationResult = this.scoreCalculator.calculate(resolvedFactors, activeProfile.weights as Record<string, number>);

      // P1.10 Drift Analysis
      const driftResult = this.driftAnalyzer.analyze(calculationResult.score, calculationResult.factors);
      if (driftResult.driftDetected) {
        // Emit anomaly event asynchronously
        this.eventPublisher.publish(
          traceId,
          'ranking.scored',
          'failed',
          { error: `Drift detected: ${driftResult.reason}` },
          entityId
        ).catch(console.error);
      }

      const explanation = this.scoreExplainer.generateExplanation(
        traceId,
        activeProfile.id,
        resolvedExperiment.experimentId || null,
        calculationResult.score,
        calculationResult.factors
      );
      calculationMs = Date.now() - t0;

      // --- SNAPSHOT & PERSISTENCE STAGE ---
      t0 = Date.now();
      await this.snapshotWriter.write(
        entityType,
        activeProfile.id,
        activeProfile.version,
        context.context,
        calculationResult.score,
        explanation,
        resolvedFactors
      );

      // P1.10 Decision Logging
      await this.prisma.rankingDecisionLog.create({
        data: {
          entityId,
          profileId: activeProfile.id,
          traceId,
          experimentId: resolvedExperiment.experimentId,
          context: context.context,
          score: calculationResult.score,
          factors: calculationResult.factors as any
        }
      });
      snapshotMs = Date.now() - t0;

      // --- EVENT STAGE ---
      t0 = Date.now();
      await this.eventPublisher.publish(
        traceId,
        'ranking.scored',
        'success',
        { profileId: activeProfile.id, postId: entityId, score: calculationResult.score },
        entityId
      );
      eventMs = Date.now() - t0;

      const totalExecutionMs = Date.now() - startTimeMs;

      // Update Execution Log Success with stage metrics
      await this.prisma.engineExecutionLog.update({
        where: { id: engineLogId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          executionMs: totalExecutionMs,
          output: { 
            score: calculationResult.score, 
            traceId,
            metrics: { resolverMs, calculationMs, snapshotMs, eventMs }
          }
        }
      });

      return {
        traceId,
        score: calculationResult.score,
        explanation,
        metrics: { resolverMs, calculationMs, snapshotMs, eventMs, totalExecutionMs }
      };

    } catch (error: any) {
      const executionMs = Date.now() - startTimeMs;
      
      // Log failure
      if (engineLogId) {
        await this.prisma.engineExecutionLog.update({
          where: { id: engineLogId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            executionMs,
            error: { message: error.message, stack: error.stack }
          }
        });
      }

      await this.eventPublisher.publish(
        traceId,
        'ranking.scored',
        'failed',
        { error: error.message },
        entityId
      );

      throw error;
    }
  }
}
