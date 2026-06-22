import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createThread, listThreads } from "@/lib/threads.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: IndexRedirect,
  head: () => ({
    scripts: [
      {
        async: true,
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6718009341637246",
        crossOrigin: "anonymous",
      },
    ],
  }),
});

function IndexRedirect() {
  const navigate = useNavigate();
  const create = useServerFn(createThread);
  const list = useServerFn(listThreads);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const threads = await list();
      if (threads.length > 0) {
        navigate({ to: "/c/$threadId", params: { threadId: threads[0].id }, replace: true });
      } else {
        const t = await create();
        navigate({ to: "/c/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, [create, list, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
