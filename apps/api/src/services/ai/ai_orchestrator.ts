import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { prisma } from '../../prisma';

export class AIOrchestrator {
  private geminiClient: GoogleGenAI | null = null;
  private openRouterClient: OpenAI | null = null;
  private openAIClient: OpenAI | null = null;

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
  }

  /**
   * Enriches content utilizing the Fallback Hierarchy: Gemini -> OpenRouter -> ChatGPT.
   */
  public async enrichContent(text: string): Promise<string | null> {
    const prompt = `Enrich this content by extracting key entities, generating an SEO summary, and analyzing its tone:\n\n${text}`;
    let startTime = Date.now();

    // 1. Attempt Gemini (Primary Core)
    try {
      if (!this.geminiClient) throw new Error("Gemini not configured");
      const res = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      await this.logCall('gemini', 'gemini-2.5-flash', 'enrichment', Date.now() - startTime, 'success');
      return res.text || null;
    } catch (e: any) {
      console.log(`[AIOrchestrator] Gemini failed, falling back to OpenRouter. Error:`, e.message);
      await this.logCall('gemini', 'gemini-2.5-flash', 'enrichment', Date.now() - startTime, 'error');
    }

    // 2. Attempt OpenRouter (Aggregator Layer)
    startTime = Date.now();
    try {
      if (!this.openRouterClient) throw new Error("OpenRouter not configured");
      const res = await this.openRouterClient.chat.completions.create({
        model: 'anthropic/claude-3-haiku', // Tactical fast model
        messages: [{ role: 'user', content: prompt }]
      });
      await this.logCall('openrouter', 'anthropic/claude-3-haiku', 'enrichment', Date.now() - startTime, 'success');
      return res.choices[0].message.content;
    } catch (e: any) {
      console.log(`[AIOrchestrator] OpenRouter failed, falling back to ChatGPT. Error:`, e.message);
      await this.logCall('openrouter', 'anthropic/claude-3-haiku', 'enrichment', Date.now() - startTime, 'error');
    }

    // 3. Attempt ChatGPT (Tactical Fallback)
    startTime = Date.now();
    try {
      if (!this.openAIClient) throw new Error("ChatGPT not configured");
      const res = await this.openAIClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      await this.logCall('chatgpt', 'gpt-4o-mini', 'enrichment', Date.now() - startTime, 'success');
      return res.choices[0].message.content;
    } catch (e: any) {
      console.log(`[AIOrchestrator] All LLMs failed for enrichment. Silent fallback applied. Error:`, e.message);
      await this.logCall('chatgpt', 'gpt-4o-mini', 'enrichment', Date.now() - startTime, 'error');
      return null; // Silent fallback: return null
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
          cost: 0 // Mock cost calculation for now
        }
      });
    } catch (e) {
      console.error(`Failed to log LLM call:`, e);
    }
  }
}
