# SYSTEM CONTEXT & DIRECTIVES

## 1. Continuous Observability
- Selalu memantau dan memperbaiki daftar `@[current_problems]` yang dilaporkan IDE.
- Antisipasi error *compile-time*, celah arsitektur (gaps), bug, dan redundansi.
- Pahami konteks monorepo: Jika ada *TypeScript mismatch*, pastikan melakukan sinkronisasi `schema.prisma` atau men- *trigger* reload pada TS Server.

## 2. Prisma Client & Monorepo Synchronization
- `apps/api/prisma/schema.prisma` menyimpan model V2.2 (EventEnvelope, RankingSnapshot, dll.).
- `packages/database/prisma/schema.prisma` menyimpan *core registry*.
- Jika IDE melaporkan property `eventEnvelope`, `rankingSnapshot`, atau `rankingProfile` tidak ditemukan pada `PrismaClient`, hal ini disebabkan oleh IDE cache yang tertinggal dari `node_modules/.prisma/client` di dalam `apps/api`. Reload TypeScript server di IDE Anda untuk membersihkan error ini.
