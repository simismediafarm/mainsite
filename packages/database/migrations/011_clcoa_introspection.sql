-- 011_clcoa_introspection.sql
CREATE OR REPLACE FUNCTION introspect_schema()
RETURNS TABLE (
  table_name text,
  columns jsonb,
  constraints jsonb
)
LANGUAGE sql AS $$
  SELECT
    t.table_name::text,
    jsonb_agg(c.column_name::text) as columns,
    jsonb_agg(tc.constraint_type::text) as constraints
  FROM information_schema.tables t
  JOIN information_schema.columns c ON c.table_name = t.table_name
  LEFT JOIN information_schema.table_constraints tc ON tc.table_name = t.table_name
  WHERE t.table_schema = 'public'
  GROUP BY t.table_name;
$$;
