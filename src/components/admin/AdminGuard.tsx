"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLayout } from "./AdminLayout";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  // AdminLayout already includes the auth-guard fetch + redirect.
  return <AdminLayout>{children}</AdminLayout>;
}
