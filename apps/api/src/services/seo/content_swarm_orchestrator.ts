import pLimit from 'p-limit';
import { SEOClusterSwarm, KeywordCluster } from './seo_cluster_swarm';
import { LinkGraphEngine } from './link_graph_engine';
import { DiscoverOptimizer } from './discover_optimizer';
import { FreshnessScheduler } from './freshness_scheduler';
import { ContentBlockV2 } from '../block_builder';

export interface SwarmTaskResult {
  keyword: string;
  status: 'draft_created' | 'refresh_queued' | 'skipped_cannibalization';
  title?: string;
}

export class ContentSwarmOrchestrator {
  private static readonly MAX_CONCURRENCY = 3;

  /**
   * Runs the autonomous swarm execution loop across keyword clusters and existing posts.
   */
  static async runSwarmCycle(
    clusters: KeywordCluster[], 
    existingPool: ContentBlockV2[]
  ): Promise<SwarmTaskResult[]> {
    const limit = pLimit(this.MAX_CONCURRENCY);
    const results: SwarmTaskResult[] = [];

    // 1. Process keyword clusters (SEO / Content Agent)
    const clusterPromises = clusters.map(cluster => 
      limit(async (): Promise<SwarmTaskResult> => {
        const suggestions = SEOClusterSwarm.processCluster(cluster, existingPool);
        
        if (suggestions.length === 0) {
          return {
            keyword: cluster.rootKeyword,
            status: 'skipped_cannibalization'
          };
        }

        const primarySuggestion = suggestions[0];
        // In real execution, this suggestion would be converted into a ContentBlockV2 database row (draft/staged)
        return {
          keyword: cluster.rootKeyword,
          status: 'draft_created',
          title: primarySuggestion.title
        };
      })
    );

    // 2. Freshness Refresh triggers (Refresh Agent)
    const freshnessJobs = FreshnessScheduler.checkFreshnessDecay(existingPool);
    const refreshPromises = freshnessJobs.map(job =>
      limit(async (): Promise<SwarmTaskResult> => {
        // Find article to refresh and boost layout variant to discover optimized
        const article = existingPool.find(p => p.id === job.contentId);
        if (article) {
          DiscoverOptimizer.optimize(article);
          LinkGraphEngine.optimizeLinks(article, existingPool);
        }
        return {
          keyword: job.slug,
          status: 'refresh_queued',
          title: article?.title
        };
      })
    );

    const outputs = await Promise.all([...clusterPromises, ...refreshPromises]);
    results.push(...outputs);

    return results;
  }
}
