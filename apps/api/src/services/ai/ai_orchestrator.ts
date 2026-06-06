import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { prisma } from '../../prisma';
import { AICache } from '@simis/ai-cache';
import { AIPipelineGuard } from '../../kernel/guards/ai.invariant';
import crypto from 'crypto';

export class AIOrchestrator {
  private geminiClient: GoogleGenAI | null = null;
  private openRouterClient: OpenAI | null = null;
  private openAIClient: OpenAI | null = null;
  private aiCache: AICache;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    // Initialize AI Cache
    this.aiCache = new AICache(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Enriches content utilizing the Strict SIK Fallback Hierarchy:
   * CACHE -> DB -> RULE -> GEMINI -> OPENROUTER -> CHATGPT -> FALLBACK
   */
  public async enrichContent(text: string): Promise<string | null> {
    const traceId = crypto.randomUUID();

    return AIPipelineGuard.execute(traceId, async () => {
      const prompt = `Enrich this content by extracting key entities, generating an SEO summary, and analyzing its tone:\n\n${text}`;
      const inputHash = crypto.createHash('sha256').update(prompt).digest('hex');

      // ── Step 1: CACHE Check ──────────────────────────────────────────────────
      AIPipelineGuard.recordStep('CACHE');
      try {
        const cached = await this.aiCache.getSnapshot(inputHash);
        if (cached) {
          console.log('[AIOrchestrator] Cache Hit (CACHE step resolved)');
          return typeof cached === 'string' ? cached : JSON.stringify(cached);
        }
      } catch (err: any) {
        console.warn('[AIOrchestrator] Cache step failed, continuing:', err.message);
      }

      // ── Step 2: DB Check ─────────────────────────────────────────────────────
      AIPipelineGuard.recordStep('DB');
      try {
        const dbSnapshot = await prisma.intelligenceSnapshot.findUnique({
          where: { inputHash }
        });
        if (dbSnapshot) {
          console.log('[AIOrchestrator] DB Hit (DB step resolved)');
          // Backfill cache
          await this.aiCache.saveSnapshot(inputHash, dbSnapshot.entityScore.toString());
          return dbSnapshot.entityScore.toString(); // Return string content
        }
      } catch (err: any) {
        console.warn('[AIOrchestrator] DB step failed, continuing:', err.message);
      }

      // ── Step 3: RULE Check ───────────────────────────────────────────────────
      AIPipelineGuard.recordStep('RULE');
      if (!text || text.trim().length < 10) {
        console.log('[AIOrchestrator] Rule check failed: Content too short. Terminating pipeline.');
        AIPipelineGuard.recordExplicitFallback('Content failed rule-based length constraint.');
        throw new Error('AI execution rejected by RULE engine: content too short.');
      }

      // ── Step 4: GEMINI (Primary Core) ────────────────────────────────────────
      let startTime = Date.now();
      AIPipelineGuard.recordStep('GEMINI');
      try {
        if (!this.geminiClient) throw new Error("Gemini client is not configured");
        const res = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        await this.logCall('gemini', 'gemini-2.5-flash', 'enrichment', Date.now() - startTime, 'success');
        
        const output = res.text || null;
        if (output) {
          await this.aiCache.saveSnapshot(inputHash, output);
          await this.saveSnapshotToDb(inputHash, traceId, output);
          return output;
        }
      } catch (e: any) {
        console.log(`[AIOrchestrator] Gemini failed. Error:`, e.message);
        await this.logCall('gemini', 'gemini-2.5-flash', 'enrichment', Date.now() - startTime, 'error');
      }

      // ── Step 5: OPENROUTER (Aggregator Layer) ────────────────────────────────
      startTime = Date.now();
      AIPipelineGuard.recordStep('OPENROUTER');
      try {
        if (!this.openRouterClient) throw new Error("OpenRouter client is not configured");
        const res = await this.openRouterClient.chat.completions.create({
          model: 'anthropic/claude-3-haiku',
          messages: [{ role: 'user', content: prompt }]
        });
        await this.logCall('openrouter', 'anthropic/claude-3-haiku', 'enrichment', Date.now() - startTime, 'success');
        
        const output = res.choices[0].message.content;
        if (output) {
          await this.aiCache.saveSnapshot(inputHash, output);
          await this.saveSnapshotToDb(inputHash, traceId, output);
          return output;
        }
      } catch (e: any) {
        console.log(`[AIOrchestrator] OpenRouter failed. Error:`, e.message);
        await this.logCall('openrouter', 'anthropic/claude-3-haiku', 'enrichment', Date.now() - startTime, 'error');
      }

      // ── Step 6: CHATGPT (Tactical Fallback) ──────────────────────────────────
      startTime = Date.now();
      AIPipelineGuard.recordStep('CHATGPT');
      try {
        if (!this.openAIClient) throw new Error("ChatGPT client is not configured");
        const res = await this.openAIClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        });
        await this.logCall('chatgpt', 'gpt-4o-mini', 'enrichment', Date.now() - startTime, 'success');
        
        const output = res.choices[0].message.content;
        if (output) {
          await this.aiCache.saveSnapshot(inputHash, output);
          await this.saveSnapshotToDb(inputHash, traceId, output);
          return output;
        }
      } catch (e: any) {
        console.log(`[AIOrchestrator] ChatGPT failed. Error:`, e.message);
        await this.logCall('chatgpt', 'gpt-4o-mini', 'enrichment', Date.now() - startTime, 'error');
      }

      // ── Step 7: FALLBACK (Explicit rejection, no silent bypass) ──────────────
      AIPipelineGuard.recordExplicitFallback("All LLM providers and rule stages failed.");
      throw new Error(`[AI Invariant Failure] All execution layers exhausted without successful enrichment (reject_execution).`);
    });
  }

  private async saveSnapshotToDb(inputHash: string, traceId: string, output: string) {
    try {
      await prisma.intelligenceSnapshot.create({
        data: {
          inputHash,
          traceId,
          taskType: 'enrichment',
          modelUsed: 'gemini-2.5-flash',
          entityId: 'ai-orchestrator',
          entityScore: 1.0,
          attentionScore: 1.0,
          recommendationScore: 1.0,
          demandScore: 1.0,
          rankingScore: 1.0,
          integrityScore: 1.0,
          revenueScore: 1.0,
          compositeIntelligenceScore: 1.0
        }
      });
    } catch (err: any) {
      console.warn(`[AIOrchestrator] Failed to save IntelligenceSnapshot to DB:`, err.message);
    }
  }

  private async logCall(provider: string, model: string, taskType: string, latencyMs: number, status: string) {
    try {
      await prisma.lLMCallLog.create({
        data: {
          provider,
          model,
          taskType,
          latencyMs,
          status,
          cost: 0
        }
      });
    } catch (e) {
      console.error(`Failed to log LLM call:`, e);
    }
  }
}
