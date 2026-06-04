/**
 * personalization.ts — Semantic Embeddings and User Interest Recommendations
 */

import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { buildContentBlock, ContentBlockV2 } from './block_builder';

/**
 * Calls Gemini text-embedding-004 to generate a 768-dimension vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[PERSONALIZATION] GEMINI_API_KEY not configured — returning mock embedding vector');
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Embedding API returned HTTP ${response.status}`);
    }

    const data: any = await response.json();
    return data.embedding?.values ?? [];
  } catch (err: any) {
    console.error('[PERSONALIZATION] Embedding generation failed:', err.message);
    // Return empty or randomized fallback vector in sandbox/offline mode
    return new Array(768).fill(0);
  }
}

/**
 * Searches contents semantically using pgvector matching RPC
 */
export async function semanticSearch(query: string, limit = 10): Promise<ContentBlockV2[]> {
  const embedding = await generateEmbedding(query);
  const supabase = getSupabase();
  
  const { data: matches, error } = await supabase.rpc('match_content_embeddings', {
    query_embedding: embedding,
    match_threshold: 0.2, // loose match threshold
    match_count: limit
  });

  if (error || !matches || matches.length === 0) {
    if (error) console.error('[PERSONALIZATION] match_content_embeddings error:', error.message);
    return [];
  }

  const ids = matches.map((m: any) => m.content_id);
  const { data: rows } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .in('id', ids)
    .eq('status', 'published');

  if (!rows) return [];

  // Sort rows based on matches similarity order
  return matches
    .map((match: any) => {
      const row = rows.find((r: any) => r.id === match.content_id);
      return row ? buildContentBlock(row) : null;
    })
    .filter(Boolean) as ContentBlockV2[];
}

/**
 * Generates personalized feed recommendation using user tags
 */
export async function getPersonalizedFeed(userId: string | null, limit = 10): Promise<ContentBlockV2[]> {
  const supabase = getSupabase();

  let preferredTags: string[] = [];

  if (userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('interest_tags')
      .eq('user_id', userId)
      .single();
    if (profile?.interest_tags) {
      preferredTags = profile.interest_tags;
    }
  }

  // Fetch all published contents
  const { data: rows, error } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit * 2); // fetch slightly more items to rank

  if (error || !rows) return [];

  const items = rows.map(buildContentBlock);

  // Boost score based on user tag affinity
  if (preferredTags.length > 0) {
    items.forEach(item => {
      const commonTags = item.metadata.tags.filter(t => preferredTags.includes(t));
      if (commonTags.length > 0) {
        // Boost final score by 15% per matching tag (capped at 50% max boost)
        const boost = Math.min(0.50, commonTags.length * 0.15);
        item.ranking.score = item.ranking.score * (1 + boost);
      }
    });
  }

  // Sort by boosted ranking score
  return items.sort((a, b) => b.ranking.score - a.ranking.score).slice(0, limit);
}
