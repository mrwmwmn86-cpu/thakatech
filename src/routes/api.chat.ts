import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { DEFAULT_MODEL_ID, MODEL_IDS } from "@/lib/chat-models";
import type { Database } from "@/integrations/supabase/types";

type ChatBody = {
  messages: UIMessage[];
  threadId: string;
  model?: string;
  webSearch?: boolean;
};

const SYSTEM_PROMPT =
  "You are a helpful, professional AI assistant. Use Markdown for formatting. Be direct and clear. When the user attaches an image, describe or use it as part of your answer. When the `web_search` tool is available and the user's question would benefit from current information, news, facts, or citations, call it (you may call it multiple times with refined queries). After using web_search, ALWAYS cite sources inline using numbered footnote-style links like `[1](https://...)`, and end your reply with a `**Sources**` section listing each cited URL with its title.";

async function firecrawlSearch(query: string, limit: number) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: Math.min(Math.max(limit, 1), 8) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl search failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: { web?: Array<{ url?: string; title?: string; description?: string }> } | Array<{ url?: string; title?: string; description?: string }>;
  };
  const raw = Array.isArray(json.data) ? json.data : (json.data?.web ?? []);
  return raw.slice(0, limit).map((r) => ({
    url: r.url ?? "",
    title: r.title ?? "",
    snippet: r.description ?? "",
  }));
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        // Rate limit: 20 messages per 60s per user
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rl, error: rlError } = await supabaseAdmin.rpc(
          "check_and_increment_rate_limit",
          { _user_id: userId, _max_requests: 20, _window_seconds: 60 }
        );
        if (rlError) {
          console.error("rate limit check failed", rlError);
        } else if (rl && rl[0] && !rl[0].allowed) {
          const resetAt = new Date(rl[0].reset_at as string);
          const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfter),
                "X-RateLimit-Limit": "20",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": resetAt.toISOString(),
              },
            }
          );
        }

        const body = (await request.json()) as ChatBody;
        const { messages, threadId } = body;
        const modelId =
          body.model && MODEL_IDS.includes(body.model) ? body.model : DEFAULT_MODEL_ID;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Invalid request", { status: 400 });
        }

        // Validate threadId is a UUID
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof threadId !== "string" || !uuidRe.test(threadId)) {
          return new Response("Invalid request", { status: 400 });
        }

        // Cap message count to prevent token-abuse via huge histories
        const MAX_MESSAGES = 100;
        if (messages.length === 0 || messages.length > MAX_MESSAGES) {
          return new Response("Invalid message count", { status: 400 });
        }

        // Cap total payload size across all message parts (~200k chars)
        const MAX_TOTAL_CHARS = 200_000;
        const MAX_PART_CHARS = 50_000;
        let totalChars = 0;
        for (const m of messages) {
          if (!m || typeof m !== "object" || !Array.isArray((m as UIMessage).parts)) {
            return new Response("Invalid message shape", { status: 400 });
          }
          for (const p of (m as UIMessage).parts) {
            if (p && p.type === "text" && typeof p.text === "string") {
              if (p.text.length > MAX_PART_CHARS) {
                return new Response("Message part too large", { status: 413 });
              }
              totalChars += p.text.length;
              if (totalChars > MAX_TOTAL_CHARS) {
                return new Response("Payload too large", { status: 413 });
              }
            }
          }
        }

        // Verify thread belongs to user (RLS will also enforce)
        const { data: thread, error: threadError } = await supabase
          .from("threads")
          .select("id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (threadError || !thread) {
          return new Response("Thread not found", { status: 404 });
        }

        // Persist the latest user message
        const last = messages[messages.length - 1];
        if (last && last.role === "user") {
          await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: last.parts as never,
          });

          // Auto-title from first user message if still default
          if (thread.title === "New chat") {
            const text = last.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim()
              .slice(0, 60);
            if (text) {
              await supabase
                .from("threads")
                .update({ title: text, updated_at: new Date().toISOString() })
                .eq("id", threadId);
            }
          } else {
            await supabase
              .from("threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          }
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const result = streamText({
          model: gateway(modelId),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant && assistant.role === "assistant") {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as never,
              });
              await supabase
                .from("threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId);
            }
          },
        });
      },
    },
  },
});
