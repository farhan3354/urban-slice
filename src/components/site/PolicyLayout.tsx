import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function PolicyLayout({
  title,
  description,
  children,
  lastUpdated,
}: {
  title: string;
  description?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </Button>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {lastUpdated}
        </p>
      )}
      <Separator className="my-6" />
      <Card className="p-6 sm:p-8">
        <div className="prose prose-stone max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-6 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
          {children}
        </div>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground italic">
        This content is editable from the admin dashboard under Settings →
        Policies. Demo content pending owner verification.
      </p>
    </div>
  );
}

// Renders plain text with paragraphs split on blank lines.
export function PolicyText({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-foreground/90 leading-relaxed">
          {p}
        </p>
      ))}
    </>
  );
}
