import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PLATFORMS = {
  youtube: { label: "YouTube", size: "1280x720", aspect: "16:9" },
  youtube_shorts: { label: "YouTube Shorts", size: "1080x1920", aspect: "9:16" },
  instagram_post: { label: "Instagram Post", size: "1080x1080", aspect: "1:1" },
  instagram_story: { label: "Instagram Story / Reels", size: "1080x1920", aspect: "9:16" },
  tiktok: { label: "TikTok", size: "1080x1920", aspect: "9:16" },
  facebook: { label: "Facebook", size: "1200x630", aspect: "1.91:1" },
  twitter: { label: "Twitter / X", size: "1600x900", aspect: "16:9" },
  linkedin: { label: "LinkedIn", size: "1200x627", aspect: "1.91:1" },
  pinterest: { label: "Pinterest", size: "1000x1500", aspect: "2:3" },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const Input = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(""),
  platform: z.enum(Object.keys(PLATFORMS) as [PlatformKey, ...PlatformKey[]]),
  style: z.string().max(120).optional().default("bold, vibrant, high-contrast"),
});

export const generateThumbnail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const platform = PLATFORMS[data.platform];
    const prompt = `Design a professional ${platform.label} thumbnail.
Aspect ratio: ${platform.aspect} (target ${platform.size}).
Main title text: "${data.title}".
${data.description ? `Context: ${data.description}.` : ""}
Visual style: ${data.style}.
Requirements: eye-catching composition, large legible title typography, strong focal subject, clean background, high contrast, optimized to drive clicks on ${platform.label}. Do not add watermarks or logos.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("Image credits exhausted. Please add credits to your Lovable workspace.");
      throw new Error(`Image generation failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("No image returned by the model.");

    return {
      imageUrl: url,
      platform: data.platform,
      label: platform.label,
      size: platform.size,
    };
  });
