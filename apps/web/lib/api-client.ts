/**
 * Centralized API client for all fetch calls in apps/web.
 * Features: typed responses, Zod validation, retry with exponential backoff, timeout.
 */
import { z } from 'zod';
import { env } from './env';

// ── Core HTTP client ─────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;

async function request<T>(
  url: string,
  options: RequestInit & { schema?: z.ZodType<T>; retries?: number; timeoutMs?: number } = {}
): Promise<T> {
  const { schema, retries = DEFAULT_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  let lastError: Error = new Error('Request failed');

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
        signal: controller.signal,
        ...fetchOptions,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText })) as Record<string, unknown>;
        throw new Error(typeof body['error'] === 'string' ? body['error'] : `HTTP ${res.status}`);
      }

      const data = await res.json() as unknown;
      return schema ? schema.parse(data) : (data as T);
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on validation or 4xx errors
      if (err instanceof z.ZodError) throw err;
      if (lastError.message.startsWith('HTTP 4')) throw lastError;

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

// ── Response schemas (Zod) ────────────────────────────────────────────────────

const PostLikeResponse = z.object({ post: z.object({ likes: z.number().int().nonnegative() }) });
const FeedResponse = z.object({ posts: z.array(z.unknown()) });
const AdsAuctionResponse = z.object({
  results: z.array(z.object({
    slot: z.string(),
    winningBidder: z.string(),
    winningBidValue: z.number(),
  })),
});
const DealsResponse = z.object({ items: z.array(z.unknown()) });

// ── Typed API surface ─────────────────────────────────────────────────────────

export const apiClient = {
  // Posts
  likePost: (id: string) =>
    request(`/api/mvp/post/${id}/like`, { method: 'POST', schema: PostLikeResponse }),

  viewPost: (id: string) =>
    fetch(`/api/mvp/post/${id}/view`, { method: 'POST' }).catch(() => null),

  createPost: (body: { content: string; authorId: string }) =>
    request<unknown>('/api/mvp/posts', { method: 'POST', body: JSON.stringify(body) }),

  getFeed: () =>
    request('/api/mvp/feed', { schema: FeedResponse }),

  getTrendingTags: () =>
    request<{ tags: string[] }>('/api/mvp/tags/trending').catch(() => ({ tags: [] })),

  // Ads
  runAuction: (postId: string, slots: string[]) =>
    request('/api/mvp/ads/auction/run', {
      method: 'POST',
      body: JSON.stringify({ postId, slots }),
      schema: AdsAuctionResponse,
    }),

  recordAdClick: (postId: string) =>
    fetch(`/api/mvp/ads/click/${postId}`, { method: 'POST' }).catch(() => null),

  // Deals
  getDeals: () =>
    request('/api/mvp/deals', { schema: DealsResponse }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    request<unknown>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
