/**
 * Centralized API client for all fetch calls in apps/web.
 */
import { env } from './env';

const BASE = env.NEXT_PUBLIC_KERNEL_API_URL;

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  // Posts
  likePost: (id: string) =>
    request<{ post: { likes: number } }>(`/api/mvp/post/${id}/like`, { method: 'POST' }),

  viewPost: (id: string) =>
    fetch(`/api/mvp/post/${id}/view`, { method: 'POST' }).catch(console.error),

  createPost: (body: { content: string; authorId: string }) =>
    request<unknown>('/api/mvp/posts', { method: 'POST', body: JSON.stringify(body) }),

  getFeed: () =>
    request<{ posts: unknown[] }>('/api/mvp/feed'),

  // Ads
  runAuction: (postId: string, slots: string[]) =>
    request<{ results: Array<{ slot: string; winningBidder: string; winningBidValue: number }> }>(
      '/api/mvp/ads/auction/run',
      { method: 'POST', body: JSON.stringify({ postId, slots }) }
    ),

  recordAdClick: (postId: string) =>
    fetch(`/api/mvp/ads/click/${postId}`, { method: 'POST' }).catch(console.error),

  // Deals
  getDeals: () =>
    request<{ items: unknown[] }>(`${BASE}/api/v2/deals`),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    request<unknown>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
