import { TraceContext } from '../../shared/trace.context';
import type { Candidate } from './RecommendationCandidateGenerator';

export class RecommendationFilter {
  /** Remove candidates the user has already seen or that are below score threshold */
  filter(candidates: Candidate[], seenPostIds: Set<string>, minScore = 0.1, _context?: TraceContext): Candidate[] {
    return candidates.filter(c => !seenPostIds.has(c.postId) && c.score >= minScore);
  }
}
