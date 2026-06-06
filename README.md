# SIMIS Monorepo — Developer Guide

Welcome to the **SIMIS (System Integrated Management & Intelligence System)** developer repository. This is a high-performance Turbo monorepo designed with a Next.js frontend, a Hono API server, background workers, and custom shared modules covering databases, AI routers, reasoning graphs, and self-healing kernels.

---

## 🏗️ Project Architecture

SIMIS uses a **pnpm workspace** monorepo setup managed by **Turborepo** for optimal caching and pipeline execution.

### Applications (`/apps`)
*   **`apps/web`**: The main user interface built with **Next.js 15 (React 19)**, Tailwind CSS, Lucide icons, and Recharts.
*   **`apps/api`**: High-throughput REST API backend built using **Hono**, designed for serverless deployment on Vercel.
*   **`apps/worker`**: Background job and queue processing workers.
*   **`apps/cli`**: Internal developer command-line interfaces.

### Shared Packages (`/packages`)
*   **`@simis/database`**: The unified data access layer utilizing **Prisma ORM**. Includes schemas, client exports, and database utilities.
*   **`@simis/shared`**: Common utility functions, helpers, and configurations.
*   **`@simis/ai-client`** & **`@simis/ai-router`**: AI provider orchestration supporting multiple models (Gemini, Grok, DeepSeek, OpenRouter) with routing policies.
*   **`@simis/ai-cache`**: Edge caching for prompt responses to minimize API costs and latency.
*   **`@simis/registry-core`**: Core system for registering dynamic assets, configurations, and workflows.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
*   **Node.js**: `v20.x` or `v22.x` (Recommended)
*   **PNPM**: `v9.1.0` (as defined in `packageManager` of `package.json`)
*   **PostgreSQL**: A running database instance (Supabase Postgres recommended).
*   **Redis**: Upstash Redis or local instance for rate-limiting and cache layers.

---

## 🚀 Getting Started

### 1. Clone the repository and install dependencies
```bash
pnpm install
```
*Note: A `postinstall` script runs automatically to generate the Prisma Client for the database and api packages.*

### 2. Configure Environment Variables
Copy the template `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in the required keys, paying special attention to:
*   **Supabase credentials** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
*   **PostgreSQL Connection Strings** (`DATABASE_URL`, `DIRECT_URL`)
*   **Upstash Redis / QStash tokens**
*   **Gemini / OpenRouter API Keys** for AI functionalities

### 3. Run Database Migrations
If you make changes to the schema in `packages/database/prisma/schema.prisma`:
```bash
# Push changes to your development database
pnpm --filter @simis/database exec prisma db push

# Or run migrations
pnpm --filter @simis/database exec prisma migrate dev
```

### 4. Run Development Servers
Start Next.js frontend and Hono API concurrently:
```bash
pnpm dev
```
*   **Frontend**: `http://localhost:3000`
*   **API Backend**: `http://localhost:4000` (port defined by `PORT` in `.env`)

---

## 📐 Development Guidelines & Rules

To maintain codebase health and deployment compatibility, developers must follow these strict rules:

### ⚠️ Module Boundaries
*   **Never import directly from `src/` of another package.** Shared packages (e.g., `@simis/shared`, `@simis/ai-cache`) compile to the `dist/` folder. Ensure you import from the package entrypoints and run a build if you update their code:
    ```bash
    pnpm build
    ```

### 🔒 Database Integrity
*   **No direct `PrismaClient` instantiation outside `@simis/database`.** All database interactions should go through the exports provided by the `@simis/database` package to maintain uniform connections, pooling, and tracing.

### ⚙️ Server Boot Requirements
*   `apps/api` executes a strict boot-time environment check. If the required environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`, `REDIS_URL`) are missing, the server will intentionally crash on start. Ensure your development and production configurations have these properly set.

---

## 🧪 Available Scripts

Execute scripts from the root directory using `pnpm`:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Runs development servers for `@simis/api` and `@simis/web`. |
| `pnpm build` | Compiles applications and shared packages for production. |
| `pnpm test` | Runs the test suites across all applications and packages. |
| `pnpm lint` | Validates code style and rules via ESLint / Next.js Lint. |
| `pnpm audit` | Runs custom security and constitutional compliance audits. |
| `pnpm clcoa:run` | Executes real-time cognitive logic audits. |

---

## 📦 Deployment

### Vercel Deployment (API & Web)
*   **API Server (`apps/api`)**: Deployed with Vercel Serverless Functions. The root directory should point to `apps/api` with build command `turbo run build`. The `vercel.json` maps incoming requests correctly.
*   **Web App (`apps/web`)**: Next.js app deployed directly using the Vercel monorepo configuration.