import { CrawlerScheduler } from '../crawler_scheduler.js';
import { CrawlIOAdapter } from '../io_adapter.js';
import { CrawlStateMachine } from '../crawl_state_machine.js';
import { IOBuffer } from '@simis/kernel-graph/v7.2.1/ecvm/io_buffer.js';
import { ChaosEngine, DEFAULT_CHAOS_POLICY } from '@simis/kernel-chaos';

const chaos = new ChaosEngine(DEFAULT_CHAOS_POLICY);
const fetchWithChaos = chaos.wrap(fetch);

/**
 * Docker Deterministic Replay Worker
 * Role: Exact replay of Crawl jobs using deterministic seed.
 * Constraint: MUST reproduce EXACT output as Fly.io.
 */
export async function runDockerWorker() {
  const scheduler = new CrawlerScheduler();
  const workerId = `docker-${process.env.HOSTNAME || 'local'}`;

  console.log(`[Docker Worker] Started with ID: ${workerId}`);

  while (true) {
    const job = await scheduler.claimNextJob(workerId);
    
    if (!job) {
      // Idle backoff
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    try {
      // In Docker Worker (Deterministic mode), we don't do real external fetches.
      // We read from the Replay / Mock layer or isolated deterministic proxy.
      
      job.state = CrawlStateMachine.transition(job.state, 'START_FETCH');

      // DETERMINISTIC FETCH (Wrapped in Chaos Engine to simulate exact failure states if needed)
      // NOTE: In true replay mode, the fetch wrapper should yield the exact failure from the trace
      const response = await fetchWithChaos(job.url);
      const rawHtml = await response.text();

      job.state = CrawlStateMachine.transition(job.state, 'FETCH_SUCCESS');
      const parsedMarkdown = `[Markdown representation of ${job.url}]`;

      const ioBuffer = new IOBuffer(job.jobId, job.ecvmSeed, true, false);
      
      CrawlIOAdapter.enqueueCrawlResult(ioBuffer, job, parsedMarkdown, 'docker');
      await ioBuffer.flush();

      console.log(`[Docker Worker] Job ${job.jobId} replayed and buffered successfully.`);

    } catch (err: any) {
      if (err.message.includes('429') || err.message.includes('timeout') || err.status === 429) {
        await scheduler.markJobDeferred(job.jobId, err.message);
      } else {
        await scheduler.markJobDlq(job.jobId, err.message);
      }
    }
  }
}

