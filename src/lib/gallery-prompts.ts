export type GalleryCategory = "Logos" | "Gaming" | "Photography" | "Anime";

export interface GalleryPrompt {
  id: string;
  title: string;
  category: GalleryCategory;
  body: string;
}

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Logos",
  "Gaming",
  "Photography",
  "Anime",
];

export const GALLERY_PROMPTS: GalleryPrompt[] = [
  {
    id: "logo-1",
    title: "Minimal Tech Logo",
    category: "Logos",
    body: "A minimalist vector logo for a tech startup, geometric shapes, monochrome palette, clean lines, scalable design, flat style on white background.",
  },
  {
    id: "logo-2",
    title: "Luxury Gold Emblem",
    category: "Logos",
    body: "Elegant luxury brand emblem, gold foil on black, ornamental crest, refined typography, vector style, high-end fashion aesthetic.",
  },
  {
    id: "logo-3",
    title: "Playful Mascot Logo",
    category: "Logos",
    body: "Friendly mascot character logo, bold outlines, vibrant colors, modern cartoon style, suitable for a coffee shop or kids brand.",
  },
  {
    id: "game-1",
    title: "Epic Fantasy Hero",
    category: "Gaming",
    body: "Epic fantasy warrior holding a glowing sword, cinematic lighting, dramatic sky, hyper detailed armor, AAA game concept art, Unreal Engine 5 render.",
  },
  {
    id: "game-2",
    title: "Cyberpunk Street",
    category: "Gaming",
    body: "Cyberpunk neon-lit street at night, rain reflections, holographic billboards, lone character in trench coat, cinematic wide shot, Blade Runner inspired.",
  },
  {
    id: "game-3",
    title: "Pixel Art Adventure",
    category: "Gaming",
    body: "Retro 16-bit pixel art landscape, rolling green hills, pixel clouds, classic JRPG style, vibrant palette, parallax background.",
  },
  {
    id: "photo-1",
    title: "Golden Hour Portrait",
    category: "Photography",
    body: "Portrait photograph of a woman during golden hour, soft natural light, shallow depth of field, 85mm lens, film grain, editorial quality.",
  },
  {
    id: "photo-2",
    title: "Aerial Coastline",
    category: "Photography",
    body: "Aerial drone photography of a turquoise coastline, white sand, dramatic cliffs, midday sunlight, ultra sharp, National Geographic style.",
  },
  {
    id: "photo-3",
    title: "Moody Street Photography",
    category: "Photography",
    body: "Black and white street photography, Tokyo at night, neon reflections on wet pavement, candid passerby, 35mm Leica aesthetic, high contrast.",
  },
  {
    id: "anime-1",
    title: "Studio Ghibli Landscape",
    category: "Anime",
    body: "Hand-painted anime landscape in Studio Ghibli style, lush green meadow, soft clouds, warm sunlight, whimsical and serene atmosphere.",
  },
  {
    id: "anime-2",
    title: "Shōnen Battle Pose",
    category: "Anime",
    body: "Dynamic anime character in shōnen battle pose, glowing aura, dramatic wind effects, bold line art, vibrant cel shading, manga panel style.",
  },
  {
    id: "anime-3",
    title: "Slice of Life Cafe",
    category: "Anime",
    body: "Cozy anime cafe interior, soft afternoon light, detailed background, slice-of-life mood, pastel color palette, modern anime film aesthetic.",
  },
];
