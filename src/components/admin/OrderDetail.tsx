"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  Phone,
  MapPin,
  StickyNote,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading } from "@/components/admin/Loading";
import {
  STATUS_META,
  STATUS_TRANSITIONS,
  extractErrors,
  type Order,
  type OrderStatus,
} from "@/components/admin/types";
import { formatPKR, formatDate } from "@/lib/format";

export function OrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [notesDirty, setNotesDirty] = React.useState(false);
  const [notesSaving, setNotesSaving] = React.useState(false);
  const notesTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setOrder(data.order);
      setNotes(data.order?.internalNotes || "");
      setNotesDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: { status?: OrderStatus; internalNotes?: string }) => {
    setUpdating(JSON.stringify(body));
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        toast.error(errs[0]?.message || "Update failed");
        return;
      }
      setOrder(data.order);
      if (body.internalNotes !== undefined) {
        setNotesDirty(false);
      }
      if (body.status) {
        toast.success(`Status updated to ${STATUS_META[body.status].label}`);
      } else if (body.internalNotes !== undefined) {
        toast.success("Notes saved");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setUpdating(null);
    }
  };

  const onStatus = (s: OrderStatus) => {
    void patch({ status: s });
  };

  const onNotesChange = (v: string) => {
    setNotes(v);
    setNotesDirty(true);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      void saveNotesNow(v);
    }, 1200);
  };

  const saveNotesNow = async (v?: string) => {
    const value = v ?? notes;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: value }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        toast.error(errs[0]?.message || "Failed to save notes");
        return;
      }
      setOrder(data.order);
      setNotesDirty(false);
    } catch {
      // silent
    } finally {
      setNotesSaving(false);
    }
  };

  const onPrint = () => {
    window.print();
  };

  if (loading) return <Loading />;
  if (error || !order) {
    return (
      <div className="space-y-4">
        <BackButton />
        <EmptyState
          icon={ShoppingBag}
          title="Order not found"
          description={error || "It may have been deleted."}
          action={
            <Button asChild>
              <Link href="/admin/orders">Back to orders</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const allowed = STATUS_TRANSITIONS[order.status] || [];
  const whatsappUrl = buildWhatsAppUrl(order);

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {order.orderRef}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onPrint}>
              <Printer className="size-4" />
              Print receipt
            </Button>
            {whatsappUrl && (
              <Button asChild variant="outline">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Reopen WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Status workflow
            </CardTitle>
            <CardDescription>
              Allowed transitions are enabled. Invalid actions are disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">Current:</span>
                <StatusBadge status={order.status} />
              </div>
              <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
              {allowed.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No further transitions available (terminal state).
                </span>
              ) : (
                allowed.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    onClick={() => onStatus(s)}
                    disabled={updating !== null}
                    variant={s === "cancelled" ? "destructive" : "default"}
                  >
                    {updating === JSON.stringify({ status: s }) && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Move to {STATUS_META[s].label}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-display text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Name" value={order.customerName} />
              <Row
                label="Phone"
                value={
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {order.customerPhone}
                  </a>
                }
              />
              <Row
                label="Type"
                value={
                  <span className="capitalize">{order.type}</span>
                }
              />
              {order.type === "delivery" && (
                <>
                  {order.address && (
                    <Row
                      label="Address"
                      value={
                        <span className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          {order.address}
                        </span>
                      }
                    />
                  )}
                  {order.area && <Row label="Area" value={order.area} />}
                </>
              )}
              {order.notes && (
                <Row
                  label="Notes"
                  value={
                    <span className="flex items-start gap-1.5">
                      <StickyNote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {order.notes}
                    </span>
                  }
                />
              )}
              {order.couponCode && (
                <Row
                  label="Coupon"
                  value={
                    <Badge variant="secondary" className="font-mono text-xs">
                      {order.couponCode}
                    </Badge>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Items + totals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-base">
                Items
              </CardTitle>
              <CardDescription>
                {order.items.length} line{order.items.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {it.name}
                        </div>
                        {it.options?.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {it.options.map((o, i) => (
                              <li key={i}>
                                {o.groupName}: {o.optionName}
                                {o.priceModifier > 0 && (
                                  <span className="ml-1 text-muted-foreground/80">
                                    (+{formatPKR(o.priceModifier)})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {it.specialInstructions && (
                          <p className="mt-1 text-xs italic text-amber-700">
                            Note: {it.specialInstructions}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{it.qty}</TableCell>
                      <TableCell className="text-right">
                        {formatPKR(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPKR(it.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <Line label="Subtotal" value={formatPKR(order.subtotal)} />
                {order.deliveryFee > 0 && (
                  <Line
                    label="Delivery fee"
                    value={formatPKR(order.deliveryFee)}
                  />
                )}
                {order.discount > 0 && (
                  <Line
                    label="Discount"
                    value={`-${formatPKR(order.discount)}`}
                    className="text-emerald-700"
                  />
                )}
                <Separator />
                <Line
                  label="Total"
                  value={formatPKR(order.total)}
                  strong
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline + Internal notes */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <TimelineRow
                icon={Clock}
                label="Created"
                value={formatDate(order.createdAt)}
              />
              <TimelineRow
                icon={MessageCircle}
                label="WhatsApp sent"
                value={
                  order.whatsappSentAt ? formatDate(order.whatsappSentAt) : "—"
                }
                muted={!order.whatsappSentAt}
              />
              <TimelineRow
                icon={CheckCircle2}
                label="Confirmed"
                value={
                  order.confirmedAt ? formatDate(order.confirmedAt) : "—"
                }
                muted={!order.confirmedAt}
              />
              <TimelineRow
                icon={CheckCircle2}
                label="Completed"
                value={
                  order.completedAt ? formatDate(order.completedAt) : "—"
                }
                muted={!order.completedAt}
              />
              <TimelineRow
                icon={XCircle}
                label="Cancelled"
                value={
                  order.cancelledAt ? formatDate(order.cancelledAt) : "—"
                }
                muted={!order.cancelledAt}
                danger={!!order.cancelledAt}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-display text-base">
                    Internal notes
                  </CardTitle>
                  <CardDescription>
                    Auto-saves on stop. Not visible to the customer.
                  </CardDescription>
                </div>
                {notesSaving && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Saving…
                  </span>
                )}
                {notesDirty && !notesSaving && (
                  <span className="text-xs text-amber-600">Unsaved</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={6}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                onBlur={() => {
                  if (notesTimer.current) clearTimeout(notesTimer.current);
                  if (notesDirty) void saveNotesNow();
                }}
                placeholder="Add kitchen or staff notes…"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void saveNotesNow()}
                  disabled={!notesDirty || notesSaving}
                >
                  Save now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable receipt */}
      <ReceiptPrintView order={order} />
    </div>
  );
}

function BackButton() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/admin/orders">
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>
    </Button>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        strong ? "font-display text-base font-semibold" : ""
      } ${className || ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TimelineRow({
  icon: Icon,
  label,
  value,
  muted,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-8 items-center justify-center rounded-full ${
          danger
            ? "bg-red-100 text-red-700"
            : muted
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ReceiptPrintView({ order }: { order: Order }) {
  const lines: string[] = [];
  lines.push("================================");
  lines.push(`  ${order.orderRef}`);
  lines.push("================================");
  lines.push(`Customer: ${order.customerName}`);
  lines.push(`Phone: ${order.customerPhone}`);
  lines.push(`Type: ${order.type.toUpperCase()}`);
  if (order.type === "delivery" && order.address) {
    lines.push(`Address: ${order.address}`);
    if (order.area) lines.push(`Area: ${order.area}`);
  }
  lines.push(`Date: ${formatDate(order.createdAt)}`);
  lines.push("--------------------------------");
  order.items.forEach((it, i) => {
    lines.push(
      `${i + 1}. ${it.name} x${it.qty}   ${formatPKR(it.lineTotal)}`,
    );
    it.options?.forEach((o) =>
      lines.push(`    - ${o.groupName}: ${o.optionName}`),
    );
  });
  lines.push("--------------------------------");
  lines.push(`Subtotal:        ${formatPKR(order.subtotal)}`);
  if (order.deliveryFee > 0)
    lines.push(`Delivery:        ${formatPKR(order.deliveryFee)}`);
  if (order.discount > 0)
    lines.push(`Discount:       -${formatPKR(order.discount)}`);
  lines.push(`TOTAL:           ${formatPKR(order.total)}`);
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  lines.push("================================");
  lines.push(`Status: ${STATUS_META[order.status].label}`);

  return (
    <div className="print-only">
      <pre className="whitespace-pre-wrap font-mono text-xs leading-tight">
{lines.join("\n")}
      </pre>
    </div>
  );
}

function buildWhatsAppUrl(order: Order): string | null {
  if (typeof window === "undefined") return null;
  const msg = buildOrderMessage(order);
  const number = order.customerPhone.replace(/\D/g, "");
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

function buildOrderMessage(order: Order): string {
  const cur = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
  const L: string[] = [];
  L.push("*Urban Slice Pizza*");
  L.push(`Order — ${order.orderRef}`);
  L.push("");
  L.push(`*Customer:* ${order.customerName}`);
  L.push(`*Phone:* ${order.customerPhone}`);
  L.push(`*Type:* ${order.type === "delivery" ? "Home Delivery" : "Pickup"}`);
  if (order.type === "delivery" && order.address) {
    L.push(`*Address:* ${order.address}`);
    if (order.area) L.push(`*Area:* ${order.area}`);
  }
  if (order.notes) L.push(`*Notes:* ${order.notes}`);
  L.push("");
  L.push("*Order Items*");
  order.items.forEach((l, i) => {
    L.push(`${i + 1}. ${l.name} × ${l.qty} — ${cur(l.lineTotal)}`);
    l.options?.forEach((o) =>
      L.push(
        `   • ${o.groupName}: ${o.optionName}${
          o.priceModifier > 0 ? ` (+${cur(o.priceModifier)})` : ""
        }`,
      ),
    );
    if (l.specialInstructions) L.push(`   • Note: ${l.specialInstructions}`);
  });
  L.push("");
  L.push(`Subtotal: ${cur(order.subtotal)}`);
  if (order.deliveryFee > 0)
    L.push(`Delivery fee: ${cur(order.deliveryFee)}`);
  if (order.discount > 0) L.push(`Discount: -${cur(order.discount)}`);
  L.push(`*Total: ${cur(order.total)}*`);
  return L.join("\n");
}
