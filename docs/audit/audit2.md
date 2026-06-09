# SIMIS — Master Action Plan

---

## 🔴 P0 — SECURITY (Fix sebelum deploy apapun ke production)

### SEC-001: RBAC `user_metadata` Privilege Escalation
**Status:** ✅ SUDAH DIPERBAIKI di `auth.ts`
`adminAuthMiddleware` sudah menggunakan `user.app_metadata?.role` (server-verified), bukan `user_metadata`. Tidak perlu aksi tambahan — tapi perlu **audit semua tempat** yang masih baca `user_metadata` langsung di frontend.

**Aksi:**
- Grep semua `user_metadata` di `apps/web` — pastikan tidak dipakai untuk gate akses apapun
- Dokumentasikan bahwa `app_metadata.role` adalah single source of truth untuk RBAC

### SEC-002: Scope Payload Sanitization
**Lokasi:** `apps/api/src/routers/admin/command.ts` — field `scope` diterima as-is sebagai `any`

**Aksi:**
- Tambahkan Zod schema per command type untuk validasi `scope`
- Contoh: `CRAWLER.TRIGGER` scope harus punya `sourceId: z.string().uuid()`

### SEC-003: `SIMIS_OPS_KEY` Bypass Terlalu Lebar
`authMiddleware` dan `adminAuthMiddleware` keduanya bypass semua checks jika `opsKey` cocok. Ini risiko jika key bocor.

**Aksi:**
- Batasi ops key bypass hanya untuk IP internal/worker (tambahkan IP allowlist di middleware)
- Atau scope key per operasi (bukan full bypass)

### SEC-004: Audit Log Hanya `console.log`
**Aksi:**
- Ganti semua `console.error`/`console.log` di security path dengan persist ke `SecurityEventLog` via Prisma
- Terutama di `command.consumer.ts` Zero Trust violation path

---

## 🔴 P1 — DATA INTEGRITY (SQLite Split — SIMIS-001)

### DB-001: Migrate `sqlite_db.ts` → Prisma Postgres
**Lokasi:** `apps/api/src/store/sqlite_db.ts`
**Impact:** MVP layer tidak punya traceId, tidak masuk EventQueueLog, tidak bisa di-replay

**Aksi:**
1. Replace semua read/write di `sqlite_db.ts` dengan Prisma client calls ke tabel yang sudah ada
2. Route mutations melalui `EventQueueLog` (pattern yang sudah ada di `mvp.ts` POST /post — tinggal replikasi ke semua handler)
3. Hapus dependency `better-sqlite3` dari package.json setelah selesai

### DB-002: `LLMCallLog.cost` Pakai `Float` — Precision Loss
**Aksi:**
- Migrate kolom `cost` di schema Prisma dari `Float` ke `Decimal(10,8)` 
- Buat migration: `prisma migrate dev --name fix_llm_cost_precision`

---

## 🟠 P2 — RELIABILITY

### REL-001: SSE Memory Leak di Admin (Infinite Loop Tanpa Abort)
**Lokasi:** `apps/web/lib/sse.ts` dan `apps/api/src/services/realtime.ts`

**Aksi di `realtime.ts`:** Sudah ada `stream.onAbort(() => clients.delete(stream))` — sudah benar. Pastikan endpoint SSE di router memanggil `registerSSEClient`.

**Aksi di frontend `sse.ts`:** Pastikan `EventSource` di-close di `useEffect` cleanup:
```ts
// Wajib ada ini di setiap komponen yang pakai SSE
useEffect(() => {
  const es = new EventSource(url);
  return () => es.close(); // cleanup
}, []);
```

### REL-002: No Circuit Breaker di AI Router / AIOrchestrator
**Lokasi:** `apps/api/src/services/ai/ai_orchestrator.ts`
**Risk:** Jika semua provider (Gemini/OpenRouter/OpenAI) down, request hang sampai timeout

**Aksi:**
- Tambahkan `AbortSignal` dengan timeout per provider call (misal: 10s per provider)
- Atau implementasi simple circuit breaker: track consecutive failures per provider, skip provider jika failure count > threshold

