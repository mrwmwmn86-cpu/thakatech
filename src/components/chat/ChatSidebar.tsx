import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, LogOut, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ThreadItem = { id: string; title: string; updated_at: string };

export function ChatSidebar({
  threads,
  activeId,
  onCreate,
  onDelete,
}: {
  threads: ThreadItem[];
  activeId: string;
  onCreate: () => Promise<string>;
  onDelete: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageSquareText className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Chat</span>
      </div>

      <div className="px-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl"
          onClick={async () => {
            const id = await onCreate();
            navigate({ to: "/c/$threadId", params: { threadId: id } });
          }}
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {threads.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-lg pr-1 transition-colors",
              activeId === t.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/60"
            )}
          >
            <Link
              to="/c/$threadId"
              params={{ threadId: t.id }}
              className="min-w-0 flex-1 truncate px-3 py-2 text-sm"
            >
              {t.title || "New chat"}
            </Link>
            <button
              type="button"
              aria-label="Delete chat"
              className="invisible rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground group-hover:visible"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await onDelete(t.id);
                if (activeId === t.id) navigate({ to: "/", replace: true });
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {threads.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations yet.
          </p>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
