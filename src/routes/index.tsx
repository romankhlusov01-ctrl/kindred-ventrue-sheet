import { createFileRoute } from "@tanstack/react-router";
import { CharacterSheet } from "@/components/sheet/character-sheet";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-[calc(100dvh-var(--grok-banner-h,0px))]">
      <CharacterSheet />
    </main>
  );
}
