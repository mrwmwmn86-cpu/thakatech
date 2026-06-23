import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Prompt Gallery" },
      {
        name: "description",
        content:
          "How Prompt Gallery handles your data, cookies, and privacy when you browse and copy AI prompts.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Overview</h2>
            <p className="text-sm text-muted-foreground">
              Prompt Gallery is a curated collection of AI prompts. We respect your
              privacy and aim to collect as little personal data as possible.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="text-sm text-muted-foreground">
              We may collect anonymous analytics such as page views and the categories
              you browse. We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">3. Cookies & Advertising</h2>
            <p className="text-sm text-muted-foreground">
              We use cookies to remember your theme preference and to serve relevant
              advertising via third-party networks such as Google AdSense. You can
              disable cookies in your browser settings.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">4. Your Rights</h2>
            <p className="text-sm text-muted-foreground">
              You may request access to or deletion of any personal information we hold
              about you by contacting us at the email listed on our Contact page.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">5. Changes</h2>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. Continued use of the
              site after changes means you accept the revised policy.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
