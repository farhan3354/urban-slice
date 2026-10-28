"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pizza,
  Pencil,
  Trash2,
  Star,
  AlertTriangle,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading, RowSkeleton } from "@/components/admin/Loading";
import { extractErrors, type Category, type SerializedProduct } from "@/components/admin/types";
import { formatPKR } from "@/lib/format";

export function ProductsList() {
  const router = useRouter();
  const [products, setProducts] = React.useState<SerializedProduct[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("all");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
      ]);
      if (!pRes.ok || !cRes.ok) throw new Error("Failed to load");
      const pJson = await pRes.json();
      const cJson = await cRes.json();
      setProducts(pJson.products || []);
      setCategories(cJson.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        toast.error(errs[0]?.message || "Delete failed");
        return;
      }
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = React.useMemo(() => {
    let list = products;
    if (catFilter !== "all") {
      list = list.filter((p) => p.categoryId === catFilter);
    }
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.tags?.some((t) => t.toLowerCase().includes(term)),
      );
    }
    return list;
  }, [products, q, catFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Menu
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage pizzas, sides, drinks and other products.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/menu/new")}>
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="font-display text-base">Filters</CardTitle>
          <CardDescription>
            Search by name/tag and filter by category.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="pl-8"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Products ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <RowSkeleton count={6} />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load products"
              description={error}
              action={<Button onClick={load}>Retry</Button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Pizza}
              title="No products"
              description="Add your first product to the menu."
              action={
                <Button asChild>
                  <Link href="/admin/menu/new">
                    <Plus className="size-4" />
                    Add product
                  </Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Effective</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Pizza className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.tags?.length ? p.tags.join(", ") : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{p.categoryName}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPKR(p.basePrice)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {p.promoPrice != null ? (
                        <span className="flex flex-col items-end">
                          <span className="text-primary">
                            {formatPKR(p.effectivePrice)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPKR(p.basePrice)}
                          </span>
                        </span>
                      ) : (
                        formatPKR(p.effectivePrice)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 text-primary"
                          >
                            <Star className="size-3" /> Featured
                          </Badge>
                        )}
                        {p.popular && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-100 text-amber-800"
                          >
                            Popular
                          </Badge>
                        )}
                        {!p.available && (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-100 text-red-700"
                          >
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          aria-label="Edit"
                        >
                          <Link href={`/admin/menu/${p.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Delete"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              {deleting === p.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete &ldquo;{p.name}&rdquo;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the product and all
                                its option groups. Past orders keep their
                                snapshots. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(p.id)}
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
    </div>
  );
}
