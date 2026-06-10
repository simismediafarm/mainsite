# SIMIS MediaFarm — Setup Guide
**For: Founder / Admin / Developer**
*Semua langkah di file ini membutuhkan tindakan manual. AI tidak bisa mengerjakannya.*

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x atau 22.x | https://nodejs.org |
| pnpm | 9.1.0 | `npm i -g pnpm@9.1.0` |
| Git | any | https://git-scm.com |

---

## 2. Supabase (Database + Auth)

### 2.1 Buat Project
1. https://supabase.com → New Project
2. Catat **Project URL** dan **Anon Key** (Settings → API)
3. Catat **Service Role Key** (Settings → API → `service_role`) — **jangan expose ke frontend**

### 2.2 Connection Strings
Settings → Database → Connection String:
```
# Untuk app queries (pooled, pgbouncer):
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"

# Untuk migrations (direct):
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-1-us-west-2.pooler.supabase.com:5432/postgres?schema=public"
```

### 2.3 Buat Schemas di SQL Editor
```sql
CREATE SCHEMA IF NOT EXISTS registry;
CREATE SCHEMA IF NOT EXISTS entity;
CREATE SCHEMA IF NOT EXISTS attention;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS extensions;
```

### 2.4 Enable pgvector
```sql
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
```

### 2.5 Jalankan Migration
```bash
pnpm --filter @simis/database exec prisma db push
```

### 2.6 Set Role Admin Pertama
Setelah login pertama kali lewat app, jalankan di SQL Editor Supabase:
```sql
-- Ganti dengan email Anda
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'
WHERE email = 'your@email.com';
```
> Role: `member` | `author` | `editor` | `admin` | `system_admin` | `super_admin`

### 2.7 Konfigurasi Auth Providers (opsional)
Settings → Authentication → Providers:
- **Email**: aktifkan "Confirm email"
- **Google OAuth**: https://console.cloud.google.com → Credentials → OAuth 2.0 → tambahkan `https://[project].supabase.co/auth/v1/callback` sebagai redirect URI
- **GitHub OAuth**: https://github.com/settings/developers → New OAuth App

### 2.8 Site URL & Redirect
Settings → Authentication:
- **Site URL**: `https://your-web-domain.vercel.app`
- **Redirect URLs**: tambahkan domain frontend Anda

---

## 3. Upstash Redis

1. https://console.upstash.com → Create Database → Region: `us-east-1`
2. Copy **REST URL** dan **REST Token**

```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

> Digunakan untuk: rate limiting, cache, SSE client registry.

---

## 4. Upstash QStash (Event Bus)

1. Upstash Console → QStash → Copy:
```env
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
```

> Digunakan untuk: background job queue, webhook delivery.

---

## 5. AI Providers

Minimal satu key cukup untuk launch. Prioritas (cost vs kemampuan):

| Provider | Daftar | Free Tier | Env Var |
|----------|--------|-----------|---------|
| Google Gemini | https://aistudio.google.com/apikey | Ya (generous) | `GEMINI_API_KEY` |
| OpenRouter | https://openrouter.ai/keys | Ya ($1 credit) | `OPENROUTER_API_KEY` |
| DeepSeek | https://platform.deepseek.com | Ya | `DEEPSEEK_API_KEY` |
| Grok (xAI) | https://console.x.ai | Terbatas | `GROK_API_KEY` |

> Sistem otomatis fallback antar provider. **Gemini + OpenRouter sudah cukup untuk launch.**

---

## 6. Tavily (Web Search untuk AI Research)

1. https://app.tavily.com → API Keys → Create
2. `TAVILY_API_KEY=tvly-...`

---

## 7. LangSmith (AI Tracing — opsional)

1. https://smith.langchain.com → Settings → API Keys
2. Set:
```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_PROJECT=SIMIS
```

---

## 8. Email / SMTP (untuk newsletter & konfirmasi)

Pilih salah satu:

| Service | Free Tier | Daftar |
|---------|-----------|--------|
| Resend | 3.000/bulan | https://resend.com |
| SendGrid | 100/hari | https://sendgrid.com |
| Mailgun | 5.000/bulan (trial) | https://mailgun.com |

Konfigurasi di Supabase (Settings → Authentication → SMTP) atau di `.env`:
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_...
SMTP_FROM=noreply@yourdomain.com
```

