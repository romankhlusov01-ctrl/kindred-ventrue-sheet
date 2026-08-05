import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { cn } from "@/lib/utils";

type Row = { id: string; name: string; init: number };

export function InitOrder() {
  const c = useCharacterStore((s) => s.character);
  const enemies = useSessionStore((s) => s.enemies);
  const [extras, setExtras] = useState<Row[]>([]);

  const rows: Row[] = [
    {
      id: "pc",
      name: c.name || "Вы",
      init: c.initiative ?? -99,
    },
    ...enemies.map((e) => ({
      id: e.id,
      name: e.name,
      init: extras.find((x) => x.id === e.id)?.init ?? 10,
    })),
    ...extras.filter((x) => !enemies.some((e) => e.id === x.id) && x.id !== "pc"),
  ].sort((a, b) => b.init - a.init);

  function setEnemyInit(id: string, init: number) {
    setExtras((prev) => {
      const rest = prev.filter((x) => x.id !== id);
      return [...rest, { id, name: "", init }];
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <ListOrdered className="size-4 text-accent" /> Порядок инициативы
      </h3>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1.5 text-sm",
              r.id === "pc" ? "border-primary/40 bg-primary/10" : "border-border bg-surface-2",
            )}
          >
            <span className="w-5 text-xs text-muted">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            {r.id === "pc" ? (
              <span className="font-display tabular-nums">{r.init === -99 ? "—" : r.init}</span>
            ) : (
              <Input
                type="number"
                className="h-8 w-16"
                value={r.init}
                onChange={(e) => setEnemyInit(r.id, Number(e.target.value) || 0)}
              />
            )}
          </li>
        ))}
      </ul>
      {c.initiative == null && (
        <p className="mt-2 text-[10px] text-muted">Сначала бросьте инициативу (панель / Старт боя).</p>
      )}
    </div>
  );
}