### REL-003: BullMQ `removeOnComplete`/`removeOnFail` Tidak Konsisten
**Status:** `eventQueue` di `worker/src/index.ts` sudah punya `removeOnComplete: 1000, removeOnFail: 500` ✅
**Tapi:** Queue lain (authz, command) belum diperiksa.

**Aksi:**
- Audit semua `new Queue(...)` dan `new Worker(...)` di `apps/worker/src/queue/` — pastikan semua punya `removeOnComplete`/`removeOnFail`
- Standar: `removeOnComplete: { count: 1000 }`, `removeOnFail: { count: 500 }`

---

## 🟠 P3 — PERFORMANCE

### PERF-001: Semantic Cache 100% Miss Rate
**Impact:** Setiap AI call hit provider API, cost bisa -30-60% dengan cache

**Aksi:**
1. Aktifkan `pgvector` extension di Supabase: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Tambahkan kolom `embedding vector(1536)` di tabel `IntelligenceSnapshot`
3. Implementasi `checkSemanticCache(inputHash, embedding)` di `AIOrchestrator` — cek similarity sebelum hit provider
4. `AICache.saveSnapshot()` sudah ada di orchestrator, tinggal tambahkan embedding saat save

### PERF-002: Unused Indexes di Supabase (27 indeks)
Semua status INFO — artinya tabel belum punya traffic/queries yang memanfaatkan index ini. **Jangan drop dulu** — ini early-stage, indexes ini akan dipakai saat traffic naik.

**Strategi per kelompok:**

| Kelompok | Keputusan |
|---|---|
| `analytics.*` (EventEnvelope, EventQueueLog, LLMCallLog, dll) | **Pertahankan** — akan aktif saat monitoring dipakai |
| `public.Post` (`authorId_idx`, `publicationId_idx`) | **Pertahankan** — akan aktif saat feed queries scale |
| `public._PostToTag_B_index` | **Pertahankan** — Prisma implicit M2M index, wajib ada |
| `public.Account`, `Session`, `WorkspaceMember` (userId_idx) | **Pertahankan** — aktif saat auth flow dipakai |
| `registry.*` (workspaceId_idx) | **Review ulang dalam 30 hari** — jika masih 0 hits setelah production launch, baru pertimbangkan drop |

**Catatan:** Jangan drop `EventQueueLog_status_idx` — ini justru direkomendasikan di audit report untuk mempercepat metrics queries.

### PERF-003: Redis Hot-Key Sharding
**Aksi:** Defer ke post-launch. Monitor Redis key distribution dulu via `redis-cli --hotkeys`.

---

## 🟡 P4 — INTEGRASI DATABASE ↔ FRONTEND ↔ BACKEND

### INT-001: Frontend Masih Fetch Langsung ke DB via `@simis/database`
**Lokasi:** `apps/web/package.json` — ada `@simis/database: workspace:*` dan `@prisma/client`

**Risk:** Frontend bundle bisa include Prisma client, koneksi DB di client-side, dan rule "no direct PrismaClient outside @simis/database" bisa dilanggar di Next.js Server Components.

**Aksi:**
- Audit semua `import { prisma }` di `apps/web/` — pastikan hanya di Server Components/Route Handlers, tidak di client components
- Semua mutasi data dari browser harus via API (`apps/api`), bukan direct Prisma di web app

### INT-002: Dual Schema — `apps/api/prisma/` vs `packages/database/prisma/`
**Lokasi:** `apps/api/prisma/` dan `packages/database/prisma/schema.prisma`

**Aksi:**
- Verifikasi kedua schema sinkron (identik atau satu extend yang lain)
- Tetapkan satu schema sebagai canonical: `packages/database/prisma/schema.prisma`
- `apps/api/prisma.config.js` harus point ke package database, bukan local copy

### INT-003: `next-auth` Beta + Supabase Auth — Dual Auth System
**Lokasi:** `apps/web/package.json` — `next-auth: 5.0.0-beta.31` dan `@supabase/ssr: ^0.1.0`

