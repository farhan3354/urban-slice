"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ShoppingBag,
  MessageCircle,
  ChefHat,
  CheckCircle2,
  DollarSign,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading } from "@/components/admin/Loading";
import type { DashboardData, OrderStatus } from "@/components/admin/types";
import { formatPKR, timeAgo, formatShortDate } from "@/lib/format";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 13);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">
        {label ? formatShortDate(label) : ""}
      </p>
      <p className="mt-0.5 text-primary">
        Sales: {formatPKR(payload[0].value)}
      </p>
    </div>
  );
}

export function DashboardView() {
  const range = React.useRef(defaultRange());
  const [from, setFrom] = React.useState(range.current.from);
  const [to, setTo] = React.useState(range.current.to);
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/admin/dashboard?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <Loading />;
  if (error || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load dashboard"
        description={error || "Please retry."}
        action={
          <Button onClick={load} variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  const c = data.counts;
  const chartData = data.salesSeries.map((p) => ({
    day: p.day,
    value: p.value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Sales and order overview for Urban Slice Pizza.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.isDemoData && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-100 text-amber-900"
            >
              Demo data
            </Badge>
          )}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-[150px]"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-[150px]"
              aria-label="To date"
            />
            <Button size="sm" variant="outline" onClick={load}>
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Orders"
          value={c.total}
          icon={ShoppingBag}
          accent="primary"
          hint={`${data.orderCount} fetched`}
        />
        <StatCard
          label="Pending WhatsApp"
          value={c.pendingWhatsApp}
          icon={MessageCircle}
          accent="amber"
        />
        <StatCard
          label="Preparing"
          value={c.preparing}
          icon={ChefHat}
          accent="gold"
        />
        <StatCard
          label="Completed"
          value={c.completed}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Sales Total"
          value={formatPKR(data.salesTotal)}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Cancelled"
          value={c.cancelled}
          icon={XCircle}
          accent="red"
          hint={formatPKR(data.cancelledTotal)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="font-display text-base">
                  Sales — last 14 days
                </CardTitle>
                <CardDescription>
                  Confirmed → completed order revenue per day.
                </CardDescription>
              </div>
              <TrendingUp className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E63936" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E63936" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EADBC4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d) => formatShortDate(d).split(" ").slice(0, 2).join(" ")}
                    tick={{ fontSize: 11, fill: "#777" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#777" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#E63936"
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                    name="Sales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Orders by status
            </CardTitle>
            <CardDescription>Distribution across the range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusBreakdown
              label="Pending WhatsApp"
              count={c.pendingWhatsApp}
              total={c.total}
              dot="bg-amber-500"
            />
            <StatusBreakdown
              label="Confirmed"
              count={c.confirmed}
              total={c.total}
              dot="bg-slate-500"
            />
            <StatusBreakdown
              label="Preparing"
              count={c.preparing}
              total={c.total}
              dot="bg-yellow-500"
            />
            <StatusBreakdown
              label="Ready"
              count={c.ready}
              total={c.total}
              dot="bg-green-500"
            />
            <StatusBreakdown
              label="Out for Delivery"
              count={c.outForDelivery}
              total={c.total}
              dot="bg-teal-500"
            />
            <StatusBreakdown
              label="Completed"
              count={c.completed}
              total={c.total}
              dot="bg-emerald-500"
            />
            <StatusBreakdown
              label="Cancelled"
              count={c.cancelled}
              total={c.total}
              dot="bg-red-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Popular items + Recent orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Popular items
            </CardTitle>
            <CardDescription>Top sellers by quantity.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.popularItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No sales yet"
                description="Popular items will appear once orders arrive."
              />
            ) : (
              <ol className="space-y-3">
                {data.popularItems.map((item, i) => {
                  const maxQty = data.popularItems[0]?.qty || 1;
                  const pct = Math.round((item.qty / maxQty) * 100);
                  return (
                    <li key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {item.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {item.qty} sold · {formatPKR(item.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="font-display text-base">
                  Recent orders
                </CardTitle>
                <CardDescription>Latest 8 orders placed.</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/orders">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No recent orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recent.map((o) => (
                    <TableRow
                      key={o.orderRef}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/orders?q=${encodeURIComponent(o.orderRef)}`;
                      }}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {o.orderRef}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">
                          {o.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {o.customerPhone}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {o.type}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPKR(o.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status as OrderStatus} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {timeAgo(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Low availability */}
      {data.lowItems.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Unavailable items
                </CardTitle>
                <CardDescription>
                  {data.unavailableCount} product
                  {data.unavailableCount === 1 ? "" : "s"} hidden from the menu.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/menu">Manage menu</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.lowItems.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/menu/${p.id}/edit`}>Edit</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBreakdown({
  label,
  count,
  total,
  dot,
}: {
  label: string;
  count: number;
  total: number;
  dot: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${dot}`} aria-hidden />
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${dot}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
