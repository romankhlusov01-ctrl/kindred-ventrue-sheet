import { useState } from "react";
import { Dices, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod, rollDice, rollDie, cn } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { effectivePb } from "@/lib/level-utils";
import {
  getLuckMax,
  skillBonus,
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import {
  hasAlacrity,
  rollD20,
  rollDamage,
  type RollMode,
} from "@/lib/roll-engine";
import { conditionMode, type RollKind } from "@/lib/play-helpers";


import { SKILLS } from "@/data/skills";
import { useSessionStore } from "@/lib/session-store";

type LogEntry = {
  id: number;
  label: string;
  detail: string;
  total: number;
  kind: "check" | "damage" | "heal" | "other";
};

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

export function DicePanel() {
  const character = useCharacterStore((s) => s.character);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addLog = useCharacterStore((s) => s.addLog);
  const setRollMode = useCharacterStore((s) => s.setRollMode);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const clearBeast = useCharacterStore((s) => s.clearBeast);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);

  const [log, setLog] = useState<LogEntry[]>([]);
  const row = getLevelData(character.level);
  const pb = effectivePb(character.level, character.multiclass);
  const conMod = abilityMod(character.abilities.con);
  const chaMod = abilityMod(character.abilities.cha);
  const luckMax = getLuckMax(character.level, character.multiclass);

  const mode = character.rollMode ?? "norm";
  const beastOn = !!character.beastActive;

  function push(label: string, detail: string, total: number, kind: LogEntry["kind"] = "other") {
    setLog((prev) =>
      [{ id: Date.now() + Math.random(), label, detail, total, kind }, ...prev].slice(0, 20),
    );
    addLog(`${label}: ${total} (${detail})`);
    setLastRoll({ label, total, detail, at: Date.now() });
  }

  function effectiveMode(forceAdv = false, kind: RollKind = "check"): RollMode {
    const sticky = character.rollMode ?? "norm";
    let base: RollMode = sticky;
    if (forceAdv || beastOn || character.pendingAdv) {
      base = sticky === "dis" || character.pendingDis ? "norm" : "adv";
    } else if (character.pendingDis) {
      base = sticky === "adv" ? "norm" : "dis";
    }
    return conditionMode(character, kind, base);
  }

  function doD20(
    label: string,
    mod: number,
    opts?: { forceAdv?: boolean; consume?: boolean; kind?: RollKind },
  ) {
    const kind = opts?.kind ?? "check";
    const m = opts?.forceAdv ? effectiveMode(true, kind) : effectiveMode(false, kind);
    if (opts?.consume !== false) {
      consumeRollMode();
    }
    const r = rollD20(label, mod, m);
    // Protected: if d20 ≤9 and has points, offer auto note
    if (r.used <= 9 && character.backgroundFeatId === "protected") {
      const left = luckMax - (character.protectedUsed ?? 0);
      if (left > 0) {
        toast.message(`d20=${r.used} ≤9 — можно Защищённый: переброс`, {
          action: {
            label: "Переброс",
            onClick: () => {
              if (!spendProtected()) return;
              const r2 = rollD20(label + " (переброс)", mod, "norm");
              push(r2.label, r2.detail + (r2.crit ? " · КРИТ" : ""), r2.total, "check");
              toast.success(`Переброс: ${r2.total}`);
            },
          },
        });
      }
    }
    const tag = r.crit ? " · КРИТ" : r.fumble ? " · ПРОВАЛ" : "";
    push(r.label, r.detail + tag, r.total, "check");
    toast.message(`${r.label}: ${r.total}`);
    return r;
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
      toast.success(`Питание: ${sixes}×«6» → +${sixes} ОБК`);
    }
    push(
      half ? "Питание ½ (Bane)" : "Питание",
      `${rolls.join("+")} + Тел ${formatMod(conPart)}`,
      sum,
      "damage",
    );
    toast.message(
      half
        ? `Питание ½ Bane: ${sum}`
        : `Питание: ${sum} · Bane: «${character.preferredBlood || "?"}»? иначе ½ кости`,
    );
  }

  function rollInitiative() {
    const mod = abilityMod(character.abilities.dex);
    const forceAdv = hasAlacrity(character.selectedFeats);
    const r = doD20("Инициатива", mod, { forceAdv, kind: "init" });
    setField("initiative", r.total);
  }

  function rollSave(key: keyof Abilities, name: string) {
    const prof = !!character.saveProfs[key];
    const bonus = abilityMod(character.abilities[key]) + (prof ? pb : 0);
    const forceAdv = character.clan === "ventrue" && key === "wis";
    doD20(`Спас ${name}`, bonus, { forceAdv, kind: "save" });
  }

  function rollAbility(key: keyof Abilities, name: string) {
    doD20(`Проверка ${name}`, abilityMod(character.abilities[key]), { kind: "check" });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dices className="size-4 text-accent" />
          <h3 className="font-display text-base tracking-wide">Авто-кости</h3>
          {beastOn && (
            <span className="rounded-full bg-beast/20 px-2 py-0.5 text-[10px] font-medium text-beast">
              Зверь: преим.
            </span>
          )}
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
              onClick={() => setRollMode(id)}
              className={cn(
                "h-8 px-2.5 text-xs font-medium rounded-[var(--radius-sm)]",
                mode === id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Core combat rolls */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button type="button" variant="blood" size="sm" onClick={() => rollFeed(false)}>
          Питание {row.feed}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => rollFeed(true)}>
          Питание ½ Bane
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            if (character.bloodCurrent < 1) {
              toast.error("Нет ОБК");
              return;
            }
            spendBlood(1);
            const r = rollDie(10) + character.level;
            adjustHp(r);
            push("Исцеление ран", `1d10+${character.level} (−1 ОБК)`, r, "heal");
            toast.success(`+${r} хитов`);
          }}
        >
          Лечение 1 ОБК
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={rollInitiative}>
          Инициатива
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!activateBeast()) {
              toast.error("Зверь исчерпан");
              return;
            }
            toast.success("Зверь: преимущество на d20");
            addLog("Зверь активирован — преимущество");
          }}
        >
          <Sparkles className="size-3.5" /> Зверь+преим.
        </Button>
        {beastOn && (
          <Button type="button" variant="ghost" size="sm" onClick={clearBeast}>
            Снять Зверя
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!spendLucky()) {
              toast.error("Нет очков Везучего");
              return;
            }
            patch({ pendingAdv: true });
            toast.success("Везучий: след. бросок с преимуществом");
            addLog("Везучий → pending преимущество");
          }}
        >
          Везучий → преим.
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!spendLucky()) {
              toast.error("Нет очков Везучего");
              return;
            }
            patch({ pendingDis: true });
            toast.success("Везучий: помеха на атаку по тебе");
            addLog("Везучий → помеха на атаку по тебе");
          }}
        >
          Везучий → помеха
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => doD20("Атака закл.", chaMod + pb, { kind: "attack" })}
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
          Сл {8 + pb + chaMod}
        </Button>
      </div>

      {/* Ability checks + saves */}
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Проверки · тап = бросок
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {ABIL.map(({ key, short }) => {
          const mod = abilityMod(character.abilities[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => rollAbility(key, short)}
              className="rounded-[var(--radius)] border border-border bg-surface-2 px-1 py-2 text-center active:bg-surface-3"
            >
              <div className="text-[10px] text-muted">{short}</div>
              <div className="font-display text-lg text-accent">{formatMod(mod)}</div>
            </button>
          );
        })}
      </div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Спасброски
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {ABIL.map(({ key, short }) => {
          const prof = !!character.saveProfs[key];
          const bonus = abilityMod(character.abilities[key]) + (prof ? pb : 0);
          const ventrueWis = character.clan === "ventrue" && key === "wis";
          return (
            <button
              key={`save-${key}`}
              type="button"
              onClick={() => rollSave(key, short)}
              className={cn(
                "rounded-[var(--radius)] border px-1 py-2 text-center active:bg-surface-3",
                prof ? "border-primary/50 bg-primary/10" : "border-border bg-surface-2",
              )}
            >
              <div className="text-[10px] text-muted">
                {short}
                {ventrueWis ? " ★" : ""}
              </div>
              <div className="font-display text-lg text-fg">{formatMod(bonus)}</div>
            </button>
          );
        })}
      </div>

      {/* Quick skills — top social/perception for Ventrue */}
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Навыки (быстрые)
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["persuasion", "intimidation", "deception", "insight", "perception", "stealth"] as const).map(
          (id) => {
            const sk = SKILLS.find((s) => s.id === id)!;
            const bonus = skillBonus(
              character.abilities[sk.ability],
              pb,
              character.skillProfs[id],
            );
            return (
              <Button
                key={id}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => doD20(sk.nameRu, bonus, { kind: "check" })}
              >
                {sk.nameRu} {formatMod(bonus)}
              </Button>
            );
          },
        )}
      </div>

      {/* Attack list auto */}
      {character.attacks.length > 0 && (
        <>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Атаки (бросок + урон)
          </div>
          <div className="mb-3 space-y-1.5">
            {character.attacks.map((atk) => (
              <Button
                key={atk.id}
                type="button"
                variant="blood"
                size="sm"
                className="h-auto w-full justify-between py-2"
                onClick={() => {
                  const hit = doD20(atk.name, atk.bonus, { kind: "attack" });

                  const dmg = rollDamage(atk.damage, `Урон · ${atk.name}`);
                  // crit: double dice roughly by rolling again
                  if (hit.crit) {
                    const dmg2 = rollDamage(atk.damage, `Крит · ${atk.name}`);
                    push(
                      dmg2.label,
                      dmg2.detail,
                      dmg.total + dmg2.total,
                      "damage",
                    );
                    toast.success(`КРИТ! ${atk.name}: ${dmg.total + dmg2.total} ${atk.type}`);
                  } else {
                    push(dmg.label, dmg.detail, dmg.total, "damage");
                    toast.message(`${atk.name} урон: ${dmg.total} ${atk.type}`);
                  }
                }}
              >
                <span>
                  {atk.name}{" "}
                  <span className="text-primary-fg/80">{formatMod(atk.bonus)}</span>
                </span>
                <span className="text-[10px] opacity-80">
                  {atk.damage} {atk.type}
                </span>
              </Button>
            ))}
          </div>
        </>
      )}

      {log.length > 0 && (
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted">История бросков</span>
            <button type="button" className="text-muted hover:text-fg" onClick={() => setLog([])}>
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <ul className="max-h-56 space-y-2 overflow-y-auto scroll-thin">
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
                  className={cn(
                    "font-display text-xl tabular-nums",
                    e.kind === "heal"
                      ? "text-success"
                      : e.kind === "damage"
                        ? "text-primary"
                        : "text-accent",
                  )}
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
