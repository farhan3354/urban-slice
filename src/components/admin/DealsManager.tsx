"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Pencil,
  Tags,
  AlertTriangle,
  Loader2,
  Ticket,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading, RowSkeleton } from "@/components/admin/Loading";
import { extractErrors, type ApiError, type Deal } from "@/components/admin/types";
import { slugify, formatPKR, formatShortDate } from "@/lib/format";

type FormState = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  price: string;
  oldPrice: string;
  active: boolean;
  startDate: string;
  endDate: string;
  couponCode: string;
  badge: string;
  itemsJson: string;
};

function blankForm(): FormState {
  return {
    title: "",
    slug: "",
    description: "",
    imageUrl: null,
    price: "",
    oldPrice: "",
    active: true,
    startDate: "",
    endDate: "",
    couponCode: "",
    badge: "",
    itemsJson: "[]",
  };
}

function fromDeal(d: Deal): FormState {
  return {
    title: d.title,
    slug: d.slug,
    description: d.description || "",
    imageUrl: d.imageUrl,
    price: String(d.price),
    oldPrice: d.oldPrice != null ? String(d.oldPrice) : "",
    active: d.active,
    startDate: d.startDate ? d.startDate.slice(0, 10) : "",
    endDate: d.endDate ? d.endDate.slice(0, 10) : "",
    couponCode: d.couponCode || "",
    badge: d.badge || "",
    itemsJson: d.itemsJson || "[]",
  };
}

export function DealsManager() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Deal | null>(null);
  const [form, setForm] = React.useState<FormState>(blankForm());
  const [errors, setErrors] = React.useState<ApiError[]>([]);
  const [slugTouched, setSlugTouched] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/deals", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(blankForm());
    setSlugTouched(false);
    setErrors([]);
    setDialogOpen(true);
  };

  const openEdit = (d: Deal) => {
    setEditTarget(d);
    setForm(fromDeal(d));
    setSlugTouched(true);
    setErrors([]);
    setDialogOpen(true);
  };

  const validate = (): ApiError[] => {
    const errs: ApiError[] = [];
    if (form.title.trim().length < 2)
      errs.push({ field: "title", message: "Title must be at least 2 chars" });
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0)
      errs.push({ field: "price", message: "Enter a valid price" });
    if (form.oldPrice) {
      const op = parseFloat(form.oldPrice);
      if (isNaN(op) || op < 0)
        errs.push({ field: "oldPrice", message: "Old price invalid" });
      else if (!isNaN(price) && op <= price)
        errs.push({
          field: "oldPrice",
          message: "Old price should be above deal price",
        });
    }
    try {
      JSON.parse(form.itemsJson);
    } catch {
      errs.push({
        field: "itemsJson",
        message: "Items JSON is invalid",
      });
    }
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSavingId("form");
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug ? slugify(form.slug) : undefined,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        price: parseFloat(form.price),
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
        active: form.active,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        couponCode: form.couponCode || null,
        badge: form.badge || null,
        itemsJson: form.itemsJson,
      };
      const res = editTarget
        ? await fetch(`/api/admin/deals/${editTarget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        setErrors(errs);
        toast.error(errs[0]?.message || "Save failed");
        return;
      }
      toast.success(editTarget ? "Deal updated" : "Deal created");
      setDialogOpen(false);
      void load();
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        toast.error(errs[0]?.message || "Delete failed");
        return;
      }
      toast.success("Deal deleted");
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Deals
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage promotional combos and coupon-badged deals.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New deal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Deals ({deals.length})
          </CardTitle>
          <CardDescription>
            Active deals appear on the homepage if in date range.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <RowSkeleton count={4} />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load deals"
              description={error}
              action={<Button onClick={load}>Retry</Button>}
            />
          ) : deals.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No deals yet"
              description="Add your first combo or promotional deal."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  New deal
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Old</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                        {d.imageUrl ? (
                          <Image
                            src={d.imageUrl}
                            alt={d.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Tags className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{d.title}</div>
                      {d.badge && (
                        <Badge variant="secondary" className="mt-0.5 text-[10px]">
                          {d.badge}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-primary">
                      {formatPKR(d.price)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {d.oldPrice != null ? (
                        <span className="line-through">
                          {formatPKR(d.oldPrice)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {d.couponCode ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {d.couponCode}
                        </code>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.startDate || d.endDate ? (
                        <span>
                          {d.startDate ? formatShortDate(d.startDate) : "—"}
                          {" → "}
                          {d.endDate ? formatShortDate(d.endDate) : "—"}
                        </span>
                      ) : (
                        "Always"
                      )}
                    </TableCell>
                    <TableCell>
                      {d.active ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-100 text-emerald-700"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted-foreground/30 bg-muted text-muted-foreground"
                        >
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={() => openEdit(d)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              aria-label="Delete"
                              disabled={deletingId === d.id}
                            >
                              {deletingId === d.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete &ldquo;{d.title}&rdquo;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the deal.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(d.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit deal" : "New deal"}
            </DialogTitle>
            <DialogDescription>
              Build a promotional combo. Items JSON describes contents shown
              to customers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="deal-title">Title *</Label>
                <Input
                  id="deal-title"
                  value={form.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((p) => ({
                      ...p,
                      title: v,
                      slug: slugTouched ? p.slug : slugify(v),
                    }));
                  }}
                  placeholder="e.g. Family Feast Combo"
                />
                {errors.find((e) => e.field === "title") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "title")!.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-slug">Slug</Label>
                <Input
                  id="deal-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((p) => ({ ...p, slug: e.target.value }));
                  }}
                  placeholder="auto-from-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-badge">Badge</Label>
                <Input
                  id="deal-badge"
                  value={form.badge}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, badge: e.target.value }))
                  }
                  placeholder="e.g. Best Value"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="deal-desc">Description</Label>
                <Textarea
                  id="deal-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="What's included, what's the deal?"
                />
              </div>
              <ImageUpload
                label="Image"
                value={form.imageUrl}
                onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
                className="md:col-span-2"
              />
              <div className="space-y-1.5">
                <Label htmlFor="deal-price">Price (Rs.) *</Label>
                <Input
                  id="deal-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="1500"
                />
                {errors.find((e) => e.field === "price") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "price")!.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-old">Old price (optional)</Label>
                <Input
                  id="deal-old"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.oldPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, oldPrice: e.target.value }))
                  }
                  placeholder="2200"
                />
                {errors.find((e) => e.field === "oldPrice") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "oldPrice")!.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-start">Start date</Label>
                <Input
                  id="deal-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-end">End date</Label>
                <Input
                  id="deal-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-coupon">Coupon code</Label>
                <div className="relative">
                  <Ticket className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="deal-coupon"
                    value={form.couponCode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, couponCode: e.target.value }))
                    }
                    placeholder="FAMILY1500"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 md:col-span-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Show this deal publicly.
                  </p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, active: v }))
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="deal-items">Items JSON</Label>
                <Textarea
                  id="deal-items"
                  rows={4}
                  value={form.itemsJson}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, itemsJson: e.target.value }))
                  }
                  className="font-mono text-xs"
                  placeholder={`[
  {"name":"Large Pepperoni Pizza","qty":1},
  {"name":"1.5L Drink","qty":1}
]`}
                />
                {errors.find((e) => e.field === "itemsJson") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "itemsJson")!.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  List of items in the deal. Must be valid JSON.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={savingId === "form"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingId === "form"}>
                {savingId === "form" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {editTarget ? "Save changes" : "Create deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
