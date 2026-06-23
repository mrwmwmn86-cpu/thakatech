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
import { MessageSquareText, Timer, RotateCcw, Plus, X, Copy, Check, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Attachment = { id: string; file: File; previewUrl?: string };

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
          body: { messages, threadId: id },
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
          typeof err.retryAfter === "number" && err.retryAfter > 0
            ? err.retryAfter
            : 60;
        setRateLimit({
          retryAfter,
          resetAt: err.resetAt,
        });
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


  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquareText className="size-7 text-muted-foreground" />}
              title="What can I help with?"
              description="Ask anything. Markdown, code, and reasoning all supported."
            />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.role === "assistant" ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : (
                      <div className="whitespace-pre-wrap">{text}</div>
                    )}
                  </MessageContent>
                </Message>
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
                <p className="text-destructive-foreground/80">
                  You can send messages again.
                </p>
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
          <PromptInput
            className={isRateLimited ? "pointer-events-none opacity-50" : ""}
            onSubmit={async (message, event) => {
              event.preventDefault();
              const text = message.text.trim();
              if (!text || isLoading || isRateLimited) return;
              await sendMessage({ text });
              onMessageSent?.();
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
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                disabled={isLoading || isRateLimited}
              />
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
