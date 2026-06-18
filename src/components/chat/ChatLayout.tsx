import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";
import { listThreads, createThread, deleteThread, getThread } from "@/lib/threads.functions";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { Loader2 } from "lucide-react";

export function ChatLayout({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const fetchThread = useServerFn(getThread);

  const threadsQ = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
    staleTime: 5_000,
  });

  const threadQ = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread({ data: { id: threadId } }),
  });

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        threads={threadsQ.data ?? []}
        activeId={threadId}
        onCreate={async () => {
          const t = await create();
          await qc.invalidateQueries({ queryKey: ["threads"] });
          return t.id;
        }}
        onDelete={async (id) => {
          await remove({ data: { id } });
          await qc.invalidateQueries({ queryKey: ["threads"] });
        }}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        {threadQ.isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : threadQ.data ? (
          <ChatWindow
            threadId={threadId}
            initialMessages={threadQ.data.messages as unknown as UIMessage[]}
            onMessageSent={() => qc.invalidateQueries({ queryKey: ["threads"] })}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Conversation not found.
          </div>
        )}
      </main>
    </div>
  );
}
