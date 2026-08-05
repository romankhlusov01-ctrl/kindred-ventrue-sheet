import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLevelData } from "@/data/kindred-ru";
import { useCharacterStore } from "@/lib/character-store";
import { abilityMod, formatMod } from "@/lib/utils";

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
  const useBeast = useCharacterStore((s) => s.useBeast);
  const setField = useCharacterStore((s) => s.setField);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const addLog = useCharacterStore((s) => s.addLog);
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

  const actions: Action[] = [
    {
      name: "Зверь (преимущество)",
      cost: "1 исп.",
      run: () => {
        if (c.beastUsed >= pb) {
          toast.error("Использования Зверя кончились");
          return;
        }
        useBeast();
        addLog("Зверь — преимущество на d20 до начала след. хода");
        toast.message("Зверь активен");
      },
    },
    {
      name: "Исцеление ран",
      cost: "1 ОБК · БД",
      run: () => {
        if (!payBp(1)) return;
        const heal = Math.floor(Math.random() * 10) + 1 + c.level;
        setField("hpCurrent", Math.min(c.hpMax + 50, c.hpCurrent + heal));
        addLog(`Исцеление ран: +${heal} хитов`);
        toast.success(`+${heal} хитов`);
      },
    },
    {
      name: "Голод утолён",
      cost: "1 ОБК",
      run: () => {
        if (!payBp(1)) return;
        setField("hunger", false);
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
        addLog(`Приказ · Сл ${dc}`);
        toast.success(`Приказ · Сл спас. ${dc}`);
      },
    },
    {
      name: "Внушение (Suggestion)",
      cost: "Голос",
      needLevel: 3,
      needClan: "ventrue",
      run: () => {
        if (!spendRes(/голос/i, "Голос власти")) return;
        addLog(`Внушение · Сл ${dc}`);
        toast.success(`Внушение · Сл спас. ${dc}`);
      },
    },
    {
      name: "Восхищение (Awe)",
      cost: "Присутствие",
      needLevel: 2,
      run: () => {
        if (!spendRes(/присутств|forceful|awe/i, "Властное присутствие")) return;
        addLog("Awe — преимущество на Запугивание/Выступление/Убеждение 10 мин");
        toast.message("Awe 10 мин");
      },
    },
    {
      name: "Устрашение (Daunt)",
      cost: "Присутствие",
      needLevel: 2,
      run: () => {
        if (!spendRes(/присутств|forceful|awe/i, "Властное присутствие")) return;
        addLog("Daunt — проверка Запугивания → Испуг");
        toast.message("Daunt: брось Запугивание");
      },
    },
    {
      name: "Звериная ярость",
      cost: "Зверь",
      needLevel: 5,
      run: () => {
        if (c.beastUsed >= pb) {
          toast.error("Нет использований Зверя");
          return;
        }
        useBeast();
        addLog("Звериная ярость — кости урона ×2, выбрать любой");
        toast.message("Ярость на удар");
      },
    },
    {
      name: "Питание (БД)",
      cost: "—",
      needLevel: 5,
      run: () => {
        addLog("Улучшенное питание — бонусное действие");
        toast.message("Питание как БД (если цель подходит)");
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
        addLog(`Гипнотический узор · Сл ${dc}`);
        toast.success("Hypnotic Pattern");
      },
    },
    {
      name: "Вход (Entrance)",
      cost: "2 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        addLog("Entrance: проверка Убеждения → Оглушение");
        toast.message("Брось Убеждение = Сл спаса");
      },
    },
    {
      name: "Очаровать чудовище",
      cost: "1 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(1)) return;
        addLog(`Charm Monster · Сл ${dc}`);
        toast.success("Charm Monster");
      },
    },
    {
      name: "Устрашить (Terrify)",
      cost: "1 ОБК",
      needLevel: 9,
      needClan: "ventrue",
      run: () => {
        if (!payBp(1)) return;
        addLog("Terrify: проверка Запугивания → Испуг 1 мин");
        toast.message("Брось Запугивание = Сл спаса");
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
        addLog(`Mass Suggestion (−${cost} ОБК) · Сл ${dc}`);
        toast.success(`Mass Suggestion (−${cost} ОБК)`);
      },
    },
    {
      name: "Глоток выносливости",
      cost: "2 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        const thp = 2 * c.level;
        addLog(`Draught of Endurance: ${thp} врем. хитов союзнику`);
        toast.success(`+${thp} врем. хитов пьющему vitae`);
      },
    },
    {
      name: "Плоть мрамора (½)",
      cost: "2 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(2)) return;
        addLog("Flesh of Marble — урон /2 (не Огонь/Луч)");
        toast.message("Урон уменьшен вдвое");
      },
    },
    {
      name: "Плоть мрамора (0)",
      cost: "4 ОБК · Реакция",
      needLevel: 15,
      needClan: "ventrue",
      run: () => {
        if (!payBp(4)) return;
        addLog("Flesh of Marble — урон 0");
        toast.message("Урон обнулён");
      },
    },
    {
      name: "Внушительная аура",
      cost: "пассивно",
      needLevel: 18,
      needClan: "ventrue",
      run: () => {
        addLog(`Imposing Aura · Сл ${auraDc} (8+Сил+БМ)`);
        toast.message(`Аура: Сл ${auraDc}`);
      },
    },
    {
      name: "Призыв (Summon)",
      cost: "3 ОБК",
      needLevel: 18,
      needClan: "ventrue",
      run: () => {
        if (!payBp(3)) return;
        addLog(`Summon · Сл ${dc}`);
        toast.success("Призыв — цель обязана идти к вам");
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
            className="h-auto justify-between py-2 text-left"
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
