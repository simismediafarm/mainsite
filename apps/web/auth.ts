import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

if (!process.env.EMAIL_SERVER) {
  process.env.EMAIL_SERVER = "smtp://localhost:25";
}
if (!process.env.EMAIL_FROM) {
  process.env.EMAIL_FROM = "noreply@localhost";
}

let prismaInstance: PrismaClient | null = null;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!prismaInstance) {
      if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = "postgresql://postgres:%40Zasper123.@db.mbdezvvnzonsazzaolxw.supabase.co:5432/postgres?schema=public";
      }
      const { prisma } = require('@simis/database');
      prismaInstance = prisma;
    }
    const value = Reflect.get(prismaInstance, prop);
    if (typeof value === 'function') {
      return value.bind(prismaInstance);
    }
    return value;
  }
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GitHub,
    Google,
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      // You can add role here if extended
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding'
  }
});
