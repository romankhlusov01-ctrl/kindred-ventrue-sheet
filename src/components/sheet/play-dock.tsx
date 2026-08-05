import { toast } from "sonner";
import {
  Droplets,
  Heart,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn, abilityMod, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { effectivePb } from "@/lib/level-utils";
import {
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
} from "@/lib/character-store";

import { rollD20, rollDamage } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { SKILLS } from "@/data/skills";
import { useSessionStore } from "@/lib/session-store";

/**
 * Fixed bottom dock for one-thumb solo play (mobile-first).
 * Always shows last roll + critical actions.
 */
export function PlayDock() {
  const c = useCharacterStore((s) => s.character);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const addLog = useCharacterStore((s) => s.addLog);
  const setField = useCharacterStore((s) => s.setField);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const shortRest = useCharacterStore((s) => s.shortRest);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<{ label: string; total: number; detail: string } | null>(
    null,
  );

  const pb = effectivePb(c.level, c.multiclass);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);


  const luckyLeft = Math.max(0, luckMax - (c.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (c.protectedUsed ?? 0));
  const primary = c.attacks[0];
  const atZero = c.hpCurrent <= 0;

  function show(label: string, total: number, detail: string) {
    setLast({ label, total, detail });
    addLog(`${label}: ${total} (${detail})`);
    setLastRoll({ label, total, detail, at: Date.now() });
  }

  function modeFor(kind: "check" | "attack" | "save" | "init") {
    const sticky = c.rollMode ?? "norm";
    let base = sticky;
    if (c.beastActive || c.pendingAdv) {
      base = sticky === "dis" ? "norm" : "adv";
    }
    return conditionMode(c, kind, base);
  }

  function rollInit() {
    const m = modeFor("init");
    const force = c.selectedFeats.includes("alacrity") ? ("adv" as const) : m;
    const r = rollD20("Инициатива", abilityMod(c.abilities.dex), force);
    consumeRollMode();
    setField("initiative", r.total);
    show(r.label, r.total, r.detail);
    toast.message(`Иниц ${r.total}`);
  }

  function rollPrimaryAttack() {
    if (!primary) {
      toast.error("Нет атак");
      return;
    }
    const m = modeFor("attack");
    const r = rollD20(primary.name, primary.bonus, m);
    consumeRollMode();
    show(r.label, r.total, r.detail);
    const dmg = rollDamage(primary.damage);
    let total = dmg.total;
    if (r.crit) {
      const d2 = rollDamage(primary.damage);
      total += d2.total;
    }
    show(`Урон · ${primary.name}`, total, dmg.detail + (r.crit ? " · крит×2" : ""));
    toast.success(`${primary.name}: ${r.total} → ${total} ${primary.type}`);
  }

  function rollFeed() {
    const row = getLevelData(c.level);
    const count = row.feedCount;
    const rolls = Array.from({ length: count }, () => rollDie(6));
    const sixes = rolls.filter((x) => x === 6).length;
    const con = Math.max(1, abilityMod(c.abilities.con));
    const sum = rolls.reduce((a, b) => a + b, 0) + con;
    if (sixes) gainBlood(sixes);
    show("Питание", sum, `${rolls.join("+")}+Тел`);
    const pref = c.preferredBlood ? ` · Bane: ${c.preferredBlood}` : "";
    toast.success(`Питание ${sum}${sixes ? ` · +${sixes} ОБК` : ""}${pref}`);
  }

  function rollPersuade() {
    const sk = SKILLS.find((s) => s.id === "persuasion")!;
    const bonus = skillBonus(c.abilities.cha, pb, c.skillProfs.persuasion);
    const r = rollD20(sk.nameRu, bonus, modeFor("check"));
    consumeRollMode();
    show(r.label, r.total, r.detail);
    toast.message(`${sk.nameRu}: ${r.total}`);
  }

  if (!open) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex h-11 items-center gap-2 rounded-full border border-border bg-surface/95 px-4 shadow-lg backdrop-blur"
        >
          <ChevronUp className="size-4 text-accent" />
          <span className="text-sm font-medium">Панель боя</span>
          {last && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 font-display text-sm text-primary">
              {last.total}
            </span>
          )}
          {atZero && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
              0 ХП
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgb(0_0_0_/_0.45)] backdrop-blur-md">
      {atZero && (
        <div className="mx-3 mb-1 rounded border border-primary/50 bg-primary/20 px-2 py-1 text-center text-[11px] font-semibold text-primary">
          0 хитов · Kindred: спас. от смерти автоматически успешны · Protected / кол?
        </div>
      )}
      {last && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-[var(--radius)] border border-primary/30 bg-primary/10 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-xs text-muted">{last.label}</div>
            <div className="truncate text-[11px] text-faint">{last.detail}</div>
          </div>
          <div className="font-display text-3xl tabular-nums leading-none text-primary">
            {last.total}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3 pb-1 text-[11px] text-muted">
        <span>
          <Heart className="mr-1 inline size-3 text-primary" />
          {c.hpCurrent}/{c.hpMax}
          {c.tempHp > 0 ? ` (+${c.tempHp})` : ""}
        </span>
        <span>
          <Droplets className="mr-1 inline size-3 text-primary" />
          {c.bloodCurrent}/{bloodMax}
        </span>
        <span>
          <Sparkles className="mr-1 inline size-3 text-beast" />
          {Math.max(0, pb - c.beastUsed)}/{pb}
          {c.beastActive ? " ★" : ""}
        </span>
        <span className="tabular-nums text-faint">
          L{luckyLeft}/P{protectedLeft}
        </span>
        <button type="button" className="text-faint" onClick={() => setOpen(false)}>
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1 px-2 pb-1 sm:grid-cols-7">
        <DockBtn
          label="−ХП"
          onClick={() => {
            adjustHp(-1);
            toast.message(`ХП ${c.hpCurrent - 1}`);
          }}
        />
        <DockBtn
          label="+ХП"
          onClick={() => {
            adjustHp(1);
          }}
        />
        <DockBtn
          label="−ОБК"
          danger
          onClick={() => {
            if (c.bloodCurrent < 1) {
              toast.error("Нет ОБК");
              return;
            }
            spendBlood(1);
          }}
        />
        <DockBtn label="Иниц" onClick={rollInit} />
        <DockBtn
          label="Ход"
          onClick={() => {
            newTurn();
            tickEffects();
            toast.message("Новый ход · эффекты −1");
          }}
        />
        <DockBtn
          label="Зверь"
          accent
          onClick={() => {
            if (!activateBeast()) toast.error("Зверь исчерпан");
            else toast.success("Преимущество");
          }}
        />
        <DockBtn label="Питан." danger onClick={rollFeed} />
        <DockBtn label="Убежд." onClick={rollPersuade} />
        <DockBtn
          label={primary ? "Атака" : "—"}
          danger
          className="col-span-2 sm:col-span-1"
          onClick={rollPrimaryAttack}
        />
        <DockBtn
          label={`Lucky ${luckyLeft}`}
          accent
          onClick={() => {
            if (!spendLucky()) {
              toast.error("Нет Lucky");
              return;
            }
            setField("pendingAdv", true);
            addLog("Lucky — преимущество на следующий d20");
            toast.success("Lucky: преим. на след. d20");
          }}
        />
        <DockBtn
          label={`Prot ${protectedLeft}`}
          onClick={() => {
            if (!spendProtected()) {
              toast.error("Нет Protected");
              return;
            }
            addLog("Protected — реакция (см. черту)");
            toast.success("Protected использован");
          }}
        />
        <DockBtn
          label="Отдых"
          onClick={() => {
            shortRest();
            toast.message("Короткий отдых");
          }}
        />
        <DockBtn
          label={c.inspiration ? "Вдохн.✓" : "Вдохн."}
          accent={c.inspiration}
          onClick={() => {
            if (c.inspiration) {
              setField("inspiration", false);
              setField("pendingAdv", true);
              toast.success("Вдохновение → преим.");
            } else {
              setField("inspiration", true);
              toast.message("Вдохновение");
            }
          }}
        />

      </div>
    </div>
  );
}

function DockBtn({
  label,
  onClick,
  danger,
  accent,
  className,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-[var(--radius)] border text-xs font-semibold active:scale-[0.97]",
        danger && "border-primary/40 bg-primary/15 text-primary",
        accent && "border-beast/40 bg-beast/15 text-beast",
        !danger && !accent && "border-border bg-surface-2 text-fg",
        className,
      )}
    >
      {label}
    </button>
  );
}
