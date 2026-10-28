"use client";

import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  className,
  aspect = "aspect-video",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  aspect?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.errors?.[0]?.message || "Upload failed");
      }
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-muted-foreground"
          >
            <X className="size-3.5" />
            Remove
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative w-full max-w-[260px] overflow-hidden rounded-lg border bg-muted/40",
            aspect,
          )}
        >
          {value ? (
            <Image
              src={value}
              alt="Upload preview"
              fill
              sizes="260px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImagePlus className="size-6" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="max-w-[260px]"
          />
          <Input
            type="text"
            placeholder="Or paste image URL…"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="max-w-[260px]"
          />
          {busy && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Uploading…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
