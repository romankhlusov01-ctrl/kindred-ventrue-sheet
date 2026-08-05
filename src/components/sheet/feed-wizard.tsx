import { toast } from "sonner";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCharacterStore } from "@/lib/character-store";
import { getLevelData } from "@/data/kindred-ru";
import { abilityMod, rollDie } from "@/lib/utils";
import { useSessionStore } from "@/lib/session-store";

/**
 * Solo Feed scene: preferred blood check, dice, BP gain, max-HP drain reminder.
 */
export function FeedWizard() {
  const c = useCharacterStore((s) => s.character);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const setField = useCharacterStore((s) => s.setField);
  const patch = useCharacterStore((s) => s.patch);
  const addLog = useCharacterStore((s) => s.addLog);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const damageEnemy = useSessionStore((s) => s.damageEnemy);
  const enemies = useSessionStore((s) => s.enemies);
  const [matched, setMatched] = useState(true);
  const [targetId, setTargetId] = useState("");

  const row = getLevelData(c.level);
  const baseDice = row.feedCount;
  const dice = matched ? baseDice : Math.max(1, Math.floor(baseDice / 2));
  const canBonus = c.level >= 5;

  function feed() {
    const rolls = Array.from({ length: dice }, () => rollDie(6));
    const sixes = rolls.filter((x) => x === 6).length;
    const con = Math.max(1, abilityMod(c.abilities.con));
    const sum = rolls.reduce((a, b) => a + b, 0) + con;
    if (sixes) gainBlood(sixes);
    // clear hunger if gained any BP or spent intention
    if (sixes > 0 && c.hunger) {
      setField("hunger", false);
      patch({ conditions: c.conditions.filter((x) => x !== "Голод") });
    }
    setLastRoll({
      label: "Питание",
      total: sum,
      detail: `${rolls.join("+")}+Тел${matched ? "" : " ·½ Bane"}`,
      at: Date.now(),
    });
    addLog(
      `Питание ${sum} [${rolls.join("+")}]+${con}${matched ? "" : " ½Bane"}${sixes ? ` · +${sixes} ОБК` : ""}`,
    );
    if (targetId) {
      // Necrotic to max HP of prey — model as hp damage to enemy
      damageEnemy(targetId, sum);
      addLog(`Жертва: −${sum} (некрот. к макс. хитам — отметьте вручную при нужде)`);
    }
    toast.success(
      `Питание ${sum}${sixes ? ` · +${sixes} ОБК` : " · без «6»"}${matched ? "" : " · Bane ½"}`,
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm">
        <Droplets className="size-4 text-primary" /> Питание (сцена)
      </h3>
      <p className="mb-2 text-xs text-muted">
        База: {row.feed} · кости {dice}
        {canBonus ? " · с 5 ур. как БД" : ""} · Bane:{" "}
        <strong className="text-fg">{c.preferredBlood || "не указана"}</strong>
      </p>
      <label className="mb-2 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={matched}
          onChange={(e) => setMatched(e.target.checked)}
        />
        Предпочтённая кровь (иначе ½ костей)
      </label>
      <Input
        className="mb-2 h-8"
        placeholder="Bane / тип крови"
        value={c.preferredBlood}
        onChange={(e) => setField("preferredBlood", e.target.value)}
      />
      {enemies.length > 0 && (
        <label className="mb-2 block text-[10px] text-muted">
          Жертва из врагов
          <select
            className="mt-0.5 h-8 w-full rounded border border-border bg-surface-2 px-2 text-sm text-fg"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">— без привязки —</option>
            {enemies.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.hp}/{e.hpMax})
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="blood" onClick={feed}>
          Питаться ({dice}d6+Тел)
        </Button>
        {c.hunger && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (c.bloodCurrent < 1) {
                toast.error("Нужен 1 ОБК");
                return;
              }
              useCharacterStore.getState().spendBlood(1);
              setField("hunger", false);
              patch({ conditions: c.conditions.filter((x) => x !== "Голод") });
              addLog("Голод подавлен (−1 ОБК)");
              toast.message("Голод снят");
            }}
          >
            Снять голод (1 ОБК)
          </Button>
        )}
      </div>
    </div>
  );
}
