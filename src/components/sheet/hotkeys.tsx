import { useEffect } from "react";
import { toast } from "sonner";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, rollDie } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { rollD20, rollDamage } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";

/**
 * Desktop self hotkeys (ignored when typing).
 * Space/N — turn · A — attack · F — feed · B — beast · I — init · Z — undo · H/J — HP
 * 1–4 — scenario combat/social/feed/rest
 */
export function Hotkeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const store = useCharacterStore.getState();
      const c = store.character;
      const session = useSessionStore.getState();
      const setLast = session.setLastRoll;

      const key = e.key.toLowerCase();

      if (key === "1") {
        store.setField("scenario", "combat");
        toast.message("Бой");
        return;
      }
      if (key === "2") {
        store.setField("scenario", "social");
        toast.message("Социал");
        return;
      }
      if (key === "3") {
        store.setField("scenario", "feed");
        toast.message("Питание");
        return;
      }
      if (key === "4") {
        store.setField("scenario", "rest");
        toast.message("Отдых");
        return;
      }

      if (key === "z") {
        e.preventDefault();
        if (session.undo()) toast.message("Отменено");
        else toast.error("Нечего отменять");
        return;
      }

      if (key === " " || key === "n") {
        e.preventDefault();
        store.newTurn();
        session.tickEffects();
        toast.message("Новый ход");
        return;
      }

      if (key === "b") {
        e.preventDefault();
        session.pushUndo("Зверь");
        if (!store.activateBeast()) toast.error("Зверь исчерпан");
        else toast.success("Зверь");
        return;
      }
      if (key === "i") {
        e.preventDefault();
        const mode = conditionMode(c, "init", c.rollMode ?? "norm");
        const force = c.selectedFeats.includes("alacrity") ? ("adv" as const) : mode;
        const r = rollD20("Инициатива", abilityMod(c.abilities.dex), force);
        store.consumeRollMode();
        store.setField("initiative", r.total);
        store.addLog(`Иниц ${r.total}`);
        setLast({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
        toast.message(`Иниц ${r.total}`);
        return;
      }
      if (key === "a") {
        e.preventDefault();
        const primary = c.attacks[0];
        if (!primary) {
          toast.error("Нет атак");
          return;
        }
        const mode = conditionMode(
          c,
          "attack",
          c.beastActive || c.pendingAdv ? "adv" : (c.rollMode ?? "norm"),
        );
        const r = rollD20(primary.name, primary.bonus, mode);
        store.consumeRollMode();
        const dmg = rollDamage(primary.damage);
        let total = dmg.total;
        if (r.crit) total += rollDamage(primary.damage).total;
        setLast({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
        setLast({
          label: `Урон · ${primary.name}`,
          total,
          detail: dmg.detail + (r.crit ? " · крит" : ""),
          at: Date.now(),
        });
        store.addLog(`${primary.name}: ${r.total} → ${total}`);
        toast.success(`${primary.name}: ${r.total} → ${total}`);
        return;
      }
      if (key === "f") {
        e.preventDefault();
        const row = getLevelData(c.level);
        const rolls = Array.from({ length: row.feedCount }, () => rollDie(6));
        const sixes = rolls.filter((x) => x === 6).length;
        const con = Math.max(1, abilityMod(c.abilities.con));
        const sum = rolls.reduce((a, b) => a + b, 0) + con;
        if (sixes) {
          session.pushUndo("Питание ОБК");
          store.gainBlood(sixes);
        }
        setLast({
          label: "Питание",
          total: sum,
          detail: rolls.join("+"),
          at: Date.now(),
        });
        store.addLog(`Питание ${sum}${sixes ? ` +${sixes} ОБК` : ""}`);
        toast.success(`Питание ${sum}`);
        return;
      }
      if (key === "h") {
        e.preventDefault();
        session.pushUndo("−1 ХП");
        store.adjustHp(-1);
        toast.message("−1 ХП");
        return;
      }
      if (key === "j") {
        e.preventDefault();
        session.pushUndo("+1 ХП");
        store.adjustHp(1);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <p className="hidden text-[10px] text-faint sm:block">
      Клавиши:{" "}
      <kbd className="rounded border border-border px-1">1–4</kbd> сценарий ·{" "}
      <kbd className="rounded border border-border px-1">N</kbd> ход ·{" "}
      <kbd className="rounded border border-border px-1">A</kbd> атака ·{" "}
      <kbd className="rounded border border-border px-1">F</kbd> питание ·{" "}
      <kbd className="rounded border border-border px-1">B</kbd> зверь ·{" "}
      <kbd className="rounded border border-border px-1">Z</kbd> отмена ·{" "}
      <kbd className="rounded border border-border px-1">H</kbd>/
      <kbd className="rounded border border-border px-1">J</kbd> −/+ХП
    </p>
  );
}
