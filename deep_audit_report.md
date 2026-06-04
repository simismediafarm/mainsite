# SIMIS Deep Codebase Audit & Production-Ready Implementation Plan

> **Tanggal Audit:** 2026-06-04  
> **Scope:** Seluruh monorepo `/SIMIS` — 17 packages, 3 apps, 21 DB migrations, CI/CD, env/config, third-party integrations  
> **Constraint:** IAC v1.0 FROZEN — core kernel tidak boleh dimodifikasi secara struktural. Semua perbaikan bersifat _wiring_, _configuration_, _stub-replacement_, dan _pipeline-connection_.

---

## 🔴 CRITICAL FINDINGS (BLOCKERS — Harus diperbaiki sebelum produksi)

### BUG-01 — Duplicate Migration Number `009`
**File:** `packages/database/migrations/009_agent_swarm_economy.sql` dan `009_knowledge_graph_init.sql`  
**Masalah:** Dua file migrasi berbeda memiliki prefix `009_`. Ketika dijalankan oleh Supabase CLI / migration runner, salah satunya **akan di-skip atau menimpa** yang lain secara tak terduga.  
**Dampak:** 🔴 Data corruption / missing schema di production  
**Fix:** Rename `009_knowledge_graph_init.sql` → `009b_knowledge_graph_init.sql` (atau renumber seluruh chain mulai 010).

---

### BUG-02 — Duplicate `getSupabase()` Instantiation (6 lokasi berbeda)
**Files:**  
- `packages/kernel-graph/src/executor/kernelExecutor.ts` (canonical)  
- `packages/kernel-graph/src/v7.1/runtime/execution_pipeline.ts` (COPY — bukan singleton!)  
- `packages/deploy-kernel/src/index.ts` (COPY)  
- `packages/ai-client/src/router.ts` (COPY)  
- `packages/reasoning-graph/src/index.ts` (COPY)  
- `packages/kernel-graph/src/v7.2.1/ecvm/io_buffer.ts` (inline `createClient` tanpa singleton)

**Masalah:** Setiap file membuat Supabase client terpisah (bukan shared singleton). Ini mengakibatkan:  
- Pool koneksi tidak efisien (banyak koneksi terpisah ke Supabase)  
- Tidak ada circuit breaker terpusat  
- `execution_pipeline.ts` memiliki `getSupabase()` **lokal** yang mengabaikan canonical singleton di `kernelExecutor.ts` — ini **memecah desain single truth source**.  

**Fix:** Semua file harus `import { getSupabase } from '@simis/kernel-graph/executor/kernelExecutor'`. Tidak ada `createClient` baru di luar canonical file.

---

### BUG-03 — Mock IOBuffer di 3 Package Berbeda (Pipeline Terputus)
**Files:**  
- `packages/signal-engine/src/io_buffer_bridge.ts` — `export const ioBuffer = { write: async () => true }`  
- `packages/reasoning-engine/src/executive_fsm.ts` — Mock `ioBuffer.write` yang tidak pernah memanggil real IOBuffer  
- `packages/publishing-engine/src/publish_engine.ts` — Mock `ioBuffer.write`  
- `packages/knowledge-graph/src/kernel_mocks.ts` — Mock `ioBuffer`, mock `kernel_llm_extract`, mock `kernel_embed_768d`  

**Masalah:** Signal Engine, Reasoning Engine, Publishing Engine, dan Knowledge Graph **tidak pernah benar-benar menulis ke IOBuffer nyata**. Mereka menggunakan mock no-op. Artinya:  
- Tidak ada DECT enforcement di layer ini  
- Tidak ada PoE coverage untuk operasi signal/publish  
- **Pipeline dari Crawl → Signal → Decision → Publish tidak tersambung secara deterministic**  

**Fix:** Ganti semua mock `ioBuffer` dengan import `IOBuffer` dari `@simis/kernel-graph/v7.2.1/ecvm/io_buffer.js` dan inject instance via constructor/parameter.

---

### BUG-04 — `// @ts-ignore` di Critical Import Paths (Structural Gap)
**Files:**  
- `apps/api/src/routers/kernel.ts` line 7: `// @ts-ignore` untuk `kernel_stream_bridge`  
- `apps/api/src/routers/research.ts` line 2: `// @ts-ignore` untuk `dispatchResearchIntent`  
- `packages/reasoning-graph/src/kernel_integration.ts` lines 2, 4, 6: 3x `@ts-ignore`  
- `packages/reasoning-graph/src/index.ts` line 6: `@ts-ignore`  

