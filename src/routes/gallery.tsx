import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  GALLERY_CATEGORIES,
  GALLERY_PROMPTS,
  type GalleryCategory,
} from "@/lib/gallery-prompts";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Prompt Gallery — Curated AI Prompts" },
      {
        name: "description",
        content:
          "Browse a curated gallery of AI prompts for logos, gaming, photography, and anime. Search, filter, and copy with one click.",
      },
      { property: "og:title", content: "Prompt Gallery — Curated AI Prompts" },
      {
        property: "og:description",
        content: "Curated AI prompts for logos, gaming, photography, and anime.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GalleryCategory | "All">("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY_PROMPTS.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Curated AI Prompt Gallery
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Search, filter by category, and copy any prompt with one click.
          </p>
        </div>

        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompt styles…"
            className="pl-9"
            aria-label="Search prompts"
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {(["All", ...GALLERY_CATEGORIES] as const).map((c) => {
            const active = category === c;
            return (
              <Button
                key={c}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
                className="rounded-full"
              >
                {c}
              </Button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No prompts match your search.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <Card className="h-full rounded-2xl shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {p.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.body}</p>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1.5"
                        onClick={() => copy(p.id, p.body)}
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check className="size-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
