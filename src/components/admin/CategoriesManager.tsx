"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, ChevronUp, ChevronDown, FolderTree, AlertTriangle, Loader2 } from "lucide-react";
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
  DialogTrigger,
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
import { extractErrors, type ApiError, type Category } from "@/components/admin/types";
import { slugify } from "@/lib/format";

type EditState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  order: number;
  active: boolean;
};

function blank(): EditState {
  return {
    name: "",
    slug: "",
    description: "",
    imageUrl: null,
    order: 0,
    active: true,
  };
}

export function CategoriesManager() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState<EditState>(blank());
  const [errors, setErrors] = React.useState<ApiError[]>([]);
  const [slugTouched, setSlugTouched] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(data.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    const nextOrder = items.length > 0 ? Math.max(...items.map((c) => c.order)) + 1 : 0;
    setForm({ ...blank(), order: nextOrder });
    setSlugTouched(false);
    setErrors([]);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      imageUrl: c.imageUrl,
      order: c.order,
      active: c.active,
    });
    setSlugTouched(true);
    setErrors([]);
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (form.name.trim().length < 2) {
      setErrors([{ field: "name", message: "Name must be at least 2 chars" }]);
      return;
    }
    setSavingId("form");
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug ? slugify(form.slug) : undefined,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        order: form.order,
        active: form.active,
      };
      const res = editTarget
        ? await fetch(`/api/admin/categories/${editTarget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/categories", {
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
      toast.success(editTarget ? "Category updated" : "Category created");
      setDialogOpen(false);
      void load();
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setSavingId(null);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const arr = [...items];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setItems(arr.map((c, i) => ({ ...c, order: i })));
    // Persist order for the two swapped items.
    const a = arr[idx];
    const b = arr[j];
    for (const cat of [a, b]) {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.imageUrl,
          order: cat.order,
          active: cat.active,
        }),
      });
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        toast.error(errs[0]?.message || "Delete failed");
        return;
      }
      toast.success("Category deleted");
      setItems((prev) => prev.filter((c) => c.id !== id));
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
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Organise the menu into categories. Drag-equivalent up/down reordering.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Categories ({items.length})
          </CardTitle>
          <CardDescription>Order is the public display order.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <RowSkeleton count={5} />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load categories"
              description={error}
              action={<Button onClick={load}>Retry</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No categories yet"
              description="Add your first category to start building the menu."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  New category
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Move up"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          className="size-7"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Move down"
                          onClick={() => move(idx, 1)}
                          disabled={idx === items.length - 1}
                          className="size-7"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {c.order}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-muted-foreground">
                          {c.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {c.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {c._count?.products ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.active ? (
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
                          onClick={() => openEdit(c)}
                          aria-label="Edit"
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
                              disabled={
                                (c._count?.products ?? 0) > 0 || deletingId === c.id
                              }
                            >
                              {deletingId === c.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete &ldquo;{c.name}&rdquo;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {(c._count?.products ?? 0) > 0
                                  ? `Move or delete the ${c._count?.products} product(s) in this category first.`
                                  : "This permanently removes the category. This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(c.id)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit category" : "New category"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update category details. Order can be changed later."
                : "Add a new category to organise the menu."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({
                    ...p,
                    name: v,
                    slug: slugTouched ? p.slug : slugify(v),
                  }));
                }}
                placeholder="e.g. Pizzas"
              />
              {errors.find((e) => e.field === "name") && (
                <p className="text-xs text-destructive">
                  {errors.find((e) => e.field === "name")!.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((p) => ({ ...p, slug: e.target.value }));
                }}
                placeholder="auto-from-name"
              />
              <p className="text-xs text-muted-foreground">
                Used in the public URL: <code>/menu/[slug]</code>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short category description"
              />
            </div>
            <ImageUpload
              label="Cover image"
              value={form.imageUrl}
              onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
              aspect="aspect-video"
            />
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Visible on the public menu.
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
              />
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
                {editTarget ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
