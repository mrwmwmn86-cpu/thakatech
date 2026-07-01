import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { type UIMessage } from "ai";
import { listThreads, createThread, deleteThread, getThread } from "@/lib/threads.functions";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Menu, X } from "lucide-react";
import * as React from "react";

export function ChatLayout({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const fetchThread = useServerFn(getThread);

  // حالة التحكم في فتح وإغلاق القائمة مثل ChatGPT
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const threadsQ = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
    staleTime: 5000,
  });

  const threadQ = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread({ data: { id: threadId } }),
  });

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* القائمة الجانبية بتصميم شات جي بي تي للموبايل والكمبيوتر */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:flex
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <ChatSidebar
          threads={threadsQ.data ?? []}
          activeId={threadId}
          onCreate={async () => {
            const t = await create();
            await qc.invalidateQueries({ queryKey: ["threads"] });
            setIsSidebarOpen(false); // إغلاق القائمة بعد إنشاء محادثة جديدة على الموبايل
            return t.id;
          }}
          onDelete={async (id) => {
            await remove({ data: { id } });
            await qc.invalidateQueries({ queryKey: ["threads"] });
          }}
        />
      </div>

      {/* خلفية معتمة تظهر عند فتح القائمة في الموبايل لإغلاقها عند الضغط خارجها */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex flex-1 flex-col h-full overflow-hidden">
        {/* الشريط العلوي وفيه زر القائمة الثلاثي (الهمبرجر) */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-background z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent text-foreground"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {threadQ.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : threadQ.data ? (
            <ChatWindow
              threadId={threadId}
              initialMessages={threadQ.data.messages as unknown as LogMessage[]}
              onMessageSent={() => qc.invalidateQueries({ queryKey: ["threads"] })}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Conversation not found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
