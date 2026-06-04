import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function streamDBSchema() {
  const { data, error } = await supabase.rpc("introspect_schema");

  if (error) {
    console.error("DB Introspection failed:", error.message);
    return [];
  }

  return data.map((table: any) => ({
    type: "DB_SCHEMA",
    table: table.table_name,
    columns: table.columns,
    constraints: table.constraints,
  }));
}
