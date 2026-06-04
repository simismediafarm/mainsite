export type CrawlState =
  | 'PENDING'
  | 'CLAIMED'
  | 'FETCHING'
  | 'PARSED'
  | 'BUFFERED'
  | 'VALIDATED'
  | 'COMMITTED'
  | 'DEFERRED'
  | 'DLQ';

export interface CrawlJob {
  jobId: string;
  url: string;
  depth: number;
  ecvmSeed: string;
  state: CrawlState;
  retryCount: number;
}

export class CrawlStateMachine {
  static transition(current: CrawlState, event: string): CrawlState {
    switch (current) {
      case 'PENDING':
        return event === 'CLAIM' ? 'CLAIMED' : current;
      case 'CLAIMED':
        return event === 'START_FETCH' ? 'FETCHING' : current;
      case 'FETCHING':
        if (event === 'FETCH_SUCCESS') return 'PARSED';
        if (event === 'RATE_LIMIT' || event === 'NETWORK_ERROR') return 'DEFERRED';
        if (event === 'PARSE_ERROR') return 'DLQ';
        return current;
      case 'PARSED':
        return event === 'ENQUEUE_IO' ? 'BUFFERED' : current;
      case 'BUFFERED':
        return event === 'DECT_PASS' ? 'VALIDATED' : current;
      case 'VALIDATED':
        return event === 'ECVM_COMMIT' ? 'COMMITTED' : current;
      case 'DEFERRED':
        return event === 'RETRY' ? 'CLAIMED' : current;
      case 'DLQ':
        return event === 'MANUAL_RETRY' ? 'CLAIMED' : current;
      default:
        return current;
    }
  }

  static generateJobId(url: string, depth: number, ecvmSeed: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${url}:${depth}:${ecvmSeed}`)
      .digest('hex');
  }
}
