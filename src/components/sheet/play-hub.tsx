import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clover,
  Heart,
  Pencil,
  ShieldCheck,
  Sparkles,
  Swords,
  Undo2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DicePanel } from "@/components/sheet/dice-panel";
import { QuickActions } from "@/components/sheet/quick-actions";
import { SoloCombat } from "@/components/sheet/solo-combat";
import { DamageIntake } from "@/components/sheet/damage-intake";
import { RestWizard } from "@/components/sheet/rest-wizard";
import { ConcentrationHelper } from "@/components/sheet/concentration-helper";
import { EnvironmentHazards } from "@/components/sheet/environment-hazards";
import { TorporPanel } from "@/components/sheet/torpor-panel";
import { StakeHelper } from "@/components/sheet/stake-helper";
import { WarlockSnippet } from "@/components/sheet/warlock-snippet";
import { FeedWizard } from "@/components/sheet/feed-wizard";
import { DominateDc } from "@/components/sheet/dominate-dc";
import { PcSaves } from "@/components/sheet/pc-saves";
import { TempHp } from "@/components/sheet/temp-hp";
import { QuickCondition } from "@/components/sheet/quick-condition";
import { Passives } from "@/components/sheet/passives";
import { FreeRoll } from "@/components/sheet/free-roll";
import { MyEffects } from "@/components/sheet/my-effects";
import { QuickSkills } from "@/components/sheet/quick-skills";
import { PrimaryPowers } from "@/components/sheet/primary-powers";
import { RollHistory } from "@/components/sheet/roll-history";
import { CombatCard } from "@/components/sheet/combat-card";
import { FullHealButton } from "@/components/sheet/full-heal";
import { RecalcHp } from "@/components/sheet/recalc-hp";
import { RollModeBar } from "@/components/sheet/roll-mode-bar";
import { BloodPips } from "@/components/sheet/blood-pips";
import { DeathPanel } from "@/components/sheet/death-panel";
import { AbilityStrip } from "@/components/sheet/ability-strip";
import { SelfReminders } from "@/components/sheet/self-reminders";
import { AutoInit } from "@/components/sheet/auto-init";
import { InspirationToggle } from "@/components/sheet/inspiration-toggle";
import { SessionNote } from "@/components/sheet/session-note";
import {
  getBloodMax,
  getLuckMax,
  useCharacterStore,
} from "@/lib/character-store";
import { effectivePb } from "@/lib/level-utils";
import { abilityMod, cn, formatMod } from "@/lib/utils";
import { rollD20, rollDamage } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";
import { getLevelData } from "@/data/kindred-ru";

type Scenario = "combat" | "social" | "feed" | "rest";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "combat", label: "Бой" },
  { id: "social", label: "Социал" },
  { id: "feed", label: "Питание" },
  { id: "rest", label: "Отдых" },
];

/**
 * Mobile-first play surface — only YOU.
 * Scenario chips filter tools so the phone never shows everything at once.
 */
