import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("[threads] listThreads DB error:", error);
      throw new Error("Unable to load conversations. Please try again.");
    }
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: "New chat" })
      .select("id, title, updated_at")
      .single();
    if (error) {
      console.error("[threads] createThread DB error:", error);
      throw new Error("Unable to create conversation. Please try again.");
    }
    return data;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) {
      console.error("[threads] deleteThread DB error:", error);
      throw new Error("Unable to delete conversation. Please try again.");
    }
    return { ok: true };
  });

export type ThreadDetail = {
  thread: { id: string; title: string };
  messages: Array<{ id: string; role: "user" | "assistant" | "system"; parts: any }>;
};

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ThreadDetail | null> => {
    const { data: thread, error } = await context.supabase
      .from("threads")
      .select("id, title")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("[threads] getThread DB error:", error);
      throw new Error("Unable to load conversation. Please try again.");
    }
    if (!thread) return null;

    const { data: msgs, error: mErr } = await context.supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) {
      console.error("[threads] getThread messages DB error:", mErr);
      throw new Error("Unable to load messages. Please try again.");
    }

    return {
      thread,
      messages: (msgs ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        parts: m.parts,
      })),
    };
  });
