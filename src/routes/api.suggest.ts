import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText, Output, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

type Body = { messages: UIMessage[] };

export const Route = createFileRoute("/api/suggest")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          }
        );
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json()) as Body;
        const tail = (body.messages ?? []).slice(-6);
        const transcript = tail
          .map((m) => {
            const t = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim();
            return t ? `${m.role.toUpperCase()}: ${t}` : "";
          })
          .filter(Boolean)
          .join("\n");

        if (!transcript) {
          return Response.json({ questions: [] });
        }

        try {
          const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
          const { experimental_output } = await generateText({
            model: gateway("google/gemini-2.5-flash-lite"),
            experimental_output: Output.object({
              schema: z.object({
                questions: z.array(z.string()).length(3),
              }),
            }),
            prompt: `Based on the conversation below, suggest exactly 3 short, helpful follow-up questions the user could ask next. Keep each under 60 characters. Match the language of the conversation.\n\n${transcript}`,
          });
          return Response.json({
            questions: experimental_output?.questions?.slice(0, 3) ?? [],
          });
        } catch (err) {
          console.error("suggest failed", err);
          return Response.json({ questions: [] });
        }
      },
    },
  },
});