**Risk:** Dua auth system berjalan bersamaan = session conflict, duplicate token management, maintenance overhead

**Aksi:**
- Putuskan satu auth system: **Supabase Auth recommended** (sudah dipakai di API middleware, lebih konsisten)
- Hapus `next-auth` jika sudah tidak dipakai, atau isolasi ke satu use case yang jelas
- Cek `apps/web/app/api/auth/[...nextauth]/` — apakah masih aktif?

### INT-004: Version Drift di Dependencies
**Issues ditemukan:**

| Package | `apps/web` | `apps/worker` | Risk |
|---|---|---|---|
| `@types/node` | `^25.9.1` | `^20.0.0` | Incompatible types antara apps |
| `typescript` | `^6.0.3` | `^5.0.0` | Semantic diff, bisa breaking |
| `ioredis` | — | `^5.3.2` | API vs `^5.11.0` di `apps/api` |
| `bullmq` | — | `^4.12.0` | Sama dengan api ✅ |

**Aksi:**
- Pindahkan `@types/node` dan `typescript` ke root `package.json` devDependencies
- Pin ke versi yang sama di semua workspace: `typescript: 5.4.x`, `@types/node: 20.x` (atau align ke latest yang sudah teruji)

### INT-005: Prisma Version Mismatch
`apps/web`: `@prisma/client: ^7.8.0`
`apps/api`: `@prisma/client: 7.8.0` (pinned)
`apps/worker`: `@prisma/client: ^7.8.0`

Sementara ini aman karena semua pada 7.8.x, tapi `^` bisa bump otomatis.

**Aksi:** Pin semua ke `7.8.0` (tanpa `^`) dan update manual setelah testing.

---

## 🟡 P5 — OBSERVABILITY

### OBS-001: traceId Tidak Propagasi di MVP/SQLite Path
**Sudah sebagian fixed** — `POST /post` di `mvp.ts` sudah ada `EventQueueLog` insert dengan traceId.
**Gap:** `GET /feed`, `GET /post/:id` tidak ada traceId propagation.

**Aksi:**
- Tambahkan `X-Trace-Id` response header di semua GET endpoints
- Gunakan middleware Hono untuk auto-inject traceId ke setiap request context

### OBS-002: DLQ Endpoint Masih Stub
**Lokasi:** `apps/api/src/routers/v2.ts` — `/admin/dlq` dan `/admin/dlq/retry`

**Aksi:**
- Implementasi `/admin/dlq`: query `EventQueueLog` where `status = 'FAILED'`
- Implementasi `/admin/dlq/retry`: update status ke `QUEUED` + re-dispatch ke BullMQ

### OBS-003: SSE Stream di Admin Console Masih Mock Data
**Aksi:** Sambungkan ke `setupRealtimeBridge()` yang sudah ada di `realtime.ts`

---

## 🟡 P6 — GAPS & STUB FILES

File-file berikut masih **kosong (0 bytes)** yang perlu diisi sebelum production:

| File | Prioritas |
|---|---|
| `apps/worker/src/shared/snapshot.writer.ts` | Medium |
| `apps/worker/src/shared/llm-client.ts` | Medium |
| `apps/worker/src/os/demand/DemandForecastEngine.ts` | Low |
| `apps/worker/src/os/recommendation/Recommendation*.ts` | Low |
| `apps/api/src/services/admin/llm-usage-analyzer.service.ts` | Medium |
| `apps/api/src/services/admin/queue-monitor.service.ts` | Medium |
| `apps/api/src/services/admin/os-layer-aggregator.service.ts` | Low |

---

## Prioritas Eksekusi

```
Sprint 1 (sekarang)   → SEC-002, DB-001, DB-002, INT-003
Sprint 2              → REL-001, REL-002, REL-003, INT-001, INT-002
Sprint 3              → PERF-001, OBS-001, OBS-002, OBS-003
Sprint 4              → INT-004, INT-005, PERF-002 review, gap files
```
