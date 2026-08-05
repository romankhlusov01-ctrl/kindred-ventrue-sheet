import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import {
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
} from "@/lib/character-store";
import { SKILLS } from "@/data/skills";
import { originFeatById } from "@/data/origin-ru";

/** Compact text card for Long Story / Discord / notes */
export function CombatCard() {
  const c = useCharacterStore((s) => s.character);
  const row = getLevelData(c.level);
  const pb = row.pb;
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);


  function build() {
    const skills = SKILLS.filter((sk) => c.skillProfs[sk.id])
      .map((sk) => {
        const b = skillBonus(c.abilities[sk.ability], pb, c.skillProfs[sk.id]);
        return `${sk.nameRu} ${formatMod(b)}`;
      })
      .join(", ");
    const attacks = c.attacks
      .map((a) => `${a.name} ${formatMod(a.bonus)} (${a.damage} ${a.type})`)
      .join("\n  ");
    return [
      `━━ ${c.name} · Вентру ${c.level}${c.multiclass ? " / " + c.multiclass : ""} ━━`,
      `ХП ${c.hpCurrent}/${c.hpMax} · КД ${c.ac} · Иниц ${formatMod(abilityMod(c.abilities.dex))} · Ск ${c.speed}`,
      `СИЛ ${c.abilities.str} ЛОВ ${c.abilities.dex} ТЕЛ ${c.abilities.con} ИНТ ${c.abilities.int} МУД ${c.abilities.wis} ХАР ${c.abilities.cha}`,
      `ОБК ${c.bloodCurrent}/${bloodMax} · Зверь ${pb - c.beastUsed}/${pb} · Питание ${row.feed}`,
      `Сл ${dc} · БМ ${formatMod(pb)} · Bane: ${c.preferredBlood || "—"}`,
      `Везучий ${luckMax - c.luckyUsed}/${luckMax} · Защищ. ${luckMax - c.protectedUsed}/${luckMax}`,
      `Origin: ${originFeatById(c.originFeatId)?.name ?? c.originFeatId} + ${originFeatById(c.backgroundFeatId)?.name ?? c.backgroundFeatId}`,
      `Навыки: ${skills || "—"}`,
      `Атаки:\n  ${attacks || "—"}`,
      c.concentrating ? `Концентрация: ${c.concentrating}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm">Карточка для стола</h3>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            const t = build();
            try {
              await navigator.clipboard.writeText(t);
              toast.success("Скопировано");
            } catch {
              toast.message(t.slice(0, 80) + "…");
            }
          }}
        >
          <Copy className="size-3.5" /> Копировать
        </Button>
      </div>
      <pre className="max-h-48 overflow-auto scroll-thin whitespace-pre-wrap rounded bg-surface-2 p-2 font-mono text-[10px] leading-relaxed text-muted">
        {build()}
      </pre>
    </div>
  );
}
