function hash(data: any): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function compare(t: any[], e: any[]): boolean {
  return t.length === e.length; 
}

export async function correlateTrace(intent_id: string) {
  const traces: any[] = [];
  const execution = { rows: [] };

  return {
    intent_id,
    trace_count: traces.length,
    execution_count: execution.rows.length,

    trace_hash: hash(traces),
    execution_hash: hash(execution.rows),

    aligned: compare(traces, execution.rows)
  };
}
