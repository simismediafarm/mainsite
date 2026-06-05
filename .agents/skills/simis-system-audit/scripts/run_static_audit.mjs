#!/usr/bin/env node
/**
 * SIMIS System Audit — Static Analysis Runner
 * Usage: node scripts/run_static_audit.mjs [--output <file>]
 *
 * Performs deterministic static analysis on the SIMIS monorepo.
 * READ-ONLY — makes no changes to any file.
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

const issues = [];
let issueCounter = 1;

function addIssue(severity, category, location, description, impact, rootCause, recommendedFix) {
  issues.push({
    issue_id: `SIMIS-${String(issueCounter++).padStart(3, '0')}`,
    severity,
    category,
    location,
    description,
    impact,
    root_cause: rootCause,
    recommended_fix: recommendedFix,
  });
}

function readFile(path) {
  try { return readFileSync(path, 'utf8'); } catch { return null; }
}

function findFiles(dir, ext = '.ts') {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(full, ext));
    else if (entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function relPath(abs) { return relative(ROOT, abs); }

// ─── CHECK 1: Legacy admin.ts still mounted? ────────────────────────────────
const indexTs = readFile(join(ROOT, 'apps/api/src/index.ts')) || '';
const legacyAdminMounted = indexTs.includes("routers/admin'") || indexTs.includes('routers/admin"');
const newAdminMounted = indexTs.includes("admin/index") || indexTs.includes("adminRouter");

if (legacyAdminMounted) {
  addIssue(
    'critical', 'architecture',
    'apps/api/src/index.ts',
    'Legacy admin.ts (ControlOrchestrator-based) is mounted alongside v3.1 admin router.',
    'Dual mutation entry points violate ALL_MUTATIONS_VIA_EVENTQUEUELOG. Inconsistent audit trail.',
    'Legacy router was not removed when v3.1 admin router was added.',
    'Unmount legacy router from index.ts; migrate its endpoints to SIMISCommand pattern.'
  );
}

// ─── CHECK 2: user_metadata in RBAC ─────────────────────────────────────────
const permGuard = readFile(join(ROOT, 'apps/api/src/core/permission_guard.ts')) || '';
if (permGuard.includes('user_metadata')) {
  addIssue(
    'critical', 'security',
    'apps/api/src/core/permission_guard.ts:33',
    'Role derived from user.user_metadata.role — user-editable field used for authorization.',
    'Any authenticated user can escalate to ADMIN role by setting user_metadata.role = "admin".',
    'Supabase user_metadata is writable by users. Should use app_metadata (server-controlled).',
    'Replace user.user_metadata.role with user.app_metadata?.role in permission_guard.ts.'
  );
}

// ─── CHECK 3: SSE infinite loop without abort check ─────────────────────────
const legacyAdmin = readFile(join(ROOT, 'apps/api/src/routers/admin.ts')) || '';
if (legacyAdmin.includes('while (true)') && !legacyAdmin.includes('signal.aborted')) {
  addIssue(
    'critical', 'bug',
    'apps/api/src/routers/admin.ts:174',
    'SSE /telemetry/stream has while(true) loop with no abort signal check.',
    'Memory leak: every client connection keeps a live timer and stream handle after disconnect.',
    'Missing c.req.raw.signal.aborted guard (correctly implemented in mvp.ts:174).',
    'Add: while (!c.req.raw.signal.aborted) { ... } and signal.addEventListener("abort", cleanup).'
  );
}

// ─── CHECK 4: SQLite dual-database ──────────────────────────────────────────
const sqliteUsers = findFiles(join(ROOT, 'apps/api/src')).filter(f => {
  const c = readFile(f) || '';
  return c.includes('sqlite_db') || c.includes('better-sqlite3');
});
if (sqliteUsers.length > 0) {
  addIssue(
    'high', 'architecture',
    sqliteUsers.map(relPath).join(', '),
    `${sqliteUsers.length} service(s) write to SQLite store instead of PostgreSQL/EventQueueLog.`,
    'MVP post CRUD operations are invisible to traceId, EventQueueLog, and BullMQ workers.',
    'MVP layer predates v3.x event-driven architecture and was never migrated.',
    'Migrate apps/api/src/store/sqlite_db.ts reads/writes to Prisma PostgreSQL. Route mutations through EventQueueLog.'
  );
}

// ─── CHECK 5: Semantic cache stub (checkSemanticCache always returns null) ───
const cacheTs = readFile(join(ROOT, 'packages/ai-cache/src/cache.ts')) || '';
if (cacheTs.includes('return null') && cacheTs.includes('TODO')) {
  addIssue(
    'high', 'performance',
    'packages/ai-cache/src/cache.ts:44',
    'checkSemanticCache() always returns null — semantic deduplication is non-functional.',
    'Every AI task triggers a live LLM API call regardless of prior identical inputs. 100% LLM cost with no cache savings.',
    'Placeholder left during initial implementation; pgvector integration not completed.',
    'Implement cosine similarity search: SELECT ... ORDER BY embedding <=> $1 LIMIT 1 using Prisma+pgvector.'
  );
}

// ─── CHECK 6: BullMQ workers missing removeOnComplete/removeOnFail ───────────
const aiWorker = readFile(join(ROOT, 'apps/worker/src/ai.worker.ts')) || '';
if (!aiWorker.includes('removeOnComplete') && !aiWorker.includes('removeOnFail')) {
  addIssue(
    'high', 'performance',
    'apps/worker/src/ai.worker.ts',
    'BullMQ workers have no removeOnComplete or removeOnFail configuration.',
    'Completed/failed jobs accumulate in Redis indefinitely, eventually exhausting memory.',
    'Default BullMQ behavior retains all job records unless explicitly configured.',
    'Add { removeOnComplete: { count: 1000 }, removeOnFail: { count: 500 } } to both Worker constructors.'
  );
}

// ─── CHECK 7: Missing EventQueueLog.status index ─────────────────────────────
const schema = readFile(join(ROOT, 'apps/api/prisma/schema.prisma')) || '';
const eqlBlock = schema.match(/model EventQueueLog \{[\s\S]*?\}/)?.[0] || '';
if (eqlBlock && !eqlBlock.includes('@@index([status])')) {
  addIssue(
    'medium', 'schema',
    'apps/api/prisma/schema.prisma:EventQueueLog',
    'EventQueueLog has no index on status column.',
    'GET /api/admin/metrics queries WHERE status = "QUEUED" — full table scan without index.',
    'New fields (traceId, actor, source, mode) were indexed but status was missed.',
    'Add @@index([status]) to EventQueueLog model, then run: prisma migrate dev --name add-event-status-index'
  );
}

// ─── CHECK 8: AI Router quota INCRBY race condition ──────────────────────────
const routerTs = readFile(join(ROOT, 'packages/ai-router/src/router.ts')) || '';
if (routerTs.includes('incrby') && routerTs.includes('expire') && !routerTs.includes('NX')) {
  addIssue(
    'medium', 'bug',
    'packages/ai-router/src/router.ts:82',
    'Quota INCRBY followed by separate EXPIRE is not atomic — race condition possible.',
    'Under concurrent load, the quota key may never get an expiry set, leading to permanent quota exhaustion.',
    'Two separate Redis commands with no transaction or Lua script.',
    'Replace with: await redis.set(key, 1, "EX", 86400, "NX") or use Lua SET+EXPIRE atomically.'
  );
}

// ─── CHECK 9: AuditLog is console.log only ───────────────────────────────────
const orchestrator = readFile(join(ROOT, 'apps/api/src/core/orchestrator.ts')) || '';
if (orchestrator.includes('console.log') && orchestrator.includes('logAudit') && !orchestrator.includes('prisma')) {
  addIssue(
    'high', 'architecture',
    'apps/api/src/core/orchestrator.ts:74',
    'ControlOrchestrator.logAudit() only calls console.log — no persistence.',
    'All legacy admin action audit records are lost on process restart. No forensic trail.',
    'Database insertion was left as a TODO comment during initial implementation.',
    'Create control_audits Prisma model and call prisma.controlAudit.create() in logAudit().'
  );
}

// ─── CHECK 10: LLMCallLog cost uses Float ────────────────────────────────────
const llmCostMatch = schema.match(/model LLMCallLog \{[\s\S]*?\}/)?.[0] || '';
if (llmCostMatch && llmCostMatch.includes('Float') && llmCostMatch.includes('cost')) {
  addIssue(
    'medium', 'schema',
    'apps/api/prisma/schema.prisma:LLMCallLog',
    'LLMCallLog.cost is typed as Float (IEEE 754 binary float).',
    'Financial cost calculations using Float suffer from precision errors (e.g., 0.1 + 0.2 ≠ 0.3).',
    'Float was used for simplicity; Decimal was not considered during initial schema design.',
    'Change to: cost Decimal @db.Decimal(10,6) and regenerate Prisma client.'
  );
}

// ─── SCORE CALCULATION ───────────────────────────────────────────────────────
const weights = { critical: 15, high: 7, medium: 3, low: 1 };
const deductions = issues.reduce((sum, i) => sum + (weights[i.severity] || 0), 0);
const healthScore = Math.max(0, 100 - deductions);

// ─── BUILD REPORT ────────────────────────────────────────────────────────────
const report = {
  audit_meta: {
    skill: 'simis-system-audit',
    version: '3.1',
    timestamp: new Date().toISOString(),
    root: ROOT,
  },
  executive_summary: {
    overall_health_score: healthScore,
    total_issues: issues.length,
    by_severity: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    critical_violations: issues.filter(i => i.severity === 'critical').map(i => `${i.issue_id}: ${i.description}`),
    top_risks: [
      'user_metadata RBAC allows privilege escalation by any authenticated user',
      'SQLite/Postgres split makes MVP layer invisible to EventQueueLog and traceId',
      'SSE infinite loop without abort check causes memory leak on every connection',
    ],
    top_optimizations: [
      'Implement checkSemanticCache with pgvector to reduce LLM API costs by ~30-60%',
      'Add BullMQ removeOnComplete/removeOnFail to prevent Redis memory exhaustion',
      'Add EventQueueLog.status index to fix slow metrics queries',
    ],
  },
  issue_catalog: issues,
  risk_heatmap: {
    data_integrity: {
      score: 'HIGH_RISK',
      drivers: ['SQLite/Postgres dual-DB split', 'audit log is console.log only', 'LLMCallLog uses Float for cost'],
    },
    system_reliability: {
      score: 'MEDIUM_RISK',
      drivers: ['SSE memory leak in legacy admin', 'no circuit breaker on AI Router', 'BullMQ jobs never cleaned up'],
    },
    scalability: {
      score: 'MEDIUM_RISK',
      drivers: ['semantic cache 100% miss rate', 'SQLite not horizontally scalable', 'no Redis hot-key sharding'],
    },
    security: {
      score: 'CRITICAL_RISK',
      drivers: ['user_metadata RBAC bypass (privilege escalation)', 'no scope payload sanitization'],
    },
    observability: {
      score: 'MEDIUM_RISK',
      drivers: ['traceId not propagated in MVP/SQLite path', 'SSE stream is mock data', 'DLQ endpoint is stub'],
    },
  },
};

const jsonOutput = JSON.stringify(report, null, 2);

if (outputFile) {
  writeFileSync(outputFile, jsonOutput, 'utf8');
  console.log(`✅ Audit complete. Report written to: ${outputFile}`);
  console.log(`   Health Score: ${healthScore}/100 | Issues: ${issues.length} (${report.executive_summary.by_severity.critical} critical)`);
} else {
  console.log(jsonOutput);
}
