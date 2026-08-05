import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Row = { id: string; name: string; init: number };

export function InitOrder() {
  const c = useCharacterStore((s) => s.character);
  const enemies = useSessionStore((s) => s.enemies);
  const updateEnemy = useSessionStore((s) => s.updateEnemy);
  const [allies, setAllies] = useState<Row[]>([]);

  const rows: Row[] = [
    {
      id: "pc",
      name: c.name || "Вы",
      init: c.initiative ?? -99,
    },
    ...enemies.map((e) => ({
      id: e.id,
      name: e.name,
      init: e.init ?? 10,
    })),
    ...allies,
  ].sort((a, b) => b.init - a.init);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm">
          <ListOrdered className="size-4 text-accent" /> Порядок инициативы
        </h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => {
            setAllies((a) => [
              ...a,
              { id: `ally-${Date.now()}`, name: "Союзник", init: 10 },
            ]);
            toast.message("Союзник добавлен");
          }}
        >
          + Союзник
        </Button>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1.5 text-sm",
              r.id === "pc"
                ? "border-primary/40 bg-primary/10"
                : r.id.startsWith("ally")
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-surface-2",
            )}
          >
            <span className="w-5 text-xs text-muted">{i + 1}</span>
            {r.id.startsWith("ally") ? (
              <Input
                className="h-8 min-w-0 flex-1"
                value={r.name}
                onChange={(e) =>
                  setAllies((list) =>
                    list.map((x) =>
                      x.id === r.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
            )}
            {r.id === "pc" ? (
              <span className="font-display tabular-nums">
                {r.init === -99 ? "—" : r.init}
              </span>
            ) : r.id.startsWith("ally") ? (
              <Input
                type="number"
                className="h-8 w-16"
                value={r.init}
                onChange={(e) =>
                  setAllies((list) =>
                    list.map((x) =>
                      x.id === r.id
                        ? { ...x, init: Number(e.target.value) || 0 }
                        : x,
                    ),
                  )
                }
              />
            ) : (
              <Input
                type="number"
                className="h-8 w-16"
                value={r.init}
                onChange={(e) =>
                  updateEnemy(r.id, { init: Number(e.target.value) || 0 })
                }
              />
            )}
          </li>
        ))}
      </ul>
      {c.initiative == null && (
        <p className="mt-2 text-[10px] text-muted">
          Сначала бросьте инициативу (панель / Старт боя).
        </p>
      )}
    </div>
  );
}
