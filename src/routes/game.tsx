import { createFileRoute } from "@tanstack/react-router";
import { AdsterraBottomBanner } from "@/components/game/AdsterraBottomBanner";

export const Route = createFileRoute("/game")({
  component: GamePage,
  head: () => ({
    title: "Game",
    meta: [
      {
        name: "description",
        content: "Play the game with a sticky bottom banner.",
      },
    ],
  }),
});

function GamePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Gameplay area — extra bottom padding keeps the sticky banner from covering content. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-10">
        <h1 className="mb-4 text-3xl font-bold tracking-tight">Game</h1>
        <p className="text-muted-foreground">
          Your gameplay screen goes here. The Adsterra banner stays fixed at the
          bottom without covering content.
        </p>
      </main>

      <AdsterraBottomBanner />
    </div>
  );
}
