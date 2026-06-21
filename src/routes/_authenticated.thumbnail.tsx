import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import JSZip from "jszip";
import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Layers,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { generateThumbnail, PLATFORMS, type PlatformKey } from "@/lib/thumbnail.functions";

export const Route = createFileRoute("/_authenticated/thumbnail")({
  component: ThumbnailPage,
  head: () => ({
    meta: [
      { title: "Free Photo Project — Thumbnail Maker" },
      {
        name: "description",
        content:
          "Generate free thumbnails for YouTube, Instagram, TikTok, Facebook, X, LinkedIn and Pinterest — one at a time or in bulk.",
      },
    ],
  }),
});

type BulkItem = {
  title: string;
  status: "pending" | "loading" | "done" | "error";
  imageUrl?: string;
  error?: string;
};

function ThumbnailPage() {
  const run = useServerFn(generateThumbnail);
  const [platform, setPlatform] = useState<PlatformKey>("youtube");
  const [style, setStyle] = useState("bold, vibrant, high-contrast");

  // Single
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const single = useMutation({
    mutationFn: () => run({ data: { title, description, platform, style } }),
  });
  const aspect = PLATFORMS[platform].aspect;

  // Bulk
  const [bulkText, setBulkText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  async function runBulk() {
    const titles = bulkText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!titles.length) return;
    const init: BulkItem[] = titles.map((t) => ({ title: t, status: "pending" }));
    setBulkItems(init);
    setBulkRunning(true);
    for (let i = 0; i < titles.length; i++) {
      setBulkItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "loading" } : it)),
      );
      try {
        const res = await run({
          data: { title: titles[i], description: "", platform, style },
        });
        setBulkItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "done", imageUrl: res.imageUrl } : it,
          ),
        );
      } catch (e) {
        setBulkItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, status: "error", error: (e as Error)?.message ?? "Failed" }
              : it,
          ),
        );
      }
    }
    setBulkRunning(false);
  }

  async function downloadAllZip() {
    const done = bulkItems.filter((b) => b.status === "done" && b.imageUrl);
    if (!done.length) return;
    const zip = new JSZip();
    await Promise.all(
      done.map(async (item, i) => {
        const res = await fetch(item.imageUrl!);
        const blob = await res.blob();
        const safe = item.title.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || `thumb_${i + 1}`;
        zip.file(`${String(i + 1).padStart(2, "0")}_${safe}.png`, blob);
      }),
    );
    const out = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(out);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbnails-${platform}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const doneCount = bulkItems.filter((b) => b.status === "done").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/">
              <ArrowLeft className="size-4" /> Chat
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ImageIcon className="size-4" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">Free Photo Project</h1>
              <p className="text-xs text-muted-foreground">Thumbnail maker for every platform</p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformKey)}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORMS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>
                    {p.label} · {p.size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="style">Visual style</Label>
            <Input
              id="style"
              placeholder="e.g. minimal, cinematic, neon, pastel"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              maxLength={120}
            />
          </div>
        </div>

        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <Sparkles className="size-4" /> Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Layers className="size-4" /> Bulk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4 grid gap-6 md:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title text</Label>
                <Input
                  id="title"
                  placeholder="e.g. 5 Tips to Grow on YouTube"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Context (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Short description, key visuals, mood…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => single.mutate()}
                disabled={single.isPending || !title.trim()}
              >
                {single.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate thumbnail
                  </>
                )}
              </Button>
              {single.isError && (
                <p className="rounded-md border border-destructive/30 bg-destructive px-3 py-2 text-xs text-destructive-foreground">
                  {(single.error as Error)?.message ?? "Something went wrong."}
                </p>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Preview</h2>
                {single.data && (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a
                      href={single.data.imageUrl}
                      download={`thumbnail-${single.data.platform}.png`}
                    >
                      <Download className="size-4" /> Download
                    </a>
                  </Button>
                )}
              </div>
              <div
                className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
                style={{ aspectRatio: aspect.replace(":", " / ") }}
              >
                {single.isPending ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : single.data ? (
                  <img
                    src={single.data.imageUrl}
                    alt={title || "Generated thumbnail"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center text-xs text-muted-foreground">
                    Your {PLATFORMS[platform].label} thumbnail ({PLATFORMS[platform].size}) will
                    appear here.
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-4">
            <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div>
                <h2 className="text-base font-semibold">Bulk thumbnails</h2>
                <p className="text-xs text-muted-foreground">
                  One title per line — up to 20. They generate sequentially, then you can download
                  them all as a ZIP.
                </p>
              </div>
              <Textarea
                placeholder={"5 Tips to Grow on YouTube\nMy Morning Routine\nReact in 100 Seconds"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                disabled={bulkRunning}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="gap-2"
                  onClick={runBulk}
                  disabled={bulkRunning || !bulkText.trim()}
                >
                  {bulkRunning ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Generating {doneCount}/
                      {bulkItems.length}…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> Generate all
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={downloadAllZip}
                  disabled={bulkRunning || doneCount === 0}
                >
                  <PackageOpen className="size-4" /> Download all ({doneCount})
                </Button>
              </div>
            </section>

            {bulkItems.length > 0 && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {bulkItems.map((item, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl border border-border bg-card p-2"
                  >
                    <div
                      className="flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
                      style={{ aspectRatio: aspect.replace(":", " / ") }}
                    >
                      {item.status === "done" && item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : item.status === "error" ? (
                        <span className="px-2 text-center text-[10px] text-destructive">
                          {item.error}
                        </span>
                      ) : item.status === "loading" ? (
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Pending</span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs">{item.title}</p>
                    {item.status === "done" && item.imageUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 w-full gap-1 text-xs"
                      >
                        <a href={item.imageUrl} download={`thumbnail-${i + 1}.png`}>
                          <Download className="size-3" /> Save
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </section>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
