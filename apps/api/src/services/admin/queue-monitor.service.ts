import { prisma } from '../../prisma';

export interface QueueSnapshot {
  name: string;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  dlqDepth: number;
  oldestPendingAgeMs: number | null;
}

export class QueueMonitorService {
  async getSnapshot(): Promise<QueueSnapshot[]> {
    const [counts, oldest] = await Promise.all([
      prisma.eventQueueLog.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.eventQueueLog.findFirst({
        where: { status: { in: ['QUEUED', 'PROCESSING'] } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);

    const get = (status: string) =>
      counts.find((c: { status: string; _count: { status: number } }) => c.status === status)?._count.status ?? 0;

    const failed = get('FAILED');
    const oldestAgeMs = oldest ? Date.now() - oldest.createdAt.getTime() : null;

    // Single logical queue backed by EventQueueLog
    return [
      {
        name: 'simis:event-queue',
        queued: get('QUEUED'),
        processing: get('PROCESSING'),
        completed: get('COMPLETED'),
        failed,
        dlqDepth: failed,
        oldestPendingAgeMs: oldestAgeMs,
      },
    ];
  }

  async isHealthy(): Promise<boolean> {
    const snapshots = await this.getSnapshot();
    return snapshots.every(q => q.failed < 50 && (q.oldestPendingAgeMs ?? 0) < 300_000);
  }
}
