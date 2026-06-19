import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Download, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
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
          "Generate free thumbnails for YouTube, Instagram, TikTok, Facebook, X, LinkedIn and Pinterest.",
      },
    ],
  }),
});

function ThumbnailPage() {
  const run = useServerFn(generateThumbnail);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<PlatformKey>("youtube");
  const [style, setStyle] = useState("bold, vibrant, high-contrast");

  const mutation = useMutation({
    mutationFn: () =>
      run({ data: { title, description, platform, style } }),
  });

  const result = mutation.data;
  const aspect = PLATFORMS[platform].aspect;

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

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h2 className="text-base font-semibold">Create a thumbnail</h2>
            <p className="text-xs text-muted-foreground">
              Pick a platform, describe your content, and generate a click-worthy image.
            </p>
          </div>

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

          <Button
            className="w-full gap-2"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate thumbnail
              </>
            )}
          </Button>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive px-3 py-2 text-xs text-destructive-foreground">
              {(mutation.error as Error)?.message ?? "Something went wrong."}
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Preview</h2>
            {result && (
              <Button asChild size="sm" variant="outline" className="gap-2">
                <a
                  href={result.imageUrl}
                  download={`thumbnail-${result.platform}.png`}
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
            {mutation.isPending ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : result ? (
              <img
                src={result.imageUrl}
                alt={title || "Generated thumbnail"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-6 text-center text-xs text-muted-foreground">
                Your {PLATFORMS[platform].label} thumbnail ({PLATFORMS[platform].size}) will appear
                here.
              </div>
            )}
          </div>

          {result && (
            <p className="text-xs text-muted-foreground">
              {result.label} · {result.size}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
