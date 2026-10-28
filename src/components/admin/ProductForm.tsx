"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Star,
  Loader2,
  Save,
  Eye,
  Tag as TagIcon,
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading } from "@/components/admin/Loading";
import {
  extractErrors,
  type ApiError,
  type Category,
  type SerializedOptionGroup,
  type SerializedProduct,
} from "@/components/admin/types";
import { slugify, formatPKR } from "@/lib/format";
import Link from "next/link";

type FormState = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: string;
  promoPrice: string;
  imageUrl: string | null;
  prepTimeMin: string;
  available: boolean;
  featured: boolean;
  popular: boolean;
  tags: string[];
  optionGroups: SerializedOptionGroup[];
};

const COMMON_KEYS = [
  "size",
  "crust",
  "toppings",
  "dips",
  "flavor",
  "spice_level",
  "extras",
  "drink",
  "side",
];

function newGroup(order: number): SerializedOptionGroup {
  return {
    name: "",
    key: "size",
    type: "single",
    required: false,
    min: 0,
    max: 1,
    order,
    options: [],
  };
}

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = !!productId;

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingMeta, setLoadingMeta] = React.useState(true);
  const [loadingProduct, setLoadingProduct] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<ApiError[]>([]);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [tagInput, setTagInput] = React.useState("");

  const [form, setForm] = React.useState<FormState>({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    basePrice: "",
    promoPrice: "",
    imageUrl: null,
    prepTimeMin: "20",
    available: true,
    featured: false,
    popular: false,
    tags: [],
    optionGroups: [],
  });

  // Load categories (and product if editing).
  React.useEffect(() => {
    (async () => {
      try {
        const cRes = await fetch("/api/admin/categories", { cache: "no-store" });
        const cJson = await cRes.json();
        setCategories(cJson.categories || []);
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const p: SerializedProduct = data.product;
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          categoryId: p.categoryId,
          basePrice: String(p.basePrice),
          promoPrice: p.promoPrice != null ? String(p.promoPrice) : "",
          imageUrl: p.imageUrl,
          prepTimeMin: String(p.prepTimeMin),
          available: p.available,
          featured: p.featured,
          popular: p.popular,
          tags: p.tags || [],
          optionGroups: (p.optionGroups || []).map((g) => ({
            ...g,
            options: g.options.map((o) => ({ ...o })),
          })),
        });
        setSlugTouched(true);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load product");
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [productId]);

  const update = React.useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "name" && !slugTouched) {
          next.slug = slugify(value as string);
        }
        return next;
      });
    },
    [slugTouched],
  );

  // Tags
  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (form.tags.includes(t)) return;
    setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput("");
  };
  const removeTag = (t: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));
  };

  // Option groups
  const addGroup = () => {
    setForm((p) => ({
      ...p,
      optionGroups: [...p.optionGroups, newGroup(p.optionGroups.length)],
    }));
  };
  const removeGroup = (idx: number) => {
    setForm((p) => ({
      ...p,
      optionGroups: p.optionGroups
        .filter((_, i) => i !== idx)
        .map((g, i) => ({ ...g, order: i })),
    }));
  };
  const moveGroup = (idx: number, dir: -1 | 1) => {
    setForm((p) => {
      const arr = [...p.optionGroups];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return {
        ...p,
        optionGroups: arr.map((g, i) => ({ ...g, order: i })),
      };
    });
  };
  const updateGroup = (idx: number, patch: Partial<SerializedOptionGroup>) => {
    setForm((p) => ({
      ...p,
      optionGroups: p.optionGroups.map((g, i) =>
        i === idx ? { ...g, ...patch } : g,
      ),
    }));
  };
  const addOption = (gi: number) => {
    setForm((p) => ({
      ...p,
      optionGroups: p.optionGroups.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: [
                ...g.options,
                {
                  name: "",
                  priceModifier: 0,
                  order: g.options.length,
                  defaultSel: false,
                },
              ],
            }
          : g,
      ),
    }));
  };
  const removeOption = (gi: number, oi: number) => {
    setForm((p) => ({
      ...p,
      optionGroups: p.optionGroups.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: g.options
                .filter((_, j) => j !== oi)
                .map((o, j) => ({ ...o, order: j })),
            }
          : g,
      ),
    }));
  };
  const updateOption = (gi: number, oi: number, patch: Record<string, any>) => {
    setForm((p) => ({
      ...p,
      optionGroups: p.optionGroups.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === oi ? { ...o, ...patch } : o,
              ),
            }
          : g,
      ),
    }));
  };

  const validate = (): ApiError[] => {
    const errs: ApiError[] = [];
    if (!form.name || form.name.trim().length < 2)
      errs.push({ field: "name", message: "Name must be at least 2 chars" });
    if (!form.categoryId)
      errs.push({ field: "categoryId", message: "Select a category" });
    const base = parseFloat(form.basePrice);
    if (isNaN(base) || base < 0)
      errs.push({ field: "basePrice", message: "Enter a valid base price" });
    if (form.promoPrice) {
      const pp = parseFloat(form.promoPrice);
      if (isNaN(pp) || pp < 0)
        errs.push({ field: "promoPrice", message: "Promo price invalid" });
      else if (!isNaN(base) && pp >= base)
        errs.push({
          field: "promoPrice",
          message: "Promo price should be below base price",
        });
    }
    const pt = parseInt(form.prepTimeMin, 10);
    if (isNaN(pt) || pt < 0)
      errs.push({ field: "prepTimeMin", message: "Prep time invalid" });
    form.optionGroups.forEach((g, i) => {
      if (!g.name.trim())
        errs.push({
          field: `optionGroups.${i}.name`,
          message: `Group ${i + 1}: name required`,
        });
      if (!g.key.trim())
        errs.push({
          field: `optionGroups.${i}.key`,
          message: `Group ${i + 1}: key required`,
        });
      if (g.type === "multiple" && g.min > g.max)
        errs.push({
          field: `optionGroups.${i}.min`,
          message: `Group ${i + 1}: min cannot exceed max`,
        });
      if (g.options.length === 0 && g.required)
        errs.push({
          field: `optionGroups.${i}.options`,
          message: `Group ${i + 1}: required group needs at least one option`,
        });
    });
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
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug ? slugify(form.slug) : undefined,
        description: form.description || null,
        categoryId: form.categoryId,
        basePrice: parseFloat(form.basePrice),
        promoPrice: form.promoPrice ? parseFloat(form.promoPrice) : null,
        imageUrl: form.imageUrl || null,
        prepTimeMin: parseInt(form.prepTimeMin, 10),
        available: form.available,
        featured: form.featured,
        popular: form.popular,
        tags: form.tags,
        optionGroups: form.optionGroups.map((g, i) => ({
          ...g,
          order: i,
          options: g.options.map((o, j) => ({ ...o, order: j })),
        })),
      };
      const res = isEdit
        ? await fetch(`/api/admin/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/products", {
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
      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/menu");
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loadingMeta || (isEdit && loadingProduct)) return <Loading />;

  const fieldErr = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  const base = parseFloat(form.basePrice) || 0;
  const promo = form.promoPrice ? parseFloat(form.promoPrice) : null;
  const effectivePrice = promo != null ? promo : base;
  const categoryName =
    categories.find((c) => c.id === form.categoryId)?.name || "—";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/menu">
              <ArrowLeft className="size-4" />
              Back to menu
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isEdit ? "Edit product" : "New product"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/menu")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basics */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Basics
              </CardTitle>
              <CardDescription>
                Name, slug, category and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                />
                {fieldErr("name") && (
                  <p className="text-xs text-destructive">{fieldErr("name")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", e.target.value);
                  }}
                  placeholder="auto-from-name"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-generate from name.
                </p>
                {fieldErr("slug") && (
                  <p className="text-xs text-destructive">{fieldErr("slug")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => update("categoryId", v)}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErr("categoryId") && (
                  <p className="text-xs text-destructive">
                    {fieldErr("categoryId")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Short appetizing description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & flags */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Pricing &amp; availability
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="basePrice">Base price (Rs.) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) => update("basePrice", e.target.value)}
                  placeholder="1200"
                />
                {fieldErr("basePrice") && (
                  <p className="text-xs text-destructive">
                    {fieldErr("basePrice")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promoPrice">Promo price (optional)</Label>
                <Input
                  id="promoPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.promoPrice}
                  onChange={(e) => update("promoPrice", e.target.value)}
                  placeholder="990"
                />
                {fieldErr("promoPrice") && (
                  <p className="text-xs text-destructive">
                    {fieldErr("promoPrice")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prepTimeMin">Prep time (min)</Label>
                <Input
                  id="prepTimeMin"
                  type="number"
                  min="0"
                  max="180"
                  value={form.prepTimeMin}
                  onChange={(e) => update("prepTimeMin", e.target.value)}
                />
                {fieldErr("prepTimeMin") && (
                  <p className="text-xs text-destructive">
                    {fieldErr("prepTimeMin")}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  label="Image"
                  value={form.imageUrl}
                  onChange={(v) => update("imageUrl", v)}
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <SwitchRow
                  label="Available"
                  description="Show this product on the public menu."
                  checked={form.available}
                  onChange={(v) => update("available", v)}
                />
                <SwitchRow
                  label="Featured"
                  description="Highlight on the homepage hero section."
                  checked={form.featured}
                  onChange={(v) => update("featured", v)}
                />
                <SwitchRow
                  label="Popular"
                  description="Show a Popular badge on the product card."
                  checked={form.popular}
                  onChange={(v) => update("popular", v)}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="tagInput">Tags</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="tagInput"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="spicy, vegetarian, new"
                      className="pl-8"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(tagInput)}
                  >
                    Add
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label={`Remove ${t}`}
                          className="rounded-sm px-1 text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Option groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-display text-base">
                    Option groups
                  </CardTitle>
                  <CardDescription>
                    e.g. Size (single), Toppings (multiple). Saved in order.
                  </CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addGroup}>
                  <Plus className="size-4" />
                  Add group
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.optionGroups.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="No option groups"
                  description="Add groups like Size, Crust, Toppings, Dips."
                  action={
                    <Button type="button" size="sm" onClick={addGroup}>
                      <Plus className="size-4" />
                      Add group
                    </Button>
                  }
                />
              ) : (
                form.optionGroups.map((g, gi) => (
                  <div
                    key={gi}
                    className="rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <GripVertical className="size-4 text-muted-foreground" />
                        Group {gi + 1}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Move up"
                          onClick={() => moveGroup(gi, -1)}
                          disabled={gi === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Move down"
                          onClick={() => moveGroup(gi, 1)}
                          disabled={gi === form.optionGroups.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove group"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeGroup(gi)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Group name *</Label>
                          <Input
                            value={g.name}
                            onChange={(e) =>
                              updateGroup(gi, { name: e.target.value })
                            }
                            placeholder="e.g. Size"
                          />
                          {fieldErr(`optionGroups.${gi}.name`) && (
                            <p className="text-xs text-destructive">
                              {fieldErr(`optionGroups.${gi}.name`)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Key</Label>
                          <Select
                            value={g.key}
                            onValueChange={(v) => updateGroup(gi, { key: v })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_KEYS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {k}
                                </SelectItem>
                              ))}
                              <SelectItem value={g.key}>
                                {g.key} (custom)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Type</Label>
                          <Select
                            value={g.type}
                            onValueChange={(v) =>
                              updateGroup(gi, {
                                type: v as "single" | "multiple",
                                max: v === "single" ? 1 : g.max,
                                min: v === "single" ? 0 : g.min,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">
                                Single (radio)
                              </SelectItem>
                              <SelectItem value="multiple">
                                Multiple (checkboxes)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Min</Label>
                            <Input
                              type="number"
                              min="0"
                              value={g.min}
                              onChange={(e) =>
                                updateGroup(gi, {
                                  min: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              disabled={g.type === "single"}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Max</Label>
                            <Input
                              type="number"
                              min="0"
                              value={g.max}
                              onChange={(e) =>
                                updateGroup(gi, {
                                  max: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              disabled={g.type === "single"}
                            />
                          </div>
                        </div>
                      </div>
                      <SwitchRow
                        label="Required"
                        description="Customer must select at least one option."
                        checked={g.required}
                        onChange={(v) => updateGroup(gi, { required: v })}
                      />
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Options</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addOption(gi)}
                          >
                            <Plus className="size-4" />
                            Add option
                          </Button>
                        </div>
                        {g.options.length === 0 ? (
                          <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                            No options yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {g.options.map((o, oi) => (
                              <div
                                key={oi}
                                className="grid grid-cols-1 gap-2 rounded-md border border-border bg-background p-2 sm:grid-cols-[1fr_120px_120px_auto]"
                              >
                                <Input
                                  value={o.name}
                                  onChange={(e) =>
                                    updateOption(gi, oi, {
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Option name"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={o.priceModifier}
                                  onChange={(e) =>
                                    updateOption(gi, oi, {
                                      priceModifier:
                                        parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="Modifier Rs."
                                />
                                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3">
                                  <Label
                                    htmlFor={`def-${gi}-${oi}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Default
                                  </Label>
                                  <Switch
                                    id={`def-${gi}-${oi}`}
                                    checked={!!o.defaultSel}
                                    onCheckedChange={(v) => {
                                      // single type: only one default allowed
                                      if (v && g.type === "single") {
                                        setForm((p) => ({
                                          ...p,
                                          optionGroups: p.optionGroups.map(
                                            (gg, i) =>
                                              i === gi
                                                ? {
                                                    ...gg,
                                                    options: gg.options.map(
                                                      (oo, j) => ({
                                                        ...oo,
                                                        defaultSel: j === oi,
                                                      }),
                                                    ),
                                                  }
                                                : gg,
                                          ),
                                        }));
                                      } else {
                                        updateOption(gi, oi, {
                                          defaultSel: v,
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => removeOption(gi, oi)}
                                  aria-label="Remove option"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Eye className="size-4 text-primary" />
                Live preview
              </CardTitle>
              <CardDescription>
                Approximates how this card looks on the menu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-video w-full bg-muted">
                  {form.imageUrl ? (
                    <Image
                      src={form.imageUrl}
                      alt={form.name || "Product"}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  {form.popular && (
                    <Badge className="absolute left-2 top-2 border-amber-300 bg-amber-100 text-amber-800">
                      Popular
                    </Badge>
                  )}
                  {form.featured && (
                    <Badge className="absolute right-2 top-2 border-primary/30 bg-primary text-primary-foreground">
                      <Star className="size-3" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {form.name || "Product name"}
                    </h3>
                    <div className="text-right">
                      <div className="font-display text-base font-bold text-primary">
                        {formatPKR(effectivePrice)}
                      </div>
                      {promo != null && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPKR(base)}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.description || "Description will appear here."}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {categoryName}
                    </span>
                    <span>{form.prepTimeMin || "0"} min</span>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {form.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {form.optionGroups.length > 0 && (
                    <Separator />
                  )}
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {form.optionGroups.map((g, i) => (
                      <li key={i}>
                        <span className="font-medium text-foreground">
                          {g.name || `Group ${i + 1}`}
                        </span>
                        <span className="ml-1">
                          ({g.type}
                          {g.required ? ", required" : ""})
                        </span>
                        <ul className="ml-3 mt-0.5 space-y-0.5">
                          {g.options.map((o, j) => (
                            <li key={j}>
                              {o.name || "Option"}
                              {o.priceModifier > 0 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  (+{formatPKR(o.priceModifier)})
                                </span>
                              )}
                              {o.defaultSel && (
                                <span className="ml-1 text-primary">✓</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