**Masalah:** `@ts-ignore` menyembunyikan type errors nyata. Kemungkinan:  
- Import dari `/dist/` path langsung (bukan dari package exports) tanpa type declarations  
- Package exports di `kernel-graph/package.json` **hanya mendefinisikan 3 subpath** tapi ada banyak import ke path `/dist/v7.1/...` yang tidak tercantum di `exports` field  

**Fix:** Tambahkan semua subpath yang dibutuhkan ke `exports` field di `packages/kernel-graph/package.json`, lalu hapus semua `@ts-ignore`.

---

### BUG-05 — Auth Dinonaktifkan di Frontend API Client
**File:** `apps/web/lib/kernel-api.ts` lines 5–11 (dikomentari)  
**Masalah:** Supabase Auth header tidak pernah dikirim ke API. Request dari frontend ke `apps/api` adalah **unauthenticated**. Tidak ada token validation di Hono API server. Semua endpoint `/kernel/*` terbuka tanpa authentication.  
**Dampak:** 🔴 Security gap — siapapun bisa submit intent, trigger replay, atau membaca violations.  
**Fix:** Aktifkan kembali auth header (uncomment code), tambahkan `authMiddleware` di Hono server yang memvalidasi JWT Supabase.

---

### BUG-06 — `writeMemoryNode` di Reasoning Graph Menulis ke DB Secara Langsung (Bypassing IOBuffer)
**File:** `packages/reasoning-graph/src/index.ts` line 157  
```ts
await supabase.from('signals').insert({ ... }); // DIRECT WRITE — DECT VIOLATION
```
**Masalah:** Ini adalah **direct Supabase write di luar IOBuffer** — melanggar prinsip DECT bahwa semua side-effects harus melalui IOBuffer. PoE tidak akan mencakup write ini.  
**Fix:** Pindahkan write ke dalam `ioBuffer.enqueueWrite()` di `kernel_integration.ts` (stub-nya sudah ada di line 32–37, hanya perlu diisi dengan logika nyata).

---

### BUG-07 — COSS Auto-Healing CI dapat melakukan `git push` ke `main` tanpa approval
**File:** `.agent/ci/kernel-gate.yml` lines 24–28  
**Masalah:** CI job `coss_auto_patching` dapat `git commit + git push origin main` secara otomatis jika file `autonomous_patch_applied.json` ada. Ini **melanggar IAC v1.0 FROZEN** dan merupakan security risk — autonomous push ke main branch tanpa review.  
**Fix:** Ubah ke `git push origin HEAD:refs/heads/coss/auto-patch-<timestamp>` (bukan main) + tambahkan `pull_request` requirement gate.

---

## 🟡 HIGH-PRIORITY FINDINGS (Degradasi / Functional Gaps)

### GAP-01 — `execution_pipeline.ts` `runTransaction` adalah Stub
**File:** `packages/kernel-graph/src/v7.1/runtime/execution_pipeline.ts` lines 142–159  
Fungsi `runTransaction` hanya men-stage write ke IOBuffer tapi **callback async-nya kosong** (`async () => {}`). Tidak ada actual DB write yang terjadi dari `runTransaction` default.  
**Dampak:** Intent yang tidak menyediakan `transactionHandler` di options tidak akan melakukan apapun di DB.  
**Fix:** Implementasi default transaction handler yang memanggil Supabase RPC / kernel execute.

---

### GAP-02 — `reasoning-graph` `executorNode` Menggunakan Mock Search
**File:** `packages/reasoning-graph/src/index.ts` lines 117–127  
```ts
const results = state.execution_plan.map((task) => ({
  source: 'Mocked Search',
  url: 'https://example.com/mock',
  ...
}));
```
Tidak ada real web search, Tavily, SerpAPI, atau crawler integration. Penelitian tidak pernah mengambil data nyata.  
**Fix:** Hubungkan ke real search API (Tavily/SerpAPI) atau gunakan crawler-mesh sebagai data source.

---

### GAP-03 — `knowledge-graph` LLM Extract & Embed adalah Stub
**File:** `packages/knowledge-graph/src/kernel_mocks.ts`  
- `kernel_llm_extract` selalu mengembalikan `{ entities: [{ name: "placeholder", type: "TEST" }] }`  
- `kernel_embed_768d` selalu mengembalikan vektor `[0.1, 0.1, ...]`  
**Dampak:** Knowledge Graph tidak pernah mengekstrak entitas atau embedding nyata. Vector search tidak berguna.  
**Fix:** Hubungkan ke AI client (`@simis/ai-client`) yang sudah ada dan ke OpenAI/Google Gemini embedding API.

