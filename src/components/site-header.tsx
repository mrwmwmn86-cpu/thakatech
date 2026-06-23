import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/gallery" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="text-sm font-semibold">Prompt Gallery</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/gallery"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground font-medium" }}
          >
            Gallery
          </Link>
          <Link
            to="/privacy"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground font-medium" }}
          >
            Privacy
          </Link>
          <Link
            to="/contact"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground font-medium" }}
          >
            Contact
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
      <p>© {new Date().getFullYear()} Prompt Gallery. All rights reserved.</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        <Link to="/contact" className="hover:text-foreground">Contact Us</Link>
      </div>
    </footer>
  );
}
