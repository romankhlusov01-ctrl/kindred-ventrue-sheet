import { useEffect } from "react";
import { toast } from "sonner";
import { useCharacterStore } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import {
  tableAttack,
  tableFeed,
  tableInitiative,
} from "@/lib/table-roll";

/**
 * Desktop hotkeys → same table-roll engine as UI buttons.
 * Space/N — turn · A — attack · F — feed · B — beast · I — init · Z — undo · H/J — HP
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
      const session = useSessionStore.getState();
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
        if (store.character.beastActive) {
          store.clearBeast();
          toast.message("Зверь снят");
        } else if (!store.activateBeast()) {
          toast.error("Зверь исчерпан");
        } else {
          store.setField("bonusUsed", true);
          toast.success("Зверь · преим.");
        }
        return;
      }
      if (key === "i") {
        e.preventDefault();
        tableInitiative();
        return;
      }
      if (key === "a") {
        e.preventDefault();
        const primary = store.character.attacks[0];
        if (!primary) {
          toast.error("Нет атак");
          return;
        }
        tableAttack(primary.id);
        return;
      }
      if (key === "f") {
        e.preventDefault();
        tableFeed(false);
        return;
      }

      if (key === "p") {
        e.preventDefault();
        session.pushUndo("Protected");
        if (!store.spendProtected()) toast.error("Нет Защищённого");
        else toast.message("Защищённый · переброс d20≤9");
        return;
      }
      if (key === "l") {
        e.preventDefault();
        session.pushUndo("Везучий");
        if (!store.spendLucky()) toast.error("Нет Везучего");
        else {
          store.setField("pendingAdv", true);
          toast.success("Везучий · преим.");
        }
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
      <kbd className="rounded border border-border px-1">L</kbd>/
      <kbd className="rounded border border-border px-1">P</kbd> удача ·{" "}
      <kbd className="rounded border border-border px-1">H</kbd>/
      <kbd className="rounded border border-border px-1">J</kbd> −/+ХП
    </p>
  );
}
