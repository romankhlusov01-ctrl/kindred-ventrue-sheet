import { useMemo, useState } from "react";
import {
  Clover,
  Dices,
  Droplets,
  Heart,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Undo2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, abilityMod, formatMod } from "@/lib/utils";
import {
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { effectivePb } from "@/lib/level-utils";
import { useSessionStore } from "@/lib/session-store";
import { SKILLS, type SkillId } from "@/data/skills";
import { getLevelData } from "@/data/kindred-ru";
import { RollModeBar } from "@/components/sheet/roll-mode-bar";
import { BloodPips } from "@/components/sheet/blood-pips";
import { DominateDc } from "@/components/sheet/dominate-dc";
import { DeathPanel } from "@/components/sheet/death-panel";
import { RestWizard } from "@/components/sheet/rest-wizard";
import { WarlockSnippet } from "@/components/sheet/warlock-snippet";
import { RollHistory } from "@/components/sheet/roll-history";
import {
  tableAttack,
  tableCheckAbility,
  tableCheckSkill,
  tableD20Plain,
  tableFeed,
  tableHealBlood,
  tableInitiative,
  tableSave,
} from "@/lib/table-roll";

/**
 * Режим «Играть» — стол без перегруза.
 * Все броски → lastRoll + журнал. Сценарии фильтруют вторичное.
 */
type PlayTab = "checks" | "fight" | "kindred" | "more";

const ABIL: { key: keyof Abilities; short: string }[] = [
  { key: "str", short: "СИЛ" },
  { key: "dex", short: "ЛОВ" },
  { key: "con", short: "ТЕЛ" },
  { key: "int", short: "ИНТ" },
  { key: "wis", short: "МУД" },
  { key: "cha", short: "ХАР" },
];

const CORE_SKILLS: SkillId[] = [
  "persuasion",
  "intimidation",
  "deception",
  "insight",
  "perception",
  "athletics",
  "stealth",
  "arcana",
];

export function TableSheet() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const undo = useSessionStore((s) => s.undo);
  const undoStack = useSessionStore((s) => s.undoStack);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const addLog = useCharacterStore((s) => s.addLog);

  const [tab, setTab] = useState<PlayTab>("checks");
  const [allSkills, setAllSkills] = useState(false);

  const pb = effectivePb(c.level, c.multiclass);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const luckyLeft = Math.max(0, luckMax - (c.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (c.protectedUsed ?? 0));
  const beastLeft = Math.max(0, pb - c.beastUsed);
  const spellDc = 8 + pb + abilityMod(c.abilities.cha);
  const atZero = c.hpCurrent <= 0;
  const hpPct = c.hpMax ? Math.min(100, (c.hpCurrent / c.hpMax) * 100) : 0;

  const skillList = useMemo(() => {
    if (allSkills) return SKILLS;
    const prof = SKILLS.filter((s) => (c.skillProfs[s.id] ?? "none") !== "none");
    const core = CORE_SKILLS.map((id) => SKILLS.find((s) => s.id === id)!).filter(Boolean);
    const map = new Map<string, (typeof SKILLS)[0]>();
    for (const s of [...prof, ...core]) map.set(s.id, s);
    return Array.from(map.values());
  }, [allSkills, c.skillProfs]);

  return (
    <div className="mx-auto max-w-lg space-y-3 pb-2 sm:max-w-none">
      {/* Last roll hero — sticky for table glance */}
      <section
        className={cn(
          "rounded-[var(--radius-lg)] border p-3",
          lastRoll ? "border-primary/40 bg-primary/10" : "border-border bg-surface",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Последний бросок · в журнал
            </div>
            {lastRoll ? (
              <>
                <div className="truncate text-sm text-fg">{lastRoll.label}</div>
                <div className="truncate text-[11px] text-faint">{lastRoll.detail}</div>
              </>
            ) : (
              <div className="text-sm text-muted">Тап по проверке / атаке / спасу</div>
            )}
          </div>
          <div className="font-display text-4xl tabular-nums leading-none text-primary">
            {lastRoll?.total ?? "—"}
          </div>
        </div>
      </section>

      <RollModeBar />

      {/* Status + economy */}
      <section
        className={cn(
          "rounded-[var(--radius-lg)] border p-3",
          atZero ? "border-primary bg-primary/10" : "border-border bg-surface",
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg text-fg truncate">{c.name || "Сородич"}</div>
            <div className="text-xs text-muted">
              {c.species} · Вентру {c.level}
              {c.multiclass ? ` / ${c.multiclass}` : ""} · Сл{" "}
              <span className="font-display text-primary">{spellDc}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={!undoStack.length}
            onClick={() => {
              if (!undo()) toast.message("Нечего отменять");
              else toast.message("Отменено");
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border disabled:opacity-40"
            title="Отмена"
          >
            <Undo2 className="size-4" />
          </button>
        </div>

        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-medium">
            <Heart className="size-3.5 text-primary" /> ХП
          </span>
          <span className="font-display tabular-nums">
            {c.hpCurrent}
            <span className="text-muted">/{c.hpMax}</span>
            {c.tempHp > 0 && <span className="ml-1 text-accent">+{c.tempHp}</span>}
          </span>
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-bg">
          <div className="h-full bg-primary transition-all" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[-5, -1, 1, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                pushUndo(n > 0 ? `+${n} ХП` : `${n} ХП`);
                adjustHp(n);
              }}
              className="flex h-11 items-center justify-center rounded-[var(--radius)] border border-border bg-surface-2 text-sm font-semibold active:scale-[0.97]"
            >
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
          <StatChip
            icon={<Droplets className="size-3 text-primary" />}
            label="ОБК"
            value={`${c.bloodCurrent}/${bloodMax}`}
            onMinus={() => {
              if (c.bloodCurrent < 1) return toast.error("Нет ОБК");
              pushUndo("−ОБК");
              spendBlood(1);
            }}
            onPlus={() => {
              pushUndo("+ОБК");
              gainBlood(1);
            }}
          />
          <StatChip
            icon={<Sparkles className="size-3 text-beast" />}
            label="Зверь"
            value={`${beastLeft}/${pb}${c.beastActive ? "★" : ""}`}
            onMinus={() => {
              if (!activateBeast()) toast.error("Зверь исчерпан");
              else toast.success("Преим. d20");
            }}
            onPlus={() => setField("beastUsed", Math.max(0, c.beastUsed - 1))}
          />
          <StatChip
            icon={<Shield className="size-3 text-accent" />}
            label="КД"
            value={String(c.ac)}
            onMinus={() => setField("ac", Math.max(1, c.ac - 1))}
            onPlus={() => setField("ac", c.ac + 1)}
          />
          <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-2">
            <div className="text-[10px] text-muted">Ход R{c.round ?? 1}</div>
            <Button
              type="button"
              size="sm"
              variant={
                c.actionUsed || c.bonusUsed || c.reactionUsed ? "blood" : "secondary"
              }
              className="mt-1 h-9 w-full text-[11px]"
              onClick={() => {
                newTurn();
                tickEffects();
                toast.message(`Раунд ${(c.round ?? 1) + 1}`);
              }}
            >
              Новый
            </Button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1">
          {(
            [
              ["actionUsed", "Действ."],
              ["bonusUsed", "БД"],
              ["reactionUsed", "Реакц."],
              ["movementUsed", "Перем."],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setField(key, !c[key])}
              className={cn(
                "flex h-10 items-center justify-center rounded border text-[10px] font-medium",
                c[key]
                  ? "border-primary/40 bg-primary/10 text-primary line-through opacity-70"
                  : "border-border bg-surface-2",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {atZero && (
          <div className="mt-3">
            <DeathPanel />
          </div>
        )}
      </section>

      {/* Dual luck compact */}
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5">
          <div className="mb-1 flex items-center gap-1 text-xs text-accent">
            <Clover className="size-3.5" /> Везучий {luckyLeft}/{luckMax}
          </div>
          <div className="grid grid-cols-1 gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-10 text-xs"
              onClick={() => {
                pushUndo("Везучий");
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingAdv", true);
                addLog("Везучий: преимущество на d20");
                toast.success("Преим. на d20");
              }}
            >
              d20 +преим.
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 text-xs"
              onClick={() => {
                pushUndo("Везучий");
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingDis", true);
                addLog("Везучий: помеха на атаку по вам");
                toast.success("Помеха на атаку по вам");
              }}
            >
              Атака → помеха
            </Button>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5">
          <div className="mb-1 flex items-center gap-1 text-xs text-primary">
            <ShieldCheck className="size-3.5" /> Защищ. {protectedLeft}/{luckMax}
          </div>
          <div className="grid grid-cols-1 gap-1">
            <Button
              type="button"
              size="sm"
              variant="blood"
              className="h-10 text-xs"
              onClick={() => {
                pushUndo("Protected");
                if (!spendProtected()) return toast.error("Нет очков");
                addLog("Защищённый: переброс d20≤9");
                toast.success("Переброс ≤9 (dnd.su/PDF)");
              }}
            >
              Переброс ≤9
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 text-xs"
              onClick={() => {
                pushUndo("Protected 0→1");
                if (!spendProtected()) return toast.error("Нет очков");
                setField("hpCurrent", 1);
                addLog("Защищённый: 0→1 ХП");
                toast.success("1 хит");
              }}
            >
              0 → 1 ХП
            </Button>
          </div>
        </div>
      </section>

      {/* Sub-tabs: only 4 — not overload */}
      <div className="grid grid-cols-4 gap-1 rounded-[var(--radius)] border border-border bg-surface p-1">
        {(
          [
            ["checks", "Проверки", Dices],
            ["fight", "Бой", Swords],
            ["kindred", "Kindred", Droplets],
            ["more", "Ещё", Zap],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium",
              tab === id ? "bg-primary text-primary-fg" : "text-muted",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "checks" && (
        <div className="space-y-3">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm">Проверки · тап = бросок</h3>
              <button
                type="button"
                className="text-xs text-accent"
                onClick={() => setAllSkills((v) => !v)}
              >
                {allSkills ? "Кратко" : "Все навыки"}
              </button>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {ABIL.map(({ key, short }) => {
                const mod = abilityMod(c.abilities[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => tableCheckAbility(key, short)}
                    className="flex h-14 flex-col items-center justify-center rounded-[var(--radius)] border border-border bg-surface-2 active:scale-[0.97]"
                  >
                    <span className="text-[10px] text-muted">{short}</span>
                    <span className="font-display text-lg tabular-nums text-accent">
                      {formatMod(mod)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {skillList.map((sk) => {
                const prof = c.skillProfs[sk.id] ?? "none";
                const bonus = skillBonus(c.abilities[sk.ability], pb, prof);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => tableCheckSkill(sk.id)}
                    className={cn(
                      "flex h-12 items-center justify-between gap-2 rounded-[var(--radius)] border px-3 text-left active:scale-[0.98]",
                      prof !== "none"
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-surface-2",
                    )}
                  >
                    <span className="min-w-0 truncate text-xs">{sk.nameRu}</span>
                    <span className="font-display text-sm tabular-nums text-accent">
                      {formatMod(bonus)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <h3 className="mb-2 font-display text-sm">Спасброски</h3>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {ABIL.map(({ key, short }) => {
                const prof = !!c.saveProfs[key];
                const bonus = abilityMod(c.abilities[key]) + (prof ? pb : 0);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => tableSave(key, short)}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center rounded-[var(--radius)] border active:scale-[0.97]",
                      prof ? "border-primary/40 bg-primary/10" : "border-border bg-surface-2",
                    )}
                  >
                    <span className="text-[10px] font-semibold">{short}</span>
                    <span className="font-display text-sm tabular-nums">{formatMod(bonus)}</span>
                    {c.clan === "ventrue" && key === "wis" && (
                      <span className="text-[9px] text-accent">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" className="h-12" onClick={() => tableInitiative()}>
              Инициатива
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => tableD20Plain("d20")}>
              Чистый d20
            </Button>
          </div>
          <RollHistory />
        </div>
      )}

      {tab === "fight" && (
        <div className="space-y-3">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <h3 className="mb-2 flex items-center gap-1.5 font-display text-sm">
              <Swords className="size-3.5 text-primary" /> Атаки
            </h3>
            {c.attacks.length === 0 && (
              <p className="text-xs text-muted">Добавьте атаки в билдере или на вкладке Вещи.</p>
            )}
            <div className="space-y-2">
              {c.attacks.map((atk) => (
                <Button
                  key={atk.id}
                  type="button"
                  variant="blood"
                  className="h-14 w-full justify-between px-3"
                  onClick={() => tableAttack(atk.id)}
                >
                  <span className="truncate">{atk.name || "Атака"}</span>
                  <span className="tabular-nums opacity-90">
                    {formatMod(atk.bonus)} · {atk.damage}
                  </span>
                </Button>
              ))}
            </div>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={() => {
                if (!activateBeast()) toast.error("Зверь исчерпан");
                else toast.success("Зверь · преим.");
              }}
            >
              Зверь ({beastLeft})
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => tableInitiative()}>
              Иниц
            </Button>
          </div>
        </div>
      )}

      {tab === "kindred" && (
        <div className="space-y-3">
          <BloodPips />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="blood" className="h-12" onClick={() => tableFeed(false)}>
              Питание {getLevelData(c.level).feed}
            </Button>
            <Button type="button" variant="secondary" className="h-12" onClick={() => tableFeed(true)}>
              ½ Bane
            </Button>
            <Button type="button" variant="blood" className="h-12" onClick={() => tableHealBlood()}>
              Лечение (−1 ОБК)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => {
                pushUndo("Голод");
                useCharacterStore.getState().toggleCondition("Голод");
              }}
            >
              Голод
            </Button>
          </div>
          <DominateDc />
          {/колдун|warlock/i.test(c.multiclass || "") && <WarlockSnippet />}
          <p className="text-center text-[10px] text-faint">
            Bane: {c.preferredBlood || "—"} · BBB PDF · dnd.su Lucky/Human · PHB 2024
          </p>
        </div>
      )}

      {tab === "more" && (
        <div className="space-y-3">
          <RestWizard />
          <DeathPanel />
          <RollHistory />
          <p className="text-xs text-muted">
            Справка по способностям и чертам — режим «Создать» или вкладка Силы в шапке.
            Все броски пишутся в журнал (Ещё → Журнал).
          </p>
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  onMinus,
  onPlus,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-1.5">
      <div className="mb-0.5 flex items-center justify-center gap-0.5 text-[9px] text-muted">
        {icon}
        {label}
      </div>
      <div className="font-display text-sm tabular-nums leading-none">{value}</div>
      <div className="mt-1 flex gap-0.5">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-8 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          −
        </button>
        <button
          type="button"
          onClick={onPlus}
          className="flex h-8 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
