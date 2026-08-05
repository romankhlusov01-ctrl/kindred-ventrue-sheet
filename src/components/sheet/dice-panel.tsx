import { useState } from "react";
import { Dices, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod, rollDice, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { toast } from "sonner";

type LogEntry = {
  id: number;
  label: string;
  detail: string;
  total: number;
  kind: "check" | "damage" | "heal" | "other";
};

export function DicePanel() {
  const character = useCharacterStore((s) => s.character);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addLog = useCharacterStore((s) => s.addLog);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [adv, setAdv] = useState<"norm" | "adv" | "dis">("norm");
  const row = getLevelData(character.level);
  const conMod = abilityMod(character.abilities.con);
  const pb = row.pb;
  const chaMod = abilityMod(character.abilities.cha);

  function push(label: string, detail: string, total: number, kind: LogEntry["kind"] = "other") {
    setLog((prev) =>
      [{ id: Date.now() + Math.random(), label, detail, total, kind }, ...prev].slice(0, 12),
    );
    addLog(`${label}: ${total} (${detail})`);
  }

  function rollD20(label: string, mod: number) {
    const a = rollDie(20);
    const b = rollDie(20);
    let used = a;
    let detail = `${a}`;
    if (adv === "adv") {
      used = Math.max(a, b);
      detail = `преим. ${a}/${b}`;
    } else if (adv === "dis") {
      used = Math.min(a, b);
      detail = `помеха ${a}/${b}`;
    }
    const total = used + mod;
    const crit = used === 20 ? " · КРИТ" : used === 1 ? " · ПРОВАЛ" : "";
    push(label, `${detail} ${formatMod(mod)}${crit}`, total, "check");
  }

  function rollFeed(half = false) {
    let count: number = row.feedCount;
    if (half) count = Math.max(1, Math.floor(count / 2));
    const { rolls, total } = rollDice(count, 6);
    const sixes = rolls.filter((r) => r === 6).length;
    const conPart = Math.max(1, conMod);
    const sum = total + conPart;
    if (sixes > 0) {
      gainBlood(sixes);
      toast.success(`Питание: ${sixes}×«6» → +${sixes} очк. крови`);
    }
    push(
      half ? "Питание (½ Bane)" : "Питание",
      `${rolls.join("+")} + Тел ${formatMod(conPart)}${sixes ? ` · 6×${sixes}` : ""}`,
      sum,
      "damage",
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dices className="size-4 text-accent" />
          <h3 className="font-display text-base tracking-wide">Кости</h3>
        </div>
        <div className="flex rounded-[var(--radius-sm)] border border-border p-0.5">
          {(
            [
              ["norm", "Обыч"],
              ["adv", "Преим"],
              ["dis", "Помеха"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAdv(id)}
              className={`h-8 px-2.5 text-xs font-medium rounded-[var(--radius-sm)] ${
                adv === id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button type="button" variant="blood" size="sm" onClick={() => rollFeed(false)}>
          Питание {row.feed}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => rollFeed(true)}>
          Питание ½ (Bane)
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            spendBlood(1);
            const r = rollDie(10) + character.level;
            adjustHp(r);
            push("Исцеление", `1d10+${character.level} (−1 ОБК)`, r, "heal");
            toast.message(`+${r} хитов`);
          }}
        >
          Лечение 1 ОБК
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            rollD20("Атака Сил", abilityMod(character.abilities.str) + pb)
          }
        >
          Атака Сил
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            rollD20("Атака Лов", abilityMod(character.abilities.dex) + pb)
          }
        >
          Атака Лов
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const a = rollDie(20);
            const b = rollDie(20);
            const used = Math.max(a, b);
            push("Зверь (преим.)", `преим. ${a}/${b}`, used, "check");
          }}
        >
          Зверь d20
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => rollD20("Спас Тел", abilityMod(character.abilities.con) + pb)}
        >
          Спас Тел
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => rollD20("Спас Хар", abilityMod(character.abilities.cha) + pb)}
        >
          Спас Хар
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            rollD20("Спас Муд (Adv Вентру)", abilityMod(character.abilities.wis))
          }
        >
          Спас Муд
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => rollD20("Атака закл.", chaMod + pb)}
        >
          Атака закл.
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const dc = 8 + pb + chaMod;
            push("Сл заклинаний", `8+БМ+Хар`, dc, "other");
            toast.message(`Сл ${dc}`);
          }}
        >
          Показать Сл
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const r = rollDie(20);
            push("d20", `${r}`, r, "check");
          }}
        >
          d20
        </Button>
      </div>

      {log.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted">История</span>
            <button type="button" className="text-muted hover:text-fg" onClick={() => setLog([])}>
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <ul className="max-h-52 space-y-2 overflow-y-auto scroll-thin">
            {log.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border/70 bg-surface-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-fg">{e.label}</div>
                  <div className="truncate text-xs text-muted">{e.detail}</div>
                </div>
                <div
                  className={`font-display text-xl tabular-nums ${
                    e.kind === "heal"
                      ? "text-success"
                      : e.kind === "damage"
                        ? "text-primary"
                        : "text-accent"
                  }`}
                >
                  {e.total}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
