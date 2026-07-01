import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  MessageSquareText,
  Timer,
  RotateCcw,
  Plus,
  X,
  Copy,
  Check,
  Paperclip,
  Download,
  Sparkles,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAT_MODELS, DEFAULT_MODEL_ID } from "@/lib/chat-models";

type Attachment = {
  id: string;
  file: File;
  previewUrl?: string;
  dataUrl?: string;
};

const MODEL_STORAGE_KEY = "chat:selected-model";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function messageText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function messageImages(m: UIMessage): { url: string; mediaType?: string; name?: string }[] {
  return m.parts
    .filter((p: any) => p?.type === "file" && typeof p.url === "string" && (p.mediaType ?? "").startsWith("image/"))
    .map((p: any) => ({ url: p.url, mediaType: p.mediaType, name: p.filename }));
}

export function ChatWindow({
  threadId,
  initialMessages,
  onMessageSent,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessageSent?: () => void;
}) {
  const [rateLimit, setRateLimit] = useState<{
    retryAfter: number;
    resetAt?: string;
  } | null>(null);

  const [modelId, setModelId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    return localStorage.getItem(MODEL_STORAGE_KEY) ?? DEFAULT_MODEL_ID;
  });
  const modelRef = useRef(modelId);
  useEffect(() => {
    modelRef.current = modelId;
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
    } catch {
      /* ignore */
    }
  }, [modelId]);

  const transport = useMemo(() => {
    const originalFetch = globalThis.fetch.bind(globalThis);
    const customFetch: typeof originalFetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (response.status === 429) {
        const cloned = response.clone();
        const text = await cloned.text();
        const retryAfter = response.headers.get("Retry-After");
        const resetAt = response.headers.get("X-RateLimit-Reset");
        const err = new Error(text || "Rate limit exceeded");
        (err as any).status = 429;
        (err as any).retryAfter = retryAfter ? parseInt(retryAfter, 10) : 60;
        (err as any).resetAt = resetAt ?? undefined;
        throw err;
      }
      return response;
    };

    return new DefaultChatTransport({
      api: "/api/chat",
      fetch: customFetch,
      prepareSendMessagesRequest: async ({ messages, id }) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? "";
        return {
          body: { messages, threadId: id, model: modelRef.current },
          headers: { Authorization: `Bearer ${token}` } as Record<string, string>,
        };
      },
    });
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => {
      const err = e as any;
      if (err.status === 429) {
        const retryAfter =
          typeof err.retryAfter === "number" && err.retryAfter > 0 ? err.retryAfter : 60;
        setRateLimit({ retryAfter, resetAt: err.resetAt });
        toast.error(`Rate limit exceeded. Please wait ${retryAfter}s.`);
      } else {
        toast.error(e.message ?? "Something went wrong");
      }
    },
  });

  useEffect(() => {
    if (!rateLimit || rateLimit.retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRateLimit((prev) => {
        if (!prev) return null;
        if (prev.retryAfter <= 1) return { ...prev, retryAfter: 0 };
        return { ...prev, retryAfter: prev.retryAfter - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimit?.retryAfter]);

  const isLoading = status === "submitted" || status === "streaming";
  const isRateLimited = rateLimit !== null && rateLimit.retryAfter > 0;
  const showRetryButton = rateLimit !== null && rateLimit.retryAfter === 0;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    Array.from(files).forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      next.push({ id, file, previewUrl });
    });
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleRetry = () => {
    setRateLimit(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  // Fetch follow-up suggestions after assistant finishes
  useEffect(() => {
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !messageText(last).trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoadingSuggestions(true);
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? "";
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages }),
        });
        if (!res.ok) throw new Error("suggest failed");
        const json = (await res.json()) as { questions?: string[] };
        if (!cancelled) setSuggestions(json.questions ?? []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages.length]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || isLoading || isRateLimited) return;
    setSuggestions([]);

    const images = attachments.filter((a) => a.file.type.startsWith("image/"));
    let files: { type: "file"; mediaType: string; url: string; filename?: string }[] = [];
    if (images.length > 0) {
      try {
        files = await Promise.all(
          images.map(async (a) => ({
            type: "file" as const,
            mediaType: a.file.type,
            url: await readFileAsDataUrl(a.file),
            filename: a.file.name,
          }))
        );
      } catch {
        toast.error("Failed to read image attachment");
        return;
      }
    }
    const nonImage = attachments.filter((a) => !a.file.type.startsWith("image/"));
    if (nonImage.length > 0) {
      toast.info("Non-image files are previewed only; not sent to the model.");
    }

    if (files.length > 0) {
      await sendMessage({
        role: "user",
        parts: [
          ...files.map((f) => ({
            type: "file" as const,
            mediaType: f.mediaType,
            url: f.url,
            filename: f.filename,
          })),
          { type: "text" as const, text: clean },
        ],
      });
    } else {
      await sendMessage({ text: clean });
    }

    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    onMessageSent?.();
  };

  const exportMarkdown = () => {
    if (messages.length === 0) {
      toast.info("Nothing to export yet.");
      return;
    }
    const md = messages
      .map((m) => {
        const role = m.role === "user" ? "**You**" : "**Assistant**";
        return `${role}:\n\n${messageText(m)}\n`;
      })
      .join("\n---\n\n");
    const blob = new Blob([`# Chat transcript\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${threadId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported transcript");
  };

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Select value={modelId} onValueChange={setModelId} disabled={isLoading}>
            <SelectTrigger className="h-8 w-[200px] rounded-lg border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAT_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{m.label}</span>
                    {m.hint && <span className="text-[10px] text-muted-foreground">{m.hint}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={exportMarkdown}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquareText className="size-7 text-muted-foreground" />}
              title="What can I help with?"
              description="Pick a model, attach an image, and start chatting."
            />
          ) : (
            messages.map((m, idx) => {
              const text = messageText(m);
              const images = messageImages(m);
              return (
                <div key={m.id}>
                  <Message from={m.role}>
                    <MessageContent>
                      {images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {images.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={img.name ?? "attachment"}
                              className="max-h-48 rounded-lg border border-border object-cover"
                            />
                          ))}
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <div className="whitespace-pre-wrap">{text}</div>
                      )}
                      {text && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Copy message"
                            onClick={() => copyMessage(m.id, text)}
                            className="opacity-60 hover:opacity-100"
                          >
                            {copiedId === m.id ? (
                              <Check className="size-3.5" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                  {idx === lastAssistantIndex && suggestions.length > 0 && !isLoading && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-1">
                      {suggestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => send(q)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                        >
                          <Sparkles className="size-3 text-primary opacity-70 group-hover:opacity-100" />
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {loadingSuggestions && suggestions.length === 0 && !isLoading && lastAssistantIndex >= 0 && (
            <div className="mt-2 pl-1 text-xs text-muted-foreground">
              <Shimmer>Suggesting follow-ups…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        {isRateLimited && (
          <div className="mx-auto w-full max-w-3xl px-4 pt-3">
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm text-destructive-foreground">
              <Timer className="size-4 shrink-0" />
              <div>
                <p className="font-medium">Too many messages sent</p>
                <p className="text-destructive-foreground/80">
                  Please wait{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    {rateLimit.retryAfter}s
                  </span>{" "}
                  before sending another message.
                </p>
              </div>
            </div>
          </div>
        )}
        {showRetryButton && (
          <div className="mx-auto w-full max-w-3xl px-4 pt-3">
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm text-destructive-foreground">
              <Timer className="size-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Rate limit lifted</p>
                <p className="text-destructive-foreground/80">You can send messages again.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="border-destructive-foreground/30 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Try again
              </Button>
            </div>
          </div>
        )}
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="group relative flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-2 shadow-sm"
                >
                  {a.previewUrl ? (
                    <img
                      src={a.previewUrl}
                      alt={a.file.name}
                      className="size-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Paperclip className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0 max-w-[160px]">
                    <p className="truncate text-xs font-medium">{a.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(a.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => removeAttachment(a.id)}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <PromptInput
            className={isRateLimited ? "pointer-events-none opacity-50" : ""}
            onSubmit={async (message, event) => {
              event.preventDefault();
              await send(message.text);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              placeholder={isRateLimited ? "Rate limit active…" : "Message…"}
              disabled={isRateLimited}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && isRateLimited) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
            <PromptInputFooter className="justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Attach images"
                disabled={isRateLimited}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full"
              >
                <Plus className="size-4" />
              </Button>
              <PromptInputSubmit status={status} disabled={isLoading || isRateLimited} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
