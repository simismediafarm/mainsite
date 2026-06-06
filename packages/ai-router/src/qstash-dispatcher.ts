import { Client } from '@upstash/qstash';
import { SimisEventSchemaV4, SimisEventV4 } from '@simis/shared';

export class QStashDispatcher {
  private client: Client;

  constructor(token: string = process.env.QSTASH_TOKEN || '') {
    if (!token) {
      console.warn("QSTASH_TOKEN is missing. QStashDispatcher will fail if events are emitted.");
    }
    this.client = new Client({ token });
  }

  /**
   * Dispatches a strictly validated SIMIS Event V4 to QStash.
   */
  async dispatchEvent(event: SimisEventV4, targetUrl?: string): Promise<string> {
    // 1. Strict Schema Validation (Fail Closed)
    const parseResult = SimisEventSchemaV4.safeParse(event);
    if (!parseResult.success) {
      throw new Error(`EVENT_CONTRACT_VIOLATION: Event does not conform to SIMIS_EVENT_SCHEMA_V4. Errors: ${parseResult.error.message}`);
    }

    // 2. Resolve Target URL
    const destination = targetUrl || process.env.RENDER_WORKER_URL;
    if (!destination) {
      throw new Error("RENDER_WORKER_URL not configured in ENV.");
    }

    // 3. Dispatch to QStash
    const response = await this.client.publishJSON({
      url: destination,
      body: parseResult.data,
      // Optional: retries and delays could be configured here
      retries: 3
    });

    return response.messageId;
  }
}
