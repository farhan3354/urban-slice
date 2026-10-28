"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Filter, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading, RowSkeleton } from "@/components/admin/Loading";
import { Pagination } from "@/components/admin/Pagination";
import {
  ALL_STATUSES,
  STATUS_META,
  type Order,
  type OrderStatus,
} from "@/components/admin/types";
import { formatPKR, formatDate } from "@/lib/format";
import { useQueryState } from "@/components/admin/useQueryState";

export function OrdersList() {
  const router = useRouter();
  const [status, setStatus] = useQueryState("status", "all");
  const [q, setQ] = useQueryState("q", "");
  const [from, setFrom] = useQueryState("from", "");
  const [to, setTo] = useQueryState("to", "");
  const [pageStr, setPage] = useQueryState("page", "1");
  const [pageSizeStr, setPageSize] = useQueryState("pageSize", "20");

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const pageSize = Math.max(1, parseInt(pageSizeStr || "20", 10) || 20);

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState(q);

  // Sync search input when URL changes (e.g. dashboard click).
  React.useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", status);
      if (q) params.set("q", q);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [status, q, from, to, page, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput.trim());
    setPage("1");
  };

  const resetFilters = () => {
    setStatus("all");
    setQ("");
    setFrom("");
    setTo("");
    setPage("1");
    setPageSize("20");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          Search, filter and triage customer orders.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Filter className="size-4 text-primary" />
              Filters
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <X className="size-3.5" />
              Reset
            </Button>
          </div>
          <CardDescription>
            Refine by status, search text, or date range.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage("1"); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form
            onSubmit={onSearchSubmit}
            className="space-y-1.5 lg:col-span-2"
          >
            <label className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Order ref, name, phone…"
                  className="pl-8"
                />
              </div>
              <Button type="submit" size="default">
                Search
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage("1"); }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage("1"); }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Page size
            </label>
            <Select
              value={pageSizeStr}
              onValueChange={(v) => { setPageSize(v); setPage("1"); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="gap-1.5">
          <CardTitle className="font-display text-base">
            Orders ({total})
          </CardTitle>
          <CardDescription>
            Click a row to view order detail and update its status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <RowSkeleton count={6} />
            </div>
          ) : error ? (
            <EmptyState
              icon={ShoppingBag}
              title="Couldn't load orders"
              description={error}
              action={<Button onClick={load}>Retry</Button>}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders found"
              description="Try adjusting filters or check back later."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {o.orderRef}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {o.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {o.customerPhone}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {o.type}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {o.items?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPKR(o.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status as OrderStatus} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/admin/orders/${o.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
