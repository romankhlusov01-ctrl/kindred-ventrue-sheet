import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { abilityMod, formatMod } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { effectivePb } from "@/lib/level-utils";
import {
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
} from "@/lib/character-store";
import { SKILLS } from "@/data/skills";
import { originFeatById, speciesByName, fiendishLegacyById } from "@/data/origin-ru";

/** Print / Save-as-PDF the character (browser print dialog). */
export function PrintSheetButton({ className }: { className?: string }) {
  const c = useCharacterStore((s) => s.character);

  function print() {
    // ensure print block filled
    const el = document.getElementById("print-character-sheet");
    if (!el) {
      toast.error("Блок печати не найден");
      return;
    }
    window.print();
  }

  return (
    <Button type="button" size="sm" variant="secondary" className={className ?? "h-10"} onClick={print}>
      <Printer className="size-3.5" />
      <span className="hidden sm:inline">PDF / печать</span>
      <span className="sm:hidden">PDF</span>
    </Button>
  );
}

/** Hidden until print — full RAW-ish card */
export function PrintSheetBlock() {
  const c = useCharacterStore((s) => s.character);
  const pb = effectivePb(c.level, c.multiclass);
  const row = getLevelData(c.level);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const cha = abilityMod(c.abilities.cha);
  const dc = 8 + pb + cha;
  const sp = speciesByName(c.species);
  const origin = originFeatById(c.originFeatId);
  const bg = originFeatById(c.backgroundFeatId);
  const leg = c.fiendishLegacy ? fiendishLegacyById(c.fiendishLegacy) : null;

  const skills = SKILLS.filter((s) => (c.skillProfs[s.id] ?? "none") !== "none")
    .map((s) => {
      const b = skillBonus(c.abilities[s.ability], pb, c.skillProfs[s.id]);
      return `${s.nameRu} ${formatMod(b)}`;
    })
    .join(" · ");

  return (
    <div id="print-character-sheet" className="print-only">
      <h1>
        {c.name || "Сородич"} — Kindred {c.level} · Ventrue
      </h1>
      <p>
        {sp.name}
        {leg ? ` (${leg.name})` : ""} · {c.background} · {origin?.name} + {bg?.name}
        {c.multiclass ? ` · ${c.multiclass}` : ""}
      </p>
      <p>
        ХП {c.hpCurrent}/{c.hpMax} · КД {c.ac} · Скор. {c.speed} · БМ {formatMod(pb)} · Сл {dc} ·
        ОБК {c.bloodCurrent}/{bloodMax} · Питание {row.feed}
      </p>
      <p>
        СИЛ {c.abilities.str} ({formatMod(abilityMod(c.abilities.str))}) · ЛОВ {c.abilities.dex} (
        {formatMod(abilityMod(c.abilities.dex))}) · ТЕЛ {c.abilities.con} (
        {formatMod(abilityMod(c.abilities.con))}) · ИНТ {c.abilities.int} (
        {formatMod(abilityMod(c.abilities.int))}) · МУД {c.abilities.wis} (
        {formatMod(abilityMod(c.abilities.wis))}) · ХАР {c.abilities.cha} (
        {formatMod(abilityMod(c.abilities.cha))})
      </p>
      <p>
        Везучий {luckMax - c.luckyUsed}/{luckMax} · Защищ. {luckMax - c.protectedUsed}/{luckMax} ·
        Зверь {pb - c.beastUsed}/{pb}
      </p>
      <p>
        <strong>Навыки:</strong> {skills || "—"}
      </p>
      <p>
        <strong>Атаки:</strong>{" "}
        {c.attacks.map((a) => `${a.name} ${formatMod(a.bonus)} ${a.damage} ${a.type}`).join("; ") ||
          "—"}
      </p>
      <p>
        <strong>Bane:</strong> {c.preferredBlood || "—"}
      </p>
      <p>
        <strong>Черты:</strong> {c.selectedFeats.join(", ") || "—"}
      </p>
      <p className="src">
        Источники: Bound by Blood PDF · dnd.su (Human, Lucky) · PHB 2024 · лист Kindred Ventrue
      </p>
      <pre>{c.notes}</pre>
    </div>
  );
}
