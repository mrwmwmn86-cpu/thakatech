import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePrompt,
  listPrompts,
  savePrompt,
  type SavedPrompt,
} from "@/lib/prompts.functions";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library" },
      {
        name: "description",
        content:
          "Save, tag, and reuse your best chat and thumbnail prompts in one place.",
      },
    ],
  }),
  component: PromptsPage,
});

type Draft = { id?: string; title: string; body: string; tags: string };

const emptyDraft: Draft = { title: "", body: "", tags: "" };

function PromptsPage() {
  const list = useServerFn(listPrompts);
  const save = useServerFn(savePrompt);
  const del = useServerFn(deletePrompt);
  const qc = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["saved_prompts"],
    queryFn: () => list(),
  });

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          title: d.title.trim(),
          body: d.body.trim(),
          tags: d.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 10),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved_prompts"] });
      setDraft(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_prompts"] }),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [prompts, query]);

  const copy = async (p: SavedPrompt) => {
    try {
      await navigator.clipboard.writeText(p.body);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  const canSave =
    draft !== null && draft.title.trim().length > 0 && draft.body.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bookmark className="size-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight">Prompt Library</h1>
                <p className="text-xs text-muted-foreground">
                  Save and reuse your best prompts
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setDraft({ ...emptyDraft })}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New prompt
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, body, or tag"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasAny={prompts.length > 0}
            onCreate={() => setDraft({ ...emptyDraft })}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <li
                key={p.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug">{p.title}</h3>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconButton
                      label="Edit"
                      onClick={() =>
                        setDraft({
                          id: p.id,
                          title: p.title,
                          body: p.body,
                          tags: p.tags.join(", "),
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
                  {p.body}
                </p>
                {p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => copy(p)}
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
              </li>
            ))}
          </ul>
        )}
      </main>

      {draft !== null && (
        <DraftDialog
          draft={draft}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={() => canSave && saveMut.mutate(draft)}
          saving={saveMut.isPending}
          canSave={canSave}
        />
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function EmptyState({
  hasAny,
  onCreate,
}: {
  hasAny: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bookmark className="size-5" />
      </div>
      <h2 className="mt-4 text-sm font-semibold">
        {hasAny ? "No prompts match your search" : "No saved prompts yet"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {hasAny
          ? "Try a different keyword or tag."
          : "Save your favorite prompts to reuse them instantly across chats and thumbnails."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate} size="sm" className="mt-5 gap-1.5">
          <Plus className="size-4" />
          Create your first prompt
        </Button>
      )}
    </div>
  );
}

function DraftDialog({
  draft,
  onChange,
  onClose,
  onSave,
  saving,
  canSave,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">
            {draft.id ? "Edit prompt" : "New prompt"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              value={draft.title}
              maxLength={120}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              placeholder="e.g. YouTube tutorial thumbnail"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prompt</label>
            <Textarea
              value={draft.body}
              maxLength={8000}
              onChange={(e) => onChange({ ...draft, body: e.target.value })}
              placeholder="Write the prompt you want to reuse…"
              className="mt-1 min-h-40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tags <span className="text-muted-foreground/70">(comma-separated)</span>
            </label>
            <Input
              value={draft.tags}
              onChange={(e) => onChange({ ...draft, tags: e.target.value })}
              placeholder="youtube, tutorial, hero"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={!canSave || saving} className="gap-1.5">
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Save prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
