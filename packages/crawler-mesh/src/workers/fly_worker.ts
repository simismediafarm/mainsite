import { CrawlerScheduler } from '../crawler_scheduler.js';
import { CrawlIOAdapter } from '../io_adapter.js';
import { CrawlStateMachine } from '../crawl_state_machine.js';
import { IOBuffer } from '@simis/kernel-graph/v7.2.1/ecvm/io_buffer.js';
import { ChaosEngine, DEFAULT_CHAOS_POLICY } from '@simis/kernel-chaos';

const chaos = new ChaosEngine(DEFAULT_CHAOS_POLICY);
const fetchWithChaos = chaos.wrap(fetch);

/**
 * Fly.io Live Ingestion Worker
 * Role: High throughput fetching, non-deterministic source of input.
 * Constraint: MUST ONLY WRITE TO IO BUFFER.
 */
export async function runFlyWorker() {
  const scheduler = new CrawlerScheduler();
  const workerId = `fly-${process.env.FLY_MACHINE_ID || 'local'}`;

  console.log(`[Fly Worker] Started with ID: ${workerId}`);

  while (true) {
    const job = await scheduler.claimNextJob(workerId);
    
    if (!job) {
      // Idle backoff
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    try {
      // Transition to FETCHING
      job.state = CrawlStateMachine.transition(job.state, 'START_FETCH');

      // Chaos-wrapped fetch
      const response = await fetchWithChaos(job.url);
      const rawHtml = await response.text();

      // Transition to PARSED
      job.state = CrawlStateMachine.transition(job.state, 'FETCH_SUCCESS');

      // MOCK PARSE: HTML to Markdown
      const parsedMarkdown = `[Markdown representation of ${job.url}]`;

      // Instantiate IOBuffer (normally done by ECVM pipeline, but workers instantiate a local proxy or send payload to Hono API)
      const ioBuffer = new IOBuffer(job.jobId, job.ecvmSeed, false, false); // For demonstration

      // Enqueue to IO Buffer
      CrawlIOAdapter.enqueueCrawlResult(ioBuffer, job, parsedMarkdown, 'fly.io');
      
      // Flush IO Buffer to persist intent to DB
      await ioBuffer.flush();

      // Note: State does not reach COMMITTED here. ECVM handles DECT validation & commit.
      console.log(`[Fly Worker] Job ${job.jobId} buffered successfully.`);

    } catch (err: any) {
      if (err.message.includes('429') || err.message.includes('timeout') || err.status === 429) {
        await scheduler.markJobDeferred(job.jobId, err.message);
      } else {
        await scheduler.markJobDlq(job.jobId, err.message);
      }
    }
  }
}

