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
 * One-thumb bottom dock — only self actions.
 * Adapts primary row to scenario (combat / social / feed / rest).
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
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const shortRest = useCharacterStore((s) => s.shortRest);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const undo = useSessionStore((s) => s.undo);
  const [open, setOpen] = useState(true);
  const [more, setMore] = useState(false);

  const pb = effectivePb(c.level, c.multiclass);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const luckyLeft = Math.max(0, luckMax - (c.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (c.protectedUsed ?? 0));
  const primary = c.attacks[0];
  const atZero = c.hpCurrent <= 0;
  const feedCount = getLevelData(c.level).feedCount;
  const scenario = c.scenario ?? "combat";

  function show(label: string, total: number, detail: string) {
    addLog(`${label}: ${total} (${detail})`);
    setLastRoll({ label, total, detail, at: Date.now() });
  }

  function modeFor(kind: "check" | "attack" | "save" | "init") {
    const sticky = c.rollMode ?? "norm";
    let base = sticky;
    if (c.beastActive || c.pendingAdv) {
      base = sticky === "dis" ? "norm" : "adv";
    }
    if (c.pendingDis) {
      base = sticky === "adv" ? "norm" : "dis";
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
      total += rollDamage(primary.damage).total;
    }
    show(`Урон · ${primary.name}`, total, dmg.detail + (r.crit ? " · крит×2" : ""));
    toast.success(`${primary.name}: ${r.total} → ${total} ${primary.type}`);
  }

  function rollFeed() {
    const rolls = Array.from({ length: feedCount }, () => rollDie(6));
    const sixes = rolls.filter((x) => x === 6).length;
    const con = Math.max(1, abilityMod(c.abilities.con));
    const sum = rolls.reduce((a, b) => a + b, 0) + con;
    if (sixes) {
      pushUndo("Питание ОБК");
      gainBlood(sixes);
    }
    show("Питание", sum, `${rolls.join("+")}+Тел`);
    toast.success(`Питание ${sum}${sixes ? ` · +${sixes} ОБК` : ""}`);
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
      <div className="fixed inset-x-0 bottom-14 z-40 p-2 sm:bottom-0 sm:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex h-12 max-w-sm items-center gap-2 rounded-full border border-border bg-surface/95 px-5 shadow-lg backdrop-blur"
        >
          <ChevronUp className="size-4 text-primary" />
          <span className="text-sm font-medium">Играть</span>
          {lastRoll && (
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 font-display text-base text-primary">
              {lastRoll.total}
            </span>
          )}
          <span className="text-xs text-muted">
            {c.hpCurrent}/{c.hpMax}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-bg/95 pb-1 pt-2 shadow-[0_-8px_32px_rgb(0_0_0_/_0.45)] backdrop-blur-md sm:bottom-0 sm:pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      {atZero && (
        <div className="mx-3 mb-1 flex items-center justify-between gap-2 rounded-[var(--radius)] border border-primary bg-primary/20 px-3 py-2 text-sm">
          <span className="font-medium text-primary">0 ХП</span>
          <button
            type="button"
            className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg"
            onClick={() => {
              pushUndo("Protected 0→1");
              if (!spendProtected()) toast.error("Нет Protected");
              else {
                setField("hpCurrent", 1);
                toast.success("1 хит");
              }
            }}
          >
            Protected 0→1
          </button>
        </div>
      )}

      {lastRoll && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-[var(--radius)] border border-primary/30 bg-primary/10 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-xs text-muted">{lastRoll.label}</div>
            <div className="truncate text-[11px] text-faint">{lastRoll.detail}</div>
          </div>
          <div className="roll-flash font-display text-3xl tabular-nums leading-none text-primary">
            {lastRoll.total}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3 pb-1 text-[11px] text-muted">
        <span>
          <Heart className="mr-0.5 inline size-3 text-primary" />
          {c.hpCurrent}/{c.hpMax}
          {c.tempHp > 0 ? ` (+${c.tempHp})` : ""}
        </span>
        <span>
          <Droplets className="mr-0.5 inline size-3 text-primary" />
          {c.bloodCurrent}/{bloodMax}
        </span>
        <span>
          <Sparkles className="mr-0.5 inline size-3 text-beast" />
          {Math.max(0, pb - c.beastUsed)}/{pb}
          {c.beastActive ? " ★" : ""}
        </span>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase text-faint">
          {scenario === "combat"
            ? "бой"
            : scenario === "social"
              ? "соц"
              : scenario === "feed"
                ? "пит"
                : "отд"}
        </span>
        <button type="button" className="text-faint" onClick={() => setOpen(false)}>
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 px-2 pb-1">
        {scenario === "social" ? (
          <>
            <DockBtn label="Убежд." danger onClick={rollPersuade} />
            <DockBtn
              label="Голос"
              danger
              onClick={() => {
                const voice = c.customResources.find((r) => /голос/i.test(r.name));
                if (!voice || voice.current <= 0) return toast.error("Нет Голоса");
                pushUndo("Голос");
                useCharacterStore.getState().updateResource(voice.id, {
                  current: voice.current - 1,
                });
                toast.message("Голос −1");
              }}
            />
            <DockBtn
              label="Зверь"
              accent
              onClick={() => {
                pushUndo("Зверь");
                if (!activateBeast()) toast.error("Зверь исчерпан");
                else toast.success("Преим.");
              }}
            />
            <DockBtn
              label="Ход"
              onClick={() => {
                newTurn();
                tickEffects();
                toast.message("Новый ход");
              }}
            />
          </>
        ) : scenario === "feed" ? (
          <>
            <DockBtn label="Питан." danger onClick={rollFeed} />
            <DockBtn
              label="−ОБК"
              danger
              onClick={() => {
                if (c.bloodCurrent < 1) toast.error("Нет ОБК");
                else {
                  pushUndo("−ОБК");
                  spendBlood(1);
                }
              }}
            />
            <DockBtn
              label="+ОБК"
              onClick={() => {
                pushUndo("+ОБК");
                gainBlood(1);
              }}
            />
            <DockBtn
              label="Лечить"
              danger
              onClick={() => {
                if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
                pushUndo("Лечение");
                spendBlood(1);
                const heal = Math.floor(Math.random() * 10) + 1 + c.level;
                adjustHp(heal);
                show("Исцеление", heal, `d10+${c.level}`);
                toast.success(`+${heal} ХП`);
              }}
            />
          </>
        ) : scenario === "rest" ? (
          <>
            <DockBtn
              label="К.отдых"
              onClick={() => {
                shortRest();
                toast.message("Короткий");
              }}
            />
            <DockBtn
              label="−ХП"
              onClick={() => {
                pushUndo("−1 ХП");
                adjustHp(-1);
              }}
            />
            <DockBtn
              label="+ХП"
              onClick={() => {
                pushUndo("+1 ХП");
                adjustHp(1);
              }}
            />
            <DockBtn
              label="Отмена"
              onClick={() => {
                if (undo()) toast.message("Отменено");
                else toast.error("Пусто");
              }}
            />
          </>
        ) : (
          <>
            <DockBtn label={primary ? (primary.name.length > 8 ? primary.name.slice(0, 7) + "…" : primary.name) : "—"} danger onClick={rollPrimaryAttack} />
            <DockBtn label="Питан." danger onClick={rollFeed} />
            <DockBtn
              label="Зверь"
              accent
              onClick={() => {
                pushUndo("Зверь");
                if (!activateBeast()) toast.error("Зверь исчерпан");
                else toast.success("Преим.");
              }}
            />
            <DockBtn
              label="Ход"
              onClick={() => {
                newTurn();
                tickEffects();
                toast.message("Новый ход");
              }}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1 px-2 pb-1">
        <DockBtn
          label="−ХП"
          onClick={() => {
            pushUndo("−1 ХП");
            adjustHp(-1);
          }}
        />
        <DockBtn
          label="+ХП"
          onClick={() => {
            pushUndo("+1 ХП");
            adjustHp(1);
          }}
        />
        <DockBtn
          label="−ОБК"
          danger
          onClick={() => {
            if (c.bloodCurrent < 1) toast.error("Нет ОБК");
            else {
              pushUndo("−ОБК");
              spendBlood(1);
            }
          }}
        />
        <DockBtn label="Иниц" onClick={rollInit} />
        <DockBtn
          label="↩"
          onClick={() => {
            if (undo()) toast.message("Отменено");
            else toast.error("Пусто");
          }}
        />
      </div>

      {more && (
        <div className="grid grid-cols-4 gap-1 px-2 pb-1">
          <DockBtn
            label={`Удч ${luckyLeft}`}
            onClick={() => {
              pushUndo("Везучий");
              if (!spendLucky()) toast.error("Нет");
              else {
                setField("pendingAdv", true);
                toast.success("Преим.");
              }
            }}
          />
          <DockBtn
            label={`Защ ${protectedLeft}`}
            danger
            onClick={() => {
              pushUndo("Protected");
              if (!spendProtected()) toast.error("Нет");
              else toast.message("Protected");
            }}
          />
          <DockBtn
            label={c.inspiration ? "Вдохн" : "+Вдх"}
            accent={!!c.inspiration}
            onClick={() => {
              if (c.inspiration) {
                setField("inspiration", false);
                setField("pendingAdv", true);
                toast.message("Вдохновение → преим.");
              } else {
                setField("inspiration", true);
                toast.message("+вдохновение");
              }
            }}
          />
          <DockBtn
            label="Отдых"
            onClick={() => {
              shortRest();
              toast.message("Короткий");
            }}
          />
          <DockBtn
            label="d20"
            onClick={() => {
              const r = rollD20("d20", 0, modeFor("check"));
              consumeRollMode();
              show(r.label, r.total, r.detail);
            }}
          />
          <DockBtn
            label="−5ХП"
            onClick={() => {
              pushUndo("−5 ХП");
              adjustHp(-5);
            }}
          />
          <DockBtn
            label="+5ХП"
            onClick={() => {
              pushUndo("+5 ХП");
              adjustHp(5);
            }}
          />
          <DockBtn label="Скрыть" onClick={() => setOpen(false)} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setMore((v) => !v)}
        className="mx-auto mb-1 flex items-center gap-1 py-1 text-[10px] text-muted"
      >
        {more ? "Свернуть доп." : "Удача · отдых · d20"}
        {more ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
      </button>
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
