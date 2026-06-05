import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:%40Zasper123.@db.mbdezvvnzonsazzaolxw.supabase.co:5432/postgres?schema=public"
  }
});
