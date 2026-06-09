import { TraceContext } from '../../shared/trace.context';
import type { Candidate } from './RecommendationCandidateGenerator';

export class RecommendationRanker {
  /** Sort candidates by score descending, return top N */
  rank(candidates: Candidate[], topN = 20, _context?: TraceContext): Candidate[] {
    return [...candidates].sort((a, b) => b.score - a.score).slice(0, topN);
  }
}
