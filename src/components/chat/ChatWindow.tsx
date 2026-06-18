import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
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
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";

export function ChatWindow({
  threadId,
  initialMessages,
  onMessageSent,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessageSent?: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages, id }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            body: { messages, threadId: id },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          };
        },
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message ?? "Something went wrong"),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
                  <MessageContent
                    variant={m.role === "user" ? "contained" : "flat"}
                  >
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
              <MessageContent variant="flat">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <PromptInput
            onSubmit={async (message) => {
              const text = message.text.trim();
              if (!text || isLoading) return;
              await sendMessage({ text });
              onMessageSent?.();
            }}
          >
            <PromptInputTextarea ref={textareaRef} placeholder="Message…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={isLoading} />
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
