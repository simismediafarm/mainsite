const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

console.log('🔍 [SIK CI Linter] Running static invariant analysis...');

const forbiddenPatterns = [
  {
    name: 'Hardcoded Queue Name',
    regex: /'simis-(?:command|ai|authz)-queue'|"simis-(?:command|ai|authz)-queue"/g,
    message: 'Do not use string literal queue names. Reference SIMIS_QUEUE_NAMES constants instead.'
  },
  {
    name: 'SQLite Import',
    regex: /from ['"]better-sqlite3['"]|require\(['"]better-sqlite3['"]\)|from ['"]sqlite3['"]|require\(['"]sqlite3['"]\)/g,
    message: 'SQLite imports are forbidden in the production path. Use Supabase PostgreSQL.'
  },
  {
    name: 'Bypassed AI Pipeline step',
    regex: /enrichContent\s*\([^)]*\)\s*\{(?:[^{}]*|\{[^{}]*\})*\}/g,
    message: 'AI enrichment logic must route via the AIPipelineGuard.'
  }
];

// Scan source files - exclude the constants and schema definition files that declare the queue names
const files = glob.sync(['apps/api/src/**/*.ts', 'apps/worker/src/**/*.ts', 'packages/**/*.ts'], {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/queue.constants.ts',
    '**/command.schema.ts'
  ]
});

let violationsCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  for (const pattern of forbiddenPatterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;
      console.error(`❌ [SIK Linter Violation] ${pattern.name} in ${file}:${lineNumber}`);
      console.error(`   Message: ${pattern.message}`);
      console.error(`   Snippet: "${match[0].trim()}"\n`);
      violationsCount++;
    }
  }
}

if (violationsCount > 0) {
  console.error(`❌ [SIK CI Linter] Failed. Found ${violationsCount} invariant violation(s).`);
  process.exit(1);
} else {
  console.log('✅ [SIK CI Linter] Passed. Zero invariant violations detected.');
}
