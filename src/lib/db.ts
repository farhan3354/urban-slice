import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith("file:")) {
    return envUrl;
  }
  // Fallback to local SQLite database in db/custom.db if DATABASE_URL is missing or non-file (e.g. Vercel Postgres)
  const absolutePath = path.resolve(process.cwd(), "db/custom.db");
  const fallbackUrl = `file:${absolutePath}`;
  process.env.DATABASE_URL = fallbackUrl;
  return fallbackUrl;
}

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;