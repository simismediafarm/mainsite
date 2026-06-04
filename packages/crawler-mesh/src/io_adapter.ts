import { CrawlJob } from './crawl_state_machine.js';
import { IOBuffer } from '@simis/kernel-graph/v7.2.1/ecvm/io_buffer.js';

export class CrawlIOAdapter {
  /**
   * Enqueues the parsed markdown result into the IO Buffer.
   * This is the ONLY allowed way for workers to commit data.
   */
  static enqueueCrawlResult(ioBuffer: IOBuffer, job: CrawlJob, parsedMarkdown: string, provenance: 'docker' | 'fly.io') {
    const payload = {
      type: 'crawl_result',
      jobId: job.jobId,
      payload: parsedMarkdown,
      provenance,
      state: 'buffered'
    };

    ioBuffer.enqueueWrite(payload, async () => {
      // In a real execution, the ECVM handles the actual commit logic.
      // The IOBuffer simply stores the payload deterministically.
      return payload;
    });
  }

  /**
   * Validates the buffered crawl result against DECT rules.
   * This would typically be called by the ECVM / DECT middleware before committing.
   */
  static validateCrawlResult(bufferedPayload: any): boolean {
    if (!bufferedPayload || bufferedPayload.type !== 'crawl_result') {
      return false;
    }
    
    // Check required fields
    if (!bufferedPayload.jobId || typeof bufferedPayload.payload !== 'string') {
      return false;
    }
    
    // DECT-specific validation logic goes here
    return true;
  }
}
