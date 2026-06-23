import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Prompt Gallery" },
      {
        name: "description",
        content:
          "Get in touch with the Prompt Gallery team. We'd love to hear your feedback, prompt suggestions, or partnership ideas.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      toast.success("Thanks! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      setSending(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="size-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions, feedback, or prompt suggestions? Send us a message.
          </p>
        </div>

        <Card className="mt-8 rounded-2xl shadow-md">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="mt-1 min-h-32"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <a
                  href="mailto:hello@promptgallery.app"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-3.5" />
                  hello@promptgallery.app
                </a>
                <Button type="submit" disabled={sending} className="gap-1.5">
                  <Send className="size-4" />
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
