// Admin API guard helpers
import { getSessionAdmin, audit } from "@/lib/auth";
import type { AdminUser } from "@prisma/client";

export async function requireAdmin(): Promise<
  { ok: true; admin: AdminUser } | { ok: false; response: Response }
> {
  const admin = await getSessionAdmin();
  if (!admin) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  return { ok: true, admin };
}

export function getClientIP(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "unknown";
}

export { audit };
