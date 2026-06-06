export function checkDbInvariant() {
  const databaseUrl = process.env.DATABASE_URL || '';

  // 1. Verify DATABASE_URL exists and contains postgres
  if (!databaseUrl) {
    throw new Error('[DB Invariant Violation] DATABASE_URL is not set.');
  }

  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error(`[DB Invariant Violation] Invalid database connection protocol. Only PostgreSQL (Supabase) is allowed as single source of truth. Got: "${databaseUrl.split(':')[0]}"`);
  }

  // 2. Prevent SQLite / file-based databases in configuration
  const forbiddenKeywords = ['sqlite', 'better-sqlite3', 'dev.db', 'file:'];
  for (const keyword of forbiddenKeywords) {
    if (databaseUrl.includes(keyword)) {
      throw new Error(`[DB Invariant Violation] File-based or SQLite database configuration detected. This is strictly forbidden in the SIMIS production path.`);
    }
  }
}
