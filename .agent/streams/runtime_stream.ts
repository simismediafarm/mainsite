import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function streamKernelLogs() {
  const { data, error } = await supabase
    .from("kernel_execution_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Kernel log stream failed:", error.message);
    return [];
  }

  return data.map((log: any) => ({
    type: "RUNTIME_EVENT",
    intent_id: log.intent_id,
    syscall: log.syscall,
    status: log.status,
    trace_id: log.trace_id,
    created_at: log.created_at,
  }));
}
