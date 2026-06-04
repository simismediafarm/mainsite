import { getSupabase } from '../executor/kernelExecutor';

export const dbAdapter = {
  getClient: getSupabase,
  query: async (queryText: string, params: any[] = []) => {
    const supabase = getSupabase();
    // Uses Supabase RPC to execute raw SQL (requires run_raw_sql function on the database)
    const { data, error } = await supabase.rpc('run_raw_sql', { query_text: queryText, query_params: params });
    if (error) {
      console.error('[DB ADAPTER] Raw SQL query failed:', error.message);
      throw error;
    }
    return { rows: data || [] };
  }
};