export function PlayHub() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const addLog = useCharacterStore((s) => s.addLog);
  const addAttack = useCharacterStore((s) => s.addAttack);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const addResource = useCharacterStore((s) => s.addResource);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const tickEffects = useSessionStore((s) => s.tickEffects);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const undo = useSessionStore((s) => s.undo);
  const undoStack = useSessionStore((s) => s.undoStack);
  const focusMode = useSessionStore((s) => s.focusMode);

  const [editAtk, setEditAtk] = useState(false);

  const scenario = (c.scenario ?? "combat") as Scenario;
  const pb = effectivePb(c.level, c.multiclass);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const luckyLeft = Math.max(0, luckMax - (c.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (c.protectedUsed ?? 0));
  const beastLeft = Math.max(0, pb - c.beastUsed);
  const cha = abilityMod(c.abilities.cha);
  const spellDc = 8 + pb + cha;
  const hpPct = c.hpMax ? Math.min(100, (c.hpCurrent / c.hpMax) * 100) : 0;
  const atZero = c.hpCurrent <= 0;

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

  function rollAttack(id: string) {
    const atk = c.attacks.find((a) => a.id === id);
    if (!atk) return;
    const m = modeFor("attack");
    const r = rollD20(atk.name, atk.bonus, m);
    consumeRollMode();
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${r.label}: ${r.total} (${r.detail})`);
    const dmg = rollDamage(atk.damage);
    let total = dmg.total;
    if (r.crit) {
      total += rollDamage(atk.damage).total;
    }
    setLastRoll({
      label: `Урон · ${atk.name}`,
      total,
      detail: dmg.detail + (r.crit ? " · крит" : ""),
      at: Date.now(),
    });
    addLog(`Урон ${atk.name}: ${total}`);
    toast.success(`${atk.name}: ${r.total} → ${total} ${atk.type}`);
  }

  const showCombat = scenario === "combat";
  const showSocial = scenario === "social";
  const showFeed = scenario === "feed";
  const showRest = scenario === "rest";

  return (
    <div className="mx-auto max-w-lg space-y-2.5 sm:max-w-3xl sm:space-y-3 lg:max-w-none">
      {/* Scenario chips — sticky under HUD */}
      <div className="sticky top-[4.5rem] z-10 grid grid-cols-4 gap-1 rounded-[var(--radius-lg)] border border-border bg-surface/95 p-1 shadow-sm backdrop-blur sm:static sm:shadow-none">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setField("scenario", s.id)}
            className={cn(
              "flex h-11 items-center justify-center rounded-[var(--radius)] text-xs font-semibold active:scale-[0.97]",
              scenario === s.id
                ? "bg-primary text-primary-fg"
                : "text-muted hover:bg-surface-2",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Status hero — compact */}
      <section
        className={cn(
          "rounded-[var(--radius-lg)] border p-3",
          atZero ? "border-primary bg-primary/10" : "border-border bg-surface",
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-base leading-tight text-fg">
              {c.name || "Сородич"}
            </div>
            <div className="text-[11px] text-muted">
              ур.{c.level}
              {c.multiclass ? ` / ${c.multiclass}` : ""} · Сл{" "}
              <span className="font-display text-sm text-primary">{spellDc}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={!undoStack.length}
            onClick={() => {
              const ok = undo();
              if (ok) toast.message("Отменено");
              else toast.error("Нечего отменять");
            }}
            className={cn(
              "flex h-10 items-center gap-1 rounded-[var(--radius)] border px-2.5 text-xs",
              undoStack.length
                ? "border-border bg-surface-2 text-fg"
                : "border-border/50 text-faint opacity-50",
            )}
          >
            <Undo2 className="size-3.5" />
            Отмена
          </button>
        </div>

        {focusMode && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm text-muted">ХП</span>
            <span className="font-display text-lg tabular-nums">
              {c.hpCurrent}/{c.hpMax}
              {c.tempHp > 0 && <span className="ml-1 text-accent">+{c.tempHp}</span>}
            </span>
          </div>
        )}
        {!focusMode && (
        <>
        {/* HP */}
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="size-3.5 text-primary" />
              ХП
            </span>
            <span className="font-display text-lg tabular-nums">
              {c.hpCurrent}
              <span className="text-sm text-muted">/{c.hpMax}</span>
              {c.tempHp > 0 && (
                <span className="ml-1 text-sm text-accent">+{c.tempHp}</span>
              )}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[-5, -1, 1, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  pushUndo(`ХП ${n > 0 ? "+" : ""}${n}`);
                  adjustHp(n);
                }}
                className="flex h-12 items-center justify-center rounded-[var(--radius)] border border-border bg-surface-2 text-sm font-semibold active:scale-[0.97]"
              >
                {n > 0 ? `+${n}` : n}
              </button>
            ))}
          </div>
        </div>

        </>
        )}

        {/* Resources row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <ResChip
            label="ОБК"
            value={`${c.bloodCurrent}/${bloodMax}`}
            danger
            onMinus={() => {
              if (c.bloodCurrent < 1) toast.error("Нет ОБК");
              else {
                pushUndo("−ОБК");
                spendBlood(1);
              }
            }}
            onPlus={() => {
              pushUndo("+ОБК");
              gainBlood(1);
            }}
          />
          <ResChip
            label="Зверь"
            value={`${beastLeft}/${pb}${c.beastActive ? "★" : ""}`}
            accent
            onMinus={() => {
              pushUndo("Зверь");
              if (!activateBeast()) toast.error("Зверь исчерпан");
              else toast.success("Преимущество");
            }}
            onPlus={() => {
              pushUndo("Восст. Зверь");
              setField("beastUsed", Math.max(0, c.beastUsed - 1));
            }}
          />
          <ResChip
            label="КД"
            value={String(c.ac)}
            onMinus={() => setField("ac", Math.max(1, c.ac - 1))}
            onPlus={() => setField("ac", c.ac + 1)}
          />
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-xs">
          <MiniStat label="Скор." value={c.speed} />
          <MiniStat
            label="Иниц"
            value={c.initiative != null ? c.initiative : formatMod(abilityMod(c.abilities.dex))}
          />
          <MiniStat label="Везуч." value={`${luckyLeft}/${luckMax}`} />
          <MiniStat label="Защищ." value={`${protectedLeft}/${luckMax}`} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              const on = !c.inspiration;
              setField("inspiration", on);
              if (on) toast.message("+вдохновение");
              else {
                setField("pendingAdv", true);
                toast.message("Вдохновение → преим.");
              }
            }}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-medium",
              c.inspiration
                ? "border-accent bg-accent/20 text-accent"
                : "border-border bg-surface-2 text-muted",
            )}
          >
            Вдохн.
          </button>
          <button
            type="button"
            onClick={() => {
              useCharacterStore.getState().toggleCondition("Голод");
              toast.message(c.conditions.includes("Голод") ? "Голод снят" : "Голод");
            }}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-medium",
              c.hunger || c.conditions.includes("Голод")
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-surface-2 text-muted",
            )}
          >
            Голод
          </button>
          {c.beastActive && (
            <span className="rounded-full border border-beast/40 bg-beast/15 px-3 py-2 text-xs text-beast">
              Зверь★
            </span>
          )}
          {c.concentrating && (
            <span className="max-w-[10rem] truncate rounded-full border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
              Конц: {c.concentrating}
            </span>
          )}
        </div>
      </section>

      <DeathPanel />
      <SelfReminders />
      <RollModeBar />
      {(c.pendingAdv || c.pendingDis) && (
        <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/10 px-3 py-2 text-center text-xs text-accent">
          Следующий d20: {c.pendingAdv ? "преимущество" : ""}
          {c.pendingAdv && c.pendingDis ? " · " : ""}
          {c.pendingDis ? "помеха" : ""}
        </div>
      )}
      {(showCombat || showSocial) && <AbilityStrip />}

      {/* Turn economy — combat + social */}
      {(showCombat || showSocial) && (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm">Ход · R{c.round ?? 1}</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-10"
              onClick={() => {
                newTurn();
                tickEffects();
                toast.message(`Раунд ${(c.round ?? 1) + 1}`);
              }}
            >
              Новый ход
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
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
                  "flex h-12 flex-col items-center justify-center rounded-[var(--radius)] border text-xs font-medium",
                  c[key]
                    ? "border-primary/40 bg-primary/15 text-primary line-through opacity-70"
                    : "border-border bg-surface-2 text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Dual luck */}
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5">
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-accent">
            <Clover className="size-3.5" /> Везучий {luckyLeft}/{luckMax}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-11 w-full text-xs"
              onClick={() => {
                pushUndo("Везучий");
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingAdv", true);
                toast.success("Преим. на d20");
              }}
            >
              d20 +преим.
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 w-full text-xs"
              onClick={() => {
                pushUndo("Везучий помеха");
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingDis", true);
                toast.success("Помеха на атаку по вам");
              }}
            >
              Атака → помеха
            </Button>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5">
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Защищ. {protectedLeft}/{luckMax}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="blood"
              className="h-11 w-full text-xs"
              onClick={() => {
                pushUndo("Protected");
                if (!spendProtected()) return toast.error("Нет очков");
                toast.success("Переброс ≤9");
                addLog("Protected: переброс");
              }}
            >
              Переброс ≤9
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 w-full text-xs"
              onClick={() => {
                pushUndo("Protected 0→1");
                if (!spendProtected()) return toast.error("Нет очков");
                setField("hpCurrent", 1);
                toast.success("1 хит");
              }}
            >
              0 → 1 ХП
            </Button>
          </div>
        </div>
      </section>

      <RollHistory />

      {showCombat && (
        <>
          <AutoInit />
          <div className="grid gap-2.5 lg:grid-cols-2">
          <PrimaryPowers />
          <PcSaves />
          </div>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display text-sm">
                <Swords className="size-3.5 text-primary" /> Атаки
              </h3>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={editAtk ? "secondary" : "ghost"}
                  className="h-9"
                  onClick={() => setEditAtk((v) => !v)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-9" onClick={addAttack}>
                  +
                </Button>
              </div>
            </div>
            {c.attacks.length === 0 && (
              <p className="text-xs text-muted">Добавьте атаку (билдер или +).</p>
            )}
            <div className="space-y-2">
              {c.attacks.map((atk) => (
                <div
                  key={atk.id}
                  className="rounded-[var(--radius)] border border-border bg-surface-2 p-2"
                >
                  {editAtk ? (
                    <>
                      <div className="mb-2 flex items-center gap-2">
                        <Input
                          className="h-11 flex-1"
                          value={atk.name}
                          onChange={(e) => updateAttack(atk.id, { name: e.target.value })}
                        />
                        <button
                          type="button"
                          className="text-muted"
                          onClick={() => removeAttack(atk.id)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="mb-2 grid grid-cols-3 gap-1.5">
                        <Input
                          type="number"
                          className="h-11"
                          value={atk.bonus}
                          onChange={(e) =>
                            updateAttack(atk.id, { bonus: Number(e.target.value) || 0 })
                          }
                        />
                        <Input
                          className="h-11"
                          value={atk.damage}
                          onChange={(e) => updateAttack(atk.id, { damage: e.target.value })}
                        />
                        <Input
                          className="h-11"
                          value={atk.type}
                          onChange={(e) => updateAttack(atk.id, { type: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mb-1.5 flex items-baseline justify-between px-0.5">
                      <span className="text-sm font-medium">{atk.name || "Атака"}</span>
                      <span className="text-[11px] tabular-nums text-muted">
                        {atk.bonus >= 0 ? `+${atk.bonus}` : atk.bonus} · {atk.damage}{" "}
                        {atk.type}
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="blood"
                    className="h-14 w-full text-base"
                    onClick={() => rollAttack(atk.id)}
                  >
                    {atk.name || "Атака"}{" "}
                    <span className="ml-1 tabular-nums opacity-80">
                      {atk.bonus >= 0 ? `+${atk.bonus}` : atk.bonus}
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <MyEffects />
          <Passives />

          <Collapsible title="Силы Kindred" icon={<Zap className="size-3.5 text-beast" />}>
            <QuickActions />
            <WarlockSnippet />
          </Collapsible>

          <Collapsible title="Урон · состояния · кости">
            <DamageIntake />
            <TempHp />
            <QuickCondition />
            <DicePanel />
            <FreeRoll />
          </Collapsible>

          <Collapsible title="HD · детали 0 ХП">
            <SoloCombat />
          </Collapsible>
        </>
      )}

      {showSocial && (
        <>
          <SessionNote />
          <InspirationToggle />
          <div className="grid gap-2.5 lg:grid-cols-2">
          <QuickSkills />
          <DominateDc />
          </div>
          <PrimaryPowers />
          <MyEffects />
          <Passives />
          <Collapsible title="Кости и проверки" icon={<Sparkles className="size-3.5" />}>
            <DicePanel />
            <FreeRoll />
            <PcSaves />
          </Collapsible>
        </>
      )}

      {showFeed && (
        <>
          <BloodPips />
          <FeedWizard />
          <PrimaryPowers />
          <Collapsible title="Голод · состояния">
            <QuickCondition />
            <Passives />
          </Collapsible>
        </>
      )}

      {showRest && (
        <>
          <RestWizard />
          <BloodPips />
          <MyEffects />
          <Collapsible title="HD · лечение" defaultOpen>
            <SoloCombat />
            <div className="flex flex-wrap gap-2">
              <RecalcHp />
              <FullHealButton />
            </div>
          </Collapsible>
          <Collapsible title="Редко (торпор, кол, солнце…)">
            <ConcentrationHelper />
            <EnvironmentHazards />
            <TorporPanel />
            <StakeHelper />
          </Collapsible>
        </>
      )}

      <Collapsible title="Свои ресурсы · карточка">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Ресурсы</span>
            <Button type="button" size="sm" variant="ghost" onClick={addResource}>
              +
            </Button>
          </div>
          {c.customResources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded border border-border bg-surface-2 p-2"
            >
              <Input
                className="h-10 flex-1"
                value={r.name}
                onChange={(e) => updateResource(r.id, { name: e.target.value })}
              />
              <button
                type="button"
                className="h-10 w-10 rounded border border-border text-lg"
                onClick={() => {
                  pushUndo(`−${r.name}`);
                  updateResource(r.id, { current: Math.max(0, r.current - 1) });
                }}
              >
                −
              </button>
              <span className="w-12 text-center tabular-nums text-sm">
                {r.current}/{r.max}
              </span>
              <button
                type="button"
                className="h-10 w-10 rounded border border-border text-lg"
                onClick={() => {
                  pushUndo(`+${r.name}`);
                  updateResource(r.id, {
                    current: Math.min(r.max, r.current + 1),
                  });
                }}
              >
                +
              </button>
              <button type="button" onClick={() => removeResource(r.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <CombatCard />
      </Collapsible>

      <p className="pb-1 text-center text-[10px] text-faint">
        Сценарий фильтрует инструменты. БМ {formatMod(pb)} · Питание{" "}
        {getLevelData(c.level).feed}
      </p>
    </div>
  );
}

function ResChip({
  label,
  value,
  onMinus,
  onPlus,
  accent,
  danger,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border p-2",
        accent
          ? "border-beast/30 bg-beast/10"
          : danger
            ? "border-primary/25 bg-primary/5"
            : "border-border bg-surface-2",
      )}
    >
      <div className="mb-0.5 text-[10px] text-muted">{label}</div>
      <div className="mb-1 font-display text-lg tabular-nums leading-none">{value}</div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-10 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          −
        </button>
        <button
          type="button"
          onClick={onPlus}
          className="flex h-10 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 px-1 py-1.5">
      <div className="text-[9px] uppercase text-muted">{label}</div>
      <div className="font-display text-sm tabular-nums">{value}</div>
    </div>
  );
}

function Collapsible({
  title,
  children,
  defaultOpen = false,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 font-display text-sm">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted" />
        ) : (
          <ChevronDown className="size-4 text-muted" />
        )}
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">{children}</div>}
    </div>
  );
}
