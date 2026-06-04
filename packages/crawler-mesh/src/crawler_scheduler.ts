import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CrawlJob, CrawlStateMachine } from './crawl_state_machine.js';

export class CrawlerScheduler {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.supabase = createClient(url, key);
  }

  /**
   * Polls the queue using SKIP LOCKED semantics.
   */
  async claimNextJob(workerId: string): Promise<CrawlJob | null> {
    // Note: In Supabase/Postgres, this would typically invoke a Postgres function
    // (e.g. `rpc('claim_crawl_job')`) that implements SELECT ... FOR UPDATE SKIP LOCKED.
    const { data, error } = await this.supabase.rpc('claim_crawl_job', { p_worker_id: workerId });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      jobId: row.job_id,
      url: row.url,
      depth: row.depth,
      ecvmSeed: row.ecvm_seed,
      state: CrawlStateMachine.transition('PENDING', 'CLAIM'), // Transitions to CLAIMED
      retryCount: row.retry_count || 0
    };
  }

  async markJobDeferred(jobId: string, reason: string) {
    await this.supabase.from('crawl_jobs').update({
      state: 'DEFERRED',
      last_error: reason
    }).eq('job_id', jobId);
  }

  async markJobDlq(jobId: string, reason: string) {
    await this.supabase.from('crawl_jobs').update({
      state: 'DLQ',
      last_error: reason
    }).eq('job_id', jobId);
  }
}
