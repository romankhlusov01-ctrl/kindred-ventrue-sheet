import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abilityMod, formatMod } from "@/lib/utils";
import { getLevelData, KINDRED_FEATS } from "@/data/kindred-ru";
import { effectivePb } from "@/lib/level-utils";
import {
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
} from "@/lib/character-store";
import { SKILLS } from "@/data/skills";
import { originFeatById } from "@/data/origin-ru";

export function ExportMarkdown() {
  const c = useCharacterStore((s) => s.character);
  const pb = effectivePb(c.level, c.multiclass);

  function md() {
    const skills = SKILLS.map((sk) => {
      const prof = c.skillProfs[sk.id];
      if (!prof) return null;
      const b = skillBonus(c.abilities[sk.ability], pb, prof);
      return `- **${sk.nameRu}** ${formatMod(b)} (${prof})`;
    }).filter(Boolean);
    const feats = c.selectedFeats
      .map((id) => KINDRED_FEATS.find((f) => f.id === id))
      .filter(Boolean);
    return `# ${c.name}

**${c.species} · Вентру · Kindred ${c.level}**${c.multiclass ? ` / ${c.multiclass}` : ""}  
Био: ${c.background} · ${originFeatById(c.originFeatId)?.name} + ${originFeatById(c.backgroundFeatId)?.name}

| СИЛ | ЛОВ | ТЕЛ | ИНТ | МУД | ХАР |
|----:|----:|----:|----:|----:|----:|
| ${c.abilities.str} | ${c.abilities.dex} | ${c.abilities.con} | ${c.abilities.int} | ${c.abilities.wis} | ${c.abilities.cha} |
| ${formatMod(abilityMod(c.abilities.str))} | ${formatMod(abilityMod(c.abilities.dex))} | ${formatMod(abilityMod(c.abilities.con))} | ${formatMod(abilityMod(c.abilities.int))} | ${formatMod(abilityMod(c.abilities.wis))} | ${formatMod(abilityMod(c.abilities.cha))} |

- **ХП** ${c.hpCurrent}/${c.hpMax} · **КД** ${c.ac} · **Скорость** ${c.speed}
- **ОБК** ${c.bloodCurrent}/${getBloodMax(c)} · **Питание** ${getLevelData(c.level).feed}
- **Сл** ${8 + pb + abilityMod(c.abilities.cha)} · **БМ** ${formatMod(pb)}
- **Bane** ${c.preferredBlood || "—"}
- **Удача** Везучий ${getLuckMax(c.level, c.multiclass) - c.luckyUsed}/${getLuckMax(c.level, c.multiclass)} · Защищ. ${getLuckMax(c.level, c.multiclass) - c.protectedUsed}/${getLuckMax(c.level, c.multiclass)}

## Навыки
${skills.join("\n") || "_нет_"}

## Атаки
${c.attacks.map((a) => `- **${a.name}** ${formatMod(a.bonus)} — ${a.damage} ${a.type}`).join("\n") || "_нет_"}

## Черты сородича
${feats.map((f) => f && `### ${f.name}\n${f.body}`).join("\n\n") || "_нет_"}

## Снаряжение
\`\`\`
${c.equipment}
\`\`\`

## Заметки
${c.notes || "—"}

---
*Сгенерировано листом Kindred Ventrue · Bound by Blood + dnd.su*
`;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        const text = md();
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Markdown скопирован");
        } catch {
          const blob = new Blob([text], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${c.name || "kindred"}.md`;
          a.click();
          URL.revokeObjectURL(url);
          toast.message("Скачан .md файл");
        }
      }}
    >
      <FileDown className="size-3.5" /> Markdown
    </Button>
  );
}
