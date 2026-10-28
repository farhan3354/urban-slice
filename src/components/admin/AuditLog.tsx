"use client";

import * as React from "react";
import { History, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading, RowSkeleton } from "@/components/admin/Loading";
import { Pagination } from "@/components/admin/Pagination";
import { useQueryState } from "@/components/admin/useQueryState";
import type { AuditEvent } from "@/components/admin/types";
import { formatDate } from "@/lib/format";

export function AuditLog() {
  const [pageStr, setPage] = useQueryState("page", "1");
  const [pageSizeStr, setPageSize] = useQueryState("pageSize", "50");
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const pageSize = Math.max(1, parseInt(pageSizeStr || "50", 10) || 50);

  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const renderAction = (a: string) => {
    const variant =
      a.endsWith(".delete")
        ? "destructive"
        : a.endsWith(".create")
        ? "default"
        : "secondary";
    return (
      <Badge variant={variant} className="font-mono text-[11px]">
        {a}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Audit log
        </h1>
        <p className="text-sm text-muted-foreground">
          Trail of admin actions (login, product/category/deal changes, order
          status updates, settings saves).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Events ({total})</CardTitle>
          <CardDescription>
            Click a row to view its metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <RowSkeleton count={8} />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load audit log"
              description={error}
              action={<Button onClick={load}>Retry</Button>}
            />
          ) : events.length === 0 ? (
            <EmptyState
              icon={History}
              title="No events yet"
              description="Admin actions will be recorded here."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => {
                    const isOpen = expanded === e.id;
                    return (
                      <React.Fragment key={e.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : e.id)}
                        >
                          <TableCell>{renderAction(e.action)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {e.target}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-foreground">
                              {e.admin?.name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {e.admin?.email || ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDate(e.createdAt)}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={4} className="p-3">
                              <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs">
                                {formatMeta(e.metadata)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="px-4 pb-2">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  totalPages={totalPages}
                  onPage={(p) => setPage(String(p))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMeta(m: unknown): string {
  if (m == null) return "—";
  try {
    return JSON.stringify(m, null, 2);
  } catch {
    return String(m);
  }
}
