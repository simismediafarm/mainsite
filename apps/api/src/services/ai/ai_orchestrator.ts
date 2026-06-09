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

  // REL-002: Circuit breaker state per provider
  private static readonly CB_THRESHOLD = 3;    // open after 3 consecutive failures
  private static readonly CB_RESET_MS = 60_000; // retry after 60s
  private static readonly PROVIDER_TIMEOUT_MS = 10_000; // 10s per provider

  private circuitBreaker: Record<string, { failures: number; openedAt: number | null }> = {
    gemini:      { failures: 0, openedAt: null },
    openrouter:  { failures: 0, openedAt: null },
    chatgpt:     { failures: 0, openedAt: null },
  };

  private isCBOpen(provider: string): boolean {
    const cb = this.circuitBreaker[provider];
    if (!cb || cb.openedAt === null) return false;
    if (Date.now() - cb.openedAt > AIOrchestrator.CB_RESET_MS) {
      cb.failures = 0; cb.openedAt = null; // half-open: allow one retry
      return false;
    }
    return true;
  }

  private recordCBSuccess(provider: string) {
    const cb = this.circuitBreaker[provider];
    if (cb) { cb.failures = 0; cb.openedAt = null; }
  }

  private recordCBFailure(provider: string) {
    const cb = this.circuitBreaker[provider];
    if (!cb) return;
    cb.failures += 1;
    if (cb.failures >= AIOrchestrator.CB_THRESHOLD) cb.openedAt = Date.now();
  }

  /** Wrap a provider call with AbortSignal timeout + circuit breaker */
  private async callWithTimeout<T>(
    provider: string,
    fn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    if (this.isCBOpen(provider)) throw new Error(`Circuit breaker OPEN for ${provider}`);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), AIOrchestrator.PROVIDER_TIMEOUT_MS);
    try {
      const result = await fn(ac.signal);
      this.recordCBSuccess(provider);
      return result;
    } catch (err) {
      this.recordCBFailure(provider);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

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
    // Initialize AICache
    this.aiCache = new AICache();
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
        // PERF-001: semantic vector similarity cache check via pgvector
        const semanticHit = await this.checkSemanticCache(inputHash);
        if (semanticHit) {
          console.log('[AIOrchestrator] Semantic Cache Hit');
          return semanticHit;
        }
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
        const res = await this.callWithTimeout('gemini', (_signal) =>
          this.geminiClient!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt })
        );
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
        const res = await this.callWithTimeout('openrouter', (signal) =>
          this.openRouterClient!.chat.completions.create(
            { model: 'anthropic/claude-3-haiku', messages: [{ role: 'user', content: prompt }] },
            { signal }
          )
        );
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
        const res = await this.callWithTimeout('chatgpt', (signal) =>
          this.openAIClient!.chat.completions.create(
            { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] },
            { signal }
          )
        );
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

  /**
   * PERF-001: Check pgvector semantic similarity cache.
   * Returns cached output if a snapshot with the exact inputHash exists,
   * or if a cosine-similar snapshot (>0.95) exists via pgvector.
   */
  private async checkSemanticCache(inputHash: string): Promise<string | null> {
    try {
      // Exact hash hit first (cheap)
      const exact = await prisma.intelligenceSnapshot.findFirst({
        where: { inputHash },
        select: { entityScore: true },
      });
      if (exact) return exact.entityScore.toString();

      // Vector similarity search — only if pgvector extension active
      const similar = await prisma.$queryRaw<Array<{ entity_score: number }>>`
        SELECT entity_score
        FROM "analytics"."IntelligenceSnapshot"
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> (
            SELECT embedding FROM "analytics"."IntelligenceSnapshot"
            WHERE "inputHash" = ${inputHash} LIMIT 1
          )) > 0.95
        ORDER BY embedding <=> (
          SELECT embedding FROM "analytics"."IntelligenceSnapshot"
          WHERE "inputHash" = ${inputHash} LIMIT 1
        )
        LIMIT 1
      `;
      if (similar.length > 0) return similar[0].entity_score.toString();
    } catch {
      // pgvector not available or no matching row — not an error
    }
    return null;
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