---

### GAP-04 — `edge_publisher.ts` Mocked (Tidak Ada Real Deploy)
**File:** `packages/publishing-engine/src/edge_publisher.ts`  
Jika `VERCEL_DEPLOY_HOOK` tidak ada, selalu return `{ status: "MOCKED_SUCCESS" }`.  
**Fix:** Konfigurasi env var `VERCEL_DEPLOY_HOOK` atau ganti dengan platform deployment yang dipilih.

---

### GAP-05 — `apps/web` Hanya Punya Satu Route (`/dashboard/kernel`)
**File:** `apps/web/app/dashboard/kernel/`  
Frontend hanya memiliki halaman kernel dashboard. Tidak ada: signal monitoring, knowledge graph viewer, research trigger UI, publishing pipeline status, config management UI.  
**Fix:** Bangun halaman tambahan sesuai fungsi yang sudah ada di backend.

---

### GAP-06 — `apps/site` Kosong Total
**Directory:** `apps/site/` (tidak ada `src/`, tidak ada file)  
**Masalah:** Package ini ada di workspace tapi tidak memiliki konten apapun.  
**Fix:** Isi atau hapus dari workspace.

---

### GAP-07 — LLM Model Hard-coded (Versi Lama)
**File:** `packages/reasoning-graph/src/index.ts` line 72  
```ts
modelName: 'gemini-1.5-flash'  // Deprecated / not recommended
```
**File:** `packages/ai-client/src/router.ts` line 50  
```ts
'content.generate_brief': { model: 'Gemini 1.5 Pro', ... }
```
Gemini 1.5 akan/sudah deprecated. Harus upgrade ke `gemini-2.0-flash` / `gemini-2.5-pro`.

---

### GAP-08 — CI Tidak Menjalankan Tests
**File:** `.github/workflows/ci.yml`  
CI hanya menjalankan `pnpm build && pnpm lint`. **Tidak ada `pnpm test`**. `kernel-graph` memiliki folder `tests/` dan `jest.config.js` tapi tidak pernah dijalankan di CI.  
**Fix:** Tambahkan `pnpm test --filter='@simis/kernel-graph'` ke CI.

---

### GAP-09 — Tidak Ada `.env.example` di Repository
Tidak ada file `.env.example` atau `.env.local.example` di root maupun di app/package mana pun. Developer baru tidak tahu env var apa yang dibutuhkan.  
**Fix:** Buat `.env.example` berdasarkan semua env var yang digunakan di codebase.

---

### GAP-10 — `SUPABASE_SERVICE_ROLE_KEY` Fallback ke `SUPABASE_ANON_KEY`
**Ditemukan di:** Hampir semua `getSupabase()` implementation  
```ts
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
```
**Masalah:** Jika `SERVICE_ROLE_KEY` tidak di-set, system akan diam-diam menggunakan `ANON_KEY` — yang memiliki privilege jauh lebih rendah dan akan menyebabkan RLS failures yang sulit di-debug.  
**Fix:** Hilangkan fallback. Fail fast jika `SERVICE_ROLE_KEY` tidak ada untuk server-side code.

---

## 🟢 LOW-PRIORITY FINDINGS (Quality / Observability)

| ID | Lokasi | Temuan | Fix |
|---|---|---|---|
| LOW-01 | `packages/kernel-graph/src/v7.1/runtime/replay.ts` | `replay.ts` belum dilihat tapi dipanggil oleh kernel router — perlu verifikasi replay logic lengkap | Review & test |
| LOW-02 | `packages/kernel-chaos/src/` | Chaos engine (fault injection) ada tapi tidak ada CI test yang menguji chaos scenario | Tambahkan chaos test harness |
| LOW-03 | `packages/kernel-formal/` & `packages/kernel-theorem/` | Tidak dilihat isinya — perlu verifikasi apakah ini hanya spec atau ada runtime code | Audit isi |
| LOW-04 | `turbo.json` | Tidak mendefinisikan task `test` — `pnpm test` tidak akan di-cache oleh turbo | Tambahkan `"test": {}` ke turbo tasks |
| LOW-05 | `apps/web/package.json` | `@types/react: ^18.2.0` tapi `react: ^19.0.0-rc` — version mismatch menyebabkan peer deps warning | Align type versions |
| LOW-06 | `packages/database/migrations/011_clcoa_introspection.sql` | File hanya 555 bytes — kemungkinan tidak lengkap | Cek isi |
| LOW-07 | `ops/observability/posthog_client.ts` | Hard-coded `'mock-posthog-key'` sebagai fallback | Fail fast atau remove mock key |
| LOW-08 | `packages/ai-client/src/router.ts` | State mapping terbalik: `CLOSED → ACTIVE`, `HALF_OPEN → DEGRADED`, `OPEN → FAILED` — tidak sesuai circuit breaker semantics standar | Fix state mapping |

