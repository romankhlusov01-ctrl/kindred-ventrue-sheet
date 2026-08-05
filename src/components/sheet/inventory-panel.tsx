import { useState } from "react";
import { Package, Plus, Trash2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCharacterStore } from "@/lib/character-store";

export type InventoryItem = {
  id: string;
  name: string;
  qty: number;
  weight: number;
  note: string;
};

/**
 * Gear tab: structured inventory + free notes.
 * Items stored in notes JSON block if needed — we use a simple parallel field via equipment lines.
 * For robustness: store as JSON in a dedicated field via patch on character.notes inventory section
 * OR extend store. We'll parse/write `inventory` via character equipment companion:
 * use notes field `__inv__` encoded — better: extend store.
 *
 * This component uses localStorage key sibling — actually use character.equipment as free text
 * AND a zustand-persisted list in character via patching a JSON in feats? Cleanest: add to store.
 */

// Lightweight: items serialized into equipment with marker lines "• name ×qty (w lb)"
function parseEquipment(raw: string): { items: InventoryItem[]; rest: string } {
  const lines = raw.split("\n");
  const items: InventoryItem[] = [];
  const rest: string[] = [];
  for (const line of lines) {
    const m = line.match(/^•\s*(.+?)\s*×(\d+)(?:\s*\(([\d.]+)\s*lb\))?(?:\s*—\s*(.*))?$/i);
    if (m) {
      items.push({
        id: `it-${items.length}-${m[1]}`,
        name: m[1]!.trim(),
        qty: Number(m[2]),
        weight: m[3] ? Number(m[3]) : 0,
        note: m[4] ?? "",
      });
    } else {
      rest.push(line);
    }
  }
  return { items, rest: rest.join("\n").trim() };
}

function serialize(items: InventoryItem[], rest: string, gold: number) {
  const lines = items.map(
    (i) =>
      `• ${i.name} ×${i.qty}${i.weight ? ` (${i.weight} lb)` : ""}${i.note ? ` — ${i.note}` : ""}`,
  );
  const goldLine = `$ ${gold} зм`;
  const body = [goldLine, ...lines, rest].filter(Boolean).join("\n");
  return body;
}

function parseGold(raw: string): number {
  const m = raw.match(/(?:\$|💰)\s*(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function InventoryPanel() {
  const equipment = useCharacterStore((s) => s.character.equipment);
  const setField = useCharacterStore((s) => s.setField);
  const { items: parsed, rest } = parseEquipment(equipment);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState(0);
  const gold = parseGold(equipment);
  const totalWeight = parsed.reduce((s, i) => s + i.weight * i.qty, 0);

  function write(items: InventoryItem[], g: number, r = rest) {
    // strip old gold line from rest
    const cleanRest = r
      .split("\n")
      .filter((l) => !l.startsWith("$") && !l.startsWith("💰"))
      .join("\n")
      .trim();
    setField("equipment", serialize(items, cleanRest, g));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base">
            <Package className="size-4 text-accent" /> Инвентарь
          </h3>
          <span className="text-xs text-muted">{totalWeight.toFixed(1)} lb</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Coins className="size-4 text-accent" />
          <Input
            type="number"
            className="h-11 w-28"
            value={gold}
            min={0}
            onChange={(e) => write(parsed, Number(e.target.value) || 0)}
          />
          <span className="text-sm text-muted">зм</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {[
            ["Деревянный кол", 1, 1],
            ["Изысканная одежда", 1, 4],
            ["Кинжал", 1, 1],
            ["Рапира", 1, 2],
            ["Знак рода", 1, 0],
          ].map(([n, q, w]) => (
            <Button
              key={String(n)}
              type="button"
              size="sm"
              variant="outline"
              className="h-10 text-xs"
              onClick={() => {
                write(
                  [
                    ...parsed,
                    {
                      id: `it-${Date.now()}-${n}`,
                      name: String(n),
                      qty: Number(q),
                      weight: Number(w),
                      note: "",
                    },
                  ],
                  gold,
                );
              }}
            >
              +{n}
            </Button>
          ))}
        </div>

        <ul className="mb-3 space-y-1.5">
          {parsed.length === 0 && (
            <li className="text-xs text-muted">Пока пусто — добавьте предмет ниже.</li>
          )}
          {parsed.map((it, idx) => (
            <li
              key={it.id}
              className="flex min-h-12 items-center gap-2 rounded border border-border bg-surface-2 px-2 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {it.name}{" "}
                <span className="text-muted">
                  ×{it.qty}
                  {it.weight ? ` · ${it.weight} lb` : ""}
                </span>
              </span>
              <button
                type="button"
                className="text-muted"
                onClick={() => {
                  const next = parsed.filter((_, i) => i !== idx);
                  write(next, gold);
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <Input
            className="col-span-2 h-12 sm:col-span-3"
            placeholder="Предмет"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="number"
            className="col-span-1 h-12"
            placeholder="шт"
            value={qty}
            min={1}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
          <Input
            type="number"
            className="col-span-1 h-12"
            placeholder="lb"
            value={weight}
            min={0}
            step={0.1}
            onChange={(e) => setWeight(Number(e.target.value) || 0)}
          />
          <Button
            type="button"
            size="sm"
            className="col-span-1 h-12"
            variant="secondary"
            onClick={() => {
              if (!name.trim()) return;
              write(
                [
                  ...parsed,
                  {
                    id: `it-${Date.now()}`,
                    name: name.trim(),
                    qty,
                    weight,
                    note: "",
                  },
                ],
                gold,
              );
              setName("");
              setQty(1);
              setWeight(0);
            }}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <h3 className="mb-2 font-display text-sm">Свободные заметки / снаряжение</h3>
        <Textarea
          rows={6}
          value={rest}
          onChange={(e) => write(parsed, gold, e.target.value)}
          placeholder="Описание, квесты, контакты…"
        />
      </div>
    </div>
  );
}
