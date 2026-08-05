import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { rollD20 } from "@/lib/roll-engine";
import { useSessionStore } from "@/lib/session-store";

type Action = {
  name: string;
  cost: string;
  needLevel?: number;
  needClan?: string;
  run: () => void;
};

export function QuickActions() {
  const c = useCharacterStore((s) => s.character);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const setField = useCharacterStore((s) => s.setField);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const addLog = useCharacterStore((s) => s.addLog);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const patch = useCharacterStore((s) => s.patch);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const row = getLevelData(c.level);
  const pb = row.pb;
  const cha = abilityMod(c.abilities.cha);
  const str = abilityMod(c.abilities.str);
  const dc = 8 + pb + cha;
  const auraDc = 8 + str + pb;

  function spendRes(nameRe: RegExp, label: string) {
    const res = c.customResources.find((r) => nameRe.test(r.name));
    if (res) {
      if (res.current <= 0) {
        toast.error(`${label} исчерпан`);
        return false;
      }
      updateResource(res.id, { current: res.current - 1 });
      return true;
    }
    return true;
  }

  function payBp(n: number) {
    if (c.bloodCurrent < n) {
      toast.error(`Нужно ${n} очк. крови`);
      return false;
    }
    spendBlood(n);
    return true;
  }

  function rollSkill(name: string, ability: "cha" | "str" | "wis", skillBonusExtra = 0) {
    const mod = abilityMod(c.abilities[ability]) + pb + skillBonusExtra;
    const r = rollD20(name, mod, c.beastActive || c.pendingAdv ? "adv" : c.rollMode);
    addLog(`${r.label}: ${r.detail} = ${r.total}`);
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    toast.message(`${name}: ${r.total}`);
    return r;
  }

  const actions: Action[] = [
    {
      name: "Зверь (преимущество)",
      cost: "1 исп.",
      run: () => {
        if (!activateBeast()) {
          toast.error("Использования Зверя кончились");
          return;
        }
        addLog("Зверь — преимущество на d20");
        toast.success("Зверь активен · преим. на броски");
      },
    },
    {
      name: "Исцеление ран",
      cost: "1 ОБК · БД",
      run: () => {
        if (!payBp(1)) return;
        const heal = rollDie(10) + c.level;
        adjustHp(heal);
        addLog(`Исцеление ран: +${heal}`);
        toast.success(`+${heal} хитов`);
      },
    },
    {
      name: "Голод утолён",
      cost: "1 ОБК",
      run: () => {
        if (!payBp(1)) return;
        setField("hunger", false);
        patch({
          conditions: c.conditions.filter((x) => x !== "Голод"),
        });
        addLog("Голод подавлен (−1 ОБК)");
        toast.message("Голод снят");
      },
    },
    {
      name: "Приказ (Command)",
      cost: "Голос",
      needLevel: 3,
      needClan: "ventrue",
      run: () => {
        if (!spendRes(/голос/i, "Голос власти")) return;
        patch({ actionUsed: true });
        addLog(`Приказ · Сл ${dc}`);
        toast.success(`Приказ · Сл ${dc}`);
      },
    },
    {
      name: "Внушение (Suggestion)",
      cost: "Голос",
      needLevel: 3,
      needClan: "ventrue",
      run: () => {
        if (!spendRes(/голос/i, "Голос власти")) return;
        patch({ actionUsed: true, concentrating: c.concentrating || "Внушение" });
        addLog(`Внушение · Сл ${dc}`);
        toast.success(`Внушение · Сл ${dc}`);
      },
    },
    {
      name: "Восхищение (Awe)",
      cost: "Присутствие · БД",
      needLevel: 2,
      run: () => {
        if (!spendRes(/присутств|forceful|awe/i, "Властное присутствие")) return;
        patch({ bonusUsed: true });
        addLog("Awe — преим. на Запугивание/Выступление/Убеждение 10 мин");
        toast.message("Awe 10 мин");
      },
    },
    {
      name: "Устрашение (Daunt)",
      cost: "Присутствие · БД",
      needLevel: 2,
      run: () => {
        if (!spendRes(/присутств|forceful|awe/i, "Властное присутствие")) return;
        patch({ bonusUsed: true });
        const r = rollSkill("Daunt · Запугивание", "cha");
        addLog(`Daunt: цель спас Муд. Сл ${r.total} или Испуг 1 мин`);
        toast.success(`Сл спаса = ${r.total}`);
      },
    },
    {
      name: "Звериная ярость",
      cost: "Зверь",
      needLevel: 5,
      run: () => {
        if (!activateBeast()) {
          toast.error("Нет использований Зверя");
          return;
        }
        addLog("Звериная ярость — кости урона ×2, выбрать любой");
        toast.message("Ярость: брось урон дважды");
      },
    },
    {
      name: "Питание (БД)",
      cost: "—",
      needLevel: 5,
      run: () => {
        patch({ bonusUsed: true });
        addLog("Улучшенное питание — бонусное действие");
        toast.message("Питание как БД — кнопка в Костях");
      },
    },
    {
      name: "Непоколебимый разум",
      cost: "свободно",
      needLevel: 6,
      needClan: "ventrue",
      run: () => {
        addLog("Reroll проваленного спас. vs Очарование/Испуг/Оглушение");
        toast.message("Можно перебросить спас");
      },
    },
    {
      name: "Замешательство",
      cost: "1 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(1)) return;
        patch({ actionUsed: true, concentrating: "Гипнотический узор" });
        addLog(`Гипнотический узор · Сл ${dc}`);
        toast.success(`Hypnotic Pattern · Сл ${dc}`);
      },
    },
    {
      name: "Вход (Entrance)",
      cost: "2 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        patch({ actionUsed: true });
        const r = rollSkill("Entrance · Убеждение", "cha");
        addLog(`Entrance: Сл спаса Муд = ${r.total} или Оглушение`);
        toast.success(`Сл = ${r.total}`);
      },
    },
    {
      name: "Очаровать чудовище",
      cost: "1 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(1)) return;
        patch({ actionUsed: true, concentrating: "Очаровать чудовище" });
        addLog(`Charm Monster · Сл ${dc}`);
        toast.success(`Charm Monster · Сл ${dc}`);
      },
    },
    {
      name: "Устрашить (Terrify)",
      cost: "1 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(1)) return;
        patch({ actionUsed: true });
        const r = rollSkill("Terrify · Запугивание", "cha");
        addLog(`Terrify: Сл = ${r.total} или Испуг 1 мин`);
        toast.success(`Сл = ${r.total}`);
      },
    },
    {
      name: "Массовое внушение",
      cost: c.level >= 20 ? "6 ОБК" : c.level >= 18 ? "5 ОБК" : c.level >= 15 ? "4 ОБК" : "3 ОБК",
      needLevel: 11,
      needClan: "ventrue",
      run: () => {
        const cost = c.level >= 20 ? 6 : c.level >= 18 ? 5 : c.level >= 15 ? 4 : 3;
        if (!payBp(cost)) return;
        patch({ actionUsed: true, concentrating: "Массовое внушение" });
        addLog(`Mass Suggestion (−${cost} ОБК) · Сл ${dc}`);
        toast.success(`Mass Suggestion · Сл ${dc}`);
      },
    },
    {
      name: "Глоток выносливости",
      cost: "2 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        patch({ reactionUsed: true });
        const thp = 2 * c.level;
        addLog(`Draught of Endurance: ${thp} врем. хитов`);
        toast.success(`+${thp} врем. хитов`);
      },
    },
    {
      name: "Плоть мрамора (½)",
      cost: "2 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        patch({ reactionUsed: true });
        addLog("Flesh of Marble — урон /2");
        toast.message("Урон /2");
      },
    },
    {
      name: "Плоть мрамора (0)",
      cost: "4 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(4)) return;
        patch({ reactionUsed: true });
        addLog("Flesh of Marble — урон 0");
        toast.message("Урон 0");
      },
    },
    {
      name: "Внушительная аура",
      cost: "пассивно",
      needLevel: 18,
      needClan: "ventrue",
      run: () => {
        addLog(`Imposing Aura · Сл ${auraDc}`);
        toast.message(`Аура Сл ${auraDc}`);
      },
    },
    {
      name: "Призыв (Summon)",
      cost: "3 ОБК",
      needLevel: 18,
      needClan: "ventrue",
      run: () => {
        if (!payBp(3)) return;
        patch({ actionUsed: true });
        addLog(`Summon · Сл ${dc}`);
        toast.success(`Призыв · Сл ${dc}`);
      },
    },
  ];

  const visible = actions.filter(
    (a) =>
      (!a.needLevel || c.level >= a.needLevel) &&
      (!a.needClan || c.clan === a.needClan),
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-base">Быстрые действия</h3>
        <span className="text-xs text-muted">Сл {dc}</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        Вентру · Хар {formatMod(cha)} · БМ {formatMod(pb)}
        {c.level >= 18 ? ` · Аура ${auraDc}` : ""}
      </p>
      <div className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto scroll-thin">
        {visible.map((a) => (
          <Button
            key={a.name}
            type="button"
            variant="secondary"
            className="h-auto min-h-11 justify-between py-2 text-left"
            onClick={a.run}
          >
            <span className="text-sm">{a.name}</span>
            <span className="shrink-0 text-[10px] text-muted">{a.cost}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