---

## 📋 ENVIRONMENT VARIABLES YANG DIBUTUHKAN (Master List)

Berdasarkan audit seluruh codebase:

```bash
# === SUPABASE (REQUIRED) ===
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Server-side only
SUPABASE_ANON_KEY=eyJ...                  # Client-side (web) only

# === UPSTASH REDIS (REQUIRED for config cache) ===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# === AI PROVIDERS (REQUIRED for real reasoning) ===
GEMINI_API_KEY=xxx                        # Google Gemini
OPENAI_API_KEY=xxx                        # OpenAI (embeddings)
GROQ_API_KEY=xxx                          # Groq (via ai-client)

# === SEARCH / RESEARCH ===
TAVILY_API_KEY=xxx                        # Web search for reasoning-graph

# === PUBLISHING ===
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...

# === OBSERVABILITY ===
POSTHOG_API_KEY=phc_xxx                   # PostHog project key
POSTHOG_HOST=https://us.i.posthog.com
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# === API SERVER ===
PORT=4000

# === FRONTEND ===
NEXT_PUBLIC_KERNEL_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🗺️ IMPLEMENTATION PLAN (Prioritized)

### PHASE 1 — Critical Bug Fixes (Semua blocker sebelum produksi)
**Estimasi: 3–5 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P1-1 | `009_knowledge_graph_init.sql` | Rename ke `009b_` atau renumber chain |
| P1-2 | `execution_pipeline.ts` | Hapus local `getSupabase()`, import dari canonical executor |
| P1-3 | `io_buffer.ts` | Hapus inline `createClient`, import dari canonical executor |
| P1-4 | `deploy-kernel/src/index.ts` | Import dari canonical executor |
| P1-5 | `ai-client/src/router.ts` | Import dari canonical executor |
| P1-6 | `reasoning-graph/src/index.ts` | Import dari canonical executor |
| P1-7 | `kernel-graph/package.json` | Tambah semua `exports` subpath yang dibutuhkan (hapus kebutuhan @ts-ignore) |
| P1-8 | `apps/web/lib/kernel-api.ts` | Aktifkan auth header |
| P1-9 | `apps/api/src/index.ts` | Tambah Hono `authMiddleware` JWT Supabase |
| P1-10 | `.agent/ci/kernel-gate.yml` | Ubah auto-push ke PR branch, bukan main |

---

### PHASE 2 — Pipeline Integration (Sambungkan mock ke real)
**Estimasi: 5–7 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P2-1 | `signal-engine/src/io_buffer_bridge.ts` | Ganti mock dengan real IOBuffer import + inject via constructor |
| P2-2 | `reasoning-engine/src/executive_fsm.ts` | Ganti mock ioBuffer dengan real IOBuffer |
| P2-3 | `publishing-engine/src/publish_engine.ts` | Ganti mock ioBuffer dengan real IOBuffer |
| P2-4 | `knowledge-graph/src/kernel_mocks.ts` | Ganti `kernel_llm_extract` dengan real AI client call |
| P2-5 | `knowledge-graph/src/kernel_mocks.ts` | Ganti `kernel_embed_768d` dengan real embedding API call |
| P2-6 | `reasoning-graph/src/index.ts` `writeMemoryNode` | Pindahkan DB write ke dalam IOBuffer enqueue (tidak direct write) |
| P2-7 | `reasoning-graph/src/index.ts` `executorNode` | Hubungkan ke real search API (Tavily atau crawler-mesh) |
| P2-8 | `execution_pipeline.ts` `runTransaction` | Implementasi default transaction yang benar-benar memanggil Supabase RPC |

---

### PHASE 3 — Environment & Configuration Setup
**Estimasi: 1–2 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P3-1 | Root `.env.example` | Buat file dari master list di atas |
| P3-2 | `kernelExecutor.ts` + all copies | Hapus fallback ke ANON_KEY untuk service key — fail fast |
| P3-3 | `reasoning-graph/src/index.ts` | Upgrade `gemini-1.5-flash` → `gemini-2.0-flash` |
| P3-4 | `ai-client/src/router.ts` | Update LLM_ROUTER_POLICY dengan model versi terbaru |
| P3-5 | `publishing-engine/src/edge_publisher.ts` | Set `VERCEL_DEPLOY_HOOK` di env, verify endpoint real |
| P3-6 | `ops/observability/posthog_client.ts` | Remove mock-key fallback, require env var |

---

### PHASE 4 — CI/CD & Testing
**Estimasi: 2–3 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P4-1 | `.github/workflows/ci.yml` | Tambah `pnpm test` step |
| P4-2 | `turbo.json` | Tambah `"test": {}` task |
| P4-3 | `.github/workflows/` | Buat `observability_deploy.yml` workflow (dari implementation_plan_production_ready.md) |
| P4-4 | `packages/kernel-chaos/` | Buat chaos test harness yang dijalankan di CI |
| P4-5 | `apps/web/package.json` | Fix type mismatch: align `@types/react` ke v19 |

---

### PHASE 5 — Frontend Completion
**Estimasi: 3–5 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P5-1 | `apps/web/app/dashboard/` | Buat halaman: Signal Monitor, Research Trigger, Knowledge Graph, Publishing Pipeline |
| P5-2 | `apps/site/` | Isi atau hapus dari pnpm workspace |
| P5-3 | `apps/web/lib/kernel-api.ts` | Tambah hooks SWR untuk semua endpoint yang ada di `apps/api` |

---

### PHASE 6 — Database & Migration Hardening
**Estimasi: 1–2 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P6-1 | `migrations/009_*.sql` | Fix duplicate numbering (rename/renumber) |
| P6-2 | `migrations/011_clcoa_introspection.sql` | Verifikasi kelengkapan |
| P6-3 | Semua migrations | Jalankan di Supabase staging dan verifikasi urutan |

---

### PHASE 7 — Observability Wiring (Credentials & Integration)
**Estimasi: 1 hari kerja**

| Task | File(s) | Action |
|---|---|---|
| P7-1 | `ops/scripts/health_sync.sh` | Isi `YOUR_PROJECT_ID` dan `YOUR_READ_ONLY_API_KEY` |
| P7-2 | `ops/scripts/poe_validator.sh` | Isi credentials PostHog |
| P7-3 | `ops/config/posthog.env` | Buat file dan isi dari env |
| P7-4 | `ops/config/otel_collector.yaml` | Konfigurasi OTEL exporter ke file |
| P7-5 | `ops/config/grafana.yaml` | Configure datasource + import dashboard JSON |

---

## 📊 Ringkasan Audit

| Kategori | Jumlah | Severity |
|---|---|---|
| Critical Blockers (BUG) | 7 | 🔴 Harus fix sebelum produksi |
| Functional Gaps (GAP) | 10 | 🟡 Degradasi / fitur tidak jalan |
| Quality Issues (LOW) | 8 | 🟢 Dapat dikerjakan iteratif |
| Env vars yang dibutuhkan | 15 | — |
| Packages dengan mock IOBuffer | 4 | 🔴 Pipeline terputus |
| Duplicate getSupabase() | 6 | 🔴 Connection pool waste |
| Packages dengan @ts-ignore | 4 | 🟡 Type safety lost |
| Migration duplicate number | 1 | 🔴 Data corruption risk |

---

## 🎯 FINAL VERDICT

**Sistem BELUM siap produksi.** Core kernel (execution_pipeline, DECT, PoE, IOBuffer) sudah solid secara desain dan terbukti berjalan (lihat live_run.ts sukses). Namun:

1. **Pipeline tidak tersambung end-to-end** — Signal Engine, Reasoning Engine, Publishing Engine, Knowledge Graph semuanya menggunakan mock IOBuffer
2. **Authentication tidak aktif** — Frontend dan API berjalan tanpa auth
3. **Database migration conflict** — Duplicate `009` akan menyebabkan masalah di production Supabase
4. **Tidak ada real AI calls** — Semua reasoning menggunakan mock/fallback

**Estimasi total untuk production-ready: ~15–22 hari kerja** jika dikerjakan oleh 1–2 developer.

---

*Prepared by: AI IDE Agent (Antigravity)*  
*Date: 2026-06-04*
