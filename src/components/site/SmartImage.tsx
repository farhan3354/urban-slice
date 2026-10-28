"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pizza } from "lucide-react";

/**
 * Image with graceful fallback. Used for /images/* and /upload/* paths that
 * may or may not exist on disk yet (admin uploads or generated images).
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  iconClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  iconClassName?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const safeSrc = src && src.trim() ? src : null;

  if (!safeSrc || errored) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/70 text-muted-foreground",
          className
        )}
        aria-label={alt}
        role="img"
      >
        <Pizza className={cn("size-8 opacity-40", iconClassName)} />
      </div>
    );
  }

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={safeSrc}
          alt={alt}
          fill
          sizes={sizes || "(max-width: 768px) 100vw, 33vw"}
          priority={priority}
          onError={() => setErrored(true)}
          className={cn("object-cover", imgClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <Image
        src={safeSrc}
        alt={alt}
        width={width || 600}
        height={height || 600}
        priority={priority}
        sizes={sizes}
        onError={() => setErrored(true)}
        className={cn("object-cover h-full w-full", imgClassName)}
      />
    </div>
  );
}
