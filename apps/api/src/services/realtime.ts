import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';

const clients: Set<any> = new Set();

export function registerSSEClient(stream: any) {
  clients.add(stream);
  stream.onAbort(() => {
    clients.delete(stream);
  });
}

function broadcast(event: string, payload: any) {
  for (const client of clients) {
    client.writeSSE({
      event,
      data: JSON.stringify(payload),
    }).catch(() => {
      clients.delete(client);
    });
  }
}

export function setupRealtimeBridge() {
  const supabase = getSupabase();

  console.log('[REALTIME] Setting up Supabase SSE bridge...');

  supabase
    .channel('kernel-events')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'kernel_intent_registry' },
      (payload) => {
        broadcast('intent.created', payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'kernel_intent_registry' },
      (payload) => {
        if (payload.new.status === 'COMPLETED') {
          broadcast('intent.completed', payload.new);
        } else if (payload.new.status === 'FAILED') {
          broadcast('intent.failed', payload.new);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'kernel_dect_violations' },
      (payload) => {
        broadcast('dect.violation', payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'kernel_execution_certificates' },
      (payload) => {
        broadcast('poe.issued', payload.new);
      }
    )
    .subscribe();
}