---

## 9. Environment Variables Lengkap

### `apps/api/.env`
```env
# Supabase
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-1-us-west-2.pooler.supabase.com:5432/postgres?schema=public"

# Redis & Queue
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...

# AI
GEMINI_API_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
DEEPSEEK_API_KEY=sk-...
GROK_API_KEY=gsk_...

# Research
TAVILY_API_KEY=tvly-...

# Server
PORT=4000
ALLOWED_ORIGIN=http://localhost:3000

# Ops key — WAJIB min 32 karakter. Generate: openssl rand -hex 32
SIMIS_OPS_KEY=<generate-dengan-openssl-rand-hex-32>
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_KERNEL_API_URL=http://localhost:4000
```

> Di production, `NEXT_PUBLIC_KERNEL_API_URL` = URL Vercel API Anda.

---

## 10. Deploy ke Vercel

### API (`apps/api`)
1. Vercel → Add Project → Import repo → **Root Directory**: `apps/api`
2. Build Command: `turbo run build --filter=@simis/api`
3. Tambahkan semua env vars dari section 9

### Web (`apps/web`)
1. Vercel → Add Project → Import repo → **Root Directory**: `apps/web`
2. Framework: Next.js (auto-detect)
3. Env vars yang diperlukan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_KERNEL_API_URL` = URL API Vercel Anda

### Setelah Deploy
1. Update `ALLOWED_ORIGIN` di API env → domain web Vercel Anda
2. Update Supabase → Auth → Site URL → domain web Anda
3. Tambahkan domain web ke Supabase → Auth → Redirect URLs

---

## 11. RSS Sources — Setup Pertama

Setelah app berjalan, tambahkan RSS sources via Admin → Sources → Add Source, atau via API:

```bash
curl -X POST https://[api-url]/api/admin/rss/sources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"TechCrunch","url":"https://techcrunch.com/feed/","category":"tech"}'
```

Starter sources yang direkomendasikan:

| Name | URL | Category |
|------|-----|----------|
| TechCrunch | https://techcrunch.com/feed/ | tech |
| The Verge | https://www.theverge.com/rss/index.xml | tech |
| Hacker News | https://news.ycombinator.com/rss | tech |
| Reuters Business | https://feeds.reuters.com/reuters/businessNews | finance |
| MIT Tech Review | https://www.technologyreview.com/feed/ | ai |

---

## 12. Seed Data Awal

```bash
curl -X POST https://[api-url]/api/v2/ops/seed \
  -H "X-SIMIS-OPS-KEY: <SIMIS_OPS_KEY>"
```

Ini akan membuat: navigation registry, widget sidebar, trending tags, dan 5 sample posts.

---

## 13. Quick Start Lokal

```bash
# 1. Install
pnpm install

# 2. Setup env
cp .env.example .env
# isi Supabase URL/keys, Redis, minimal satu AI key

# 3. Buat schemas + push schema
pnpm --filter @simis/database exec prisma db push

# 4. Jalankan dev server
pnpm dev
# → Web: http://localhost:3000
# → API: http://localhost:4000

# 5. Seed data (sekali saja)
curl -X POST http://localhost:4000/api/v2/ops/seed \
  -H "X-SIMIS-OPS-KEY: $(grep SIMIS_OPS_KEY .env | cut -d= -f2)"
```

---

## 14. Security Checklist Sebelum Go-Live

- [ ] `SIMIS_OPS_KEY` minimal 32 karakter (generate: `openssl rand -hex 32`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak ada di kode frontend sama sekali
- [ ] `NEXT_PUBLIC_*` hanya berisi nilai non-rahasia
- [ ] `ALLOWED_ORIGIN` di-set ke domain produksi yang tepat (bukan `*`)
- [ ] Minimal satu user punya role `super_admin` (via SQL, section 2.6)
- [ ] Email confirmation aktif di Supabase Auth
- [ ] Supabase RLS (Row Level Security) aktif pada tabel sensitif
