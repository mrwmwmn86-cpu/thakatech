import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type SavedPrompt = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updated_at: string;
};

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedPrompt[]> => {
    const { data, error } = await context.supabase
      .from("saved_prompts")
      .select("id, title, body, tags, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("[prompts] list error:", error);
      throw new Error("Unable to load saved prompts.");
    }
    return (data ?? []) as SavedPrompt[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(8000),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
});

export const savePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ context, data }): Promise<SavedPrompt> => {
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("saved_prompts")
        .update({ title: data.title, body: data.body, tags: data.tags })
        .eq("id", data.id)
        .select("id, title, body, tags, updated_at")
        .single();
      if (error) {
        console.error("[prompts] update error:", error);
        throw new Error("Unable to update prompt.");
      }
      return row as SavedPrompt;
    }
    const { data: row, error } = await context.supabase
      .from("saved_prompts")
      .insert({
        user_id: context.userId,
        title: data.title,
        body: data.body,
        tags: data.tags,
      })
      .select("id, title, body, tags, updated_at")
      .single();
    if (error) {
      console.error("[prompts] insert error:", error);
      throw new Error("Unable to save prompt.");
    }
    return row as SavedPrompt;
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("saved_prompts")
      .delete()
      .eq("id", data.id);
    if (error) {
      console.error("[prompts] delete error:", error);
      throw new Error("Unable to delete prompt.");
    }
    return { ok: true };
  });
