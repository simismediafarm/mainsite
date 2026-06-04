import { ContentBlockV2 } from '../block_builder';

export interface FreshnessJob {
  contentId: string;
  slug: string;
  ageDays: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class FreshnessScheduler {
  /**
   * Evaluates content ages and schedules updates for outdated pages to boost ranking freshness.
   */
  static checkFreshnessDecay(pool: ContentBlockV2[]): FreshnessJob[] {
    const jobs: FreshnessJob[] = [];

    for (const article of pool) {
      if (article.status !== 'published') continue;

      const updatedDate = article.execution_lock.expires_at 
        ? new Date(article.execution_lock.expires_at) 
        : new Date();
      
      const elapsedMs = Date.now() - updatedDate.getTime();
      const ageDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

      if (ageDays >= 30) {
        let priority: FreshnessJob['priority'] = 'LOW';
        if (ageDays >= 180) {
          priority = 'HIGH';
        } else if (ageDays >= 90) {
          priority = 'MEDIUM';
        }

        jobs.push({
          contentId: article.id,
          slug: article.slug,
          ageDays,
          priority
        });
      }
    }

    return jobs;
  }
}
