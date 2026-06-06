import { checkDbInvariant } from './db.invariant';

export function checkEnvInvariant() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  // 1. Mandatory Environment Variables
  const requiredVars = [
    'DATABASE_URL',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`[Env Invariant Failure] Missing mandatory env variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Redis Check
  const hasRedis = process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT);
  if (!hasRedis) {
    console.error(`[Env Invariant Failure] Missing Redis configuration (REDIS_URL or REDIS_HOST & REDIS_PORT required)`);
    process.exit(1);
  }

  // QStash Keys Check (only if QStash is active or in production worker context)
  if (isProduction) {
    const hasQStash = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!hasQStash) {
      console.warn(`[Env Invariant Warning] QStash keys are missing in production environment. Incoming webhooks will fail verification.`);
    }
  }

  // 2. Localhost validation in Production
  if (isProduction) {
    const localhostPattern = /localhost|127\.0\.0\.1|0\.0\.0\.0/;
    
    // Check key URL parameters
    const urlsToCheck = [
      process.env.DATABASE_URL,
      process.env.REDIS_URL,
      process.env.NEXT_PUBLIC_KERNEL_API_URL,
    ].filter(Boolean) as string[];

    for (const url of urlsToCheck) {
      if (localhostPattern.test(url)) {
        console.error(`[Env Invariant Failure] Localhost endpoint detected in production configuration: "${url}"`);
        process.exit(1);
      }
    }
  }
}
