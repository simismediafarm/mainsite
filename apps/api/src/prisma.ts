import { prisma as rawPrisma } from '@simis/database';
import { extendPrismaWithEventInvariant } from './kernel/guards/event.invariant';

const globalForPrisma = globalThis as unknown as { prisma: any };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = rawPrisma;

// SIK: Enforce Event Trace Invariant by wrapping database client mutations
export const prisma = extendPrismaWithEventInvariant(rawPrisma);
