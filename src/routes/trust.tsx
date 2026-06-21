import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, Database, Cookie, Mail, FileText, UserCheck, Server } from "lucide-react";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Privacy — Free Photo Project" },
      {
        name: "description",
        content:
          "How Free Photo Project handles your data, secures your account, and respects your privacy.",
      },
      { property: "og:title", content: "Trust & Privacy — Free Photo Project" },
      {
        property: "og:description",
        content:
          "How Free Photo Project handles your data, secures your account, and respects your privacy.",
      },
    ],
  }),
  component: TrustPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function TrustPage() {
  const updated = "June 21, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Free Photo Project
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            <Shield className="h-3.5 w-3.5" />
            Trust & Privacy
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How we handle your data
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page is maintained by the Free Photo Project team to answer
            common security and privacy questions about the app. It describes
            current practices and is not an independent certification.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {updated}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section icon={UserCheck} title="Accounts & authentication">
            <p>
              Accounts are protected by email/password sign-in managed by our
              backend provider. Passwords are never stored in plain text.
            </p>
            <p>
              Each session uses a signed token stored in your browser. You can
              sign out at any time to end the session on your device.
            </p>
          </Section>

          <Section icon={Lock} title="Access controls">
            <p>
              Your chat threads, messages, generated thumbnails, and usage
              records are scoped to your account using row-level security
              policies enforced on the database.
            </p>
            <p>
              Other users cannot read, modify, or delete your content through
              the app.
            </p>
          </Section>

          <Section icon={Database} title="What we collect">
            <p>
              We store the information needed to run the app: your account
              email, your chat threads and messages, prompts and metadata for
              thumbnails you generate, and basic rate-limit counters.
            </p>
            <p>
              We do not sell your data and do not use your messages to train
              third-party models.
            </p>
          </Section>

          <Section icon={Server} title="Hosting & infrastructure">
            <p>
              The app runs on managed cloud infrastructure. Data is transmitted
              over HTTPS and stored in a managed database with encryption at
              rest provided by the hosting platform.
            </p>
            <p>
              AI features (chat completions and image/thumbnail generation) are
              processed through our AI gateway provider to fulfill your
              requests.
            </p>
          </Section>

          <Section icon={FileText} title="Retention & deletion">
            <p>
              Chat threads and generated thumbnails are kept while your account
              is active. Deleting a thread removes it from your account.
            </p>
            <p>
              To request deletion of your full account and associated data,
              contact us using the email below.
            </p>
          </Section>

          <Section icon={Cookie} title="Cookies & analytics">
            <p>
              The app uses functional storage in your browser (such as session
              tokens and your theme preference) so the app can work and
              remember your settings.
            </p>
            <p>
              We do not run advertising trackers. Basic error reporting may be
              used to diagnose crashes.
            </p>
          </Section>

          <Section icon={Shield} title="Your rights">
            <p>
              You can request access to, correction of, or deletion of your
              personal data. We will respond to verified requests within a
              reasonable time frame.
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              For security reports, privacy questions, or data requests, reach
              out to the project owner through the support channel listed in
              the app. We aim to acknowledge security reports promptly.
            </p>
          </Section>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          This page describes current app-visible practices. It is not a legal
          agreement and does not claim certification under any specific
          standard. The project owner may update this page as the app evolves.
        </p>
      </main>
    </div>
  );
}
