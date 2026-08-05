import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Download,
  Droplets,
  Heart,
  Link2,
  Plus,
  Share2,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Users,
  User,
  Zap,
  Crown,
  Clover,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResourcePool } from "@/components/sheet/resource-pool";
import { DicePanel } from "@/components/sheet/dice-panel";
import { QuickActions } from "@/components/sheet/quick-actions";
import { SoloCombat } from "@/components/sheet/solo-combat";
import { ScenarioBar } from "@/components/sheet/scenario-bar";
import { PlayDock } from "@/components/sheet/play-dock";
import { Hotkeys } from "@/components/sheet/hotkeys";
import { RoundBanner } from "@/components/sheet/round-banner";
import { AsiHelper } from "@/components/sheet/asi-helper";
import { BloodBond } from "@/components/sheet/blood-bond";
import { PcSaves } from "@/components/sheet/pc-saves";





import { TargetCheck } from "@/components/sheet/target-check";
import { DamageIntake } from "@/components/sheet/damage-intake";
import { VentrueBuilder } from "@/components/sheet/ventrue-builder";
import { LevelUpHelper } from "@/components/sheet/level-up-helper";
import { WarlockSnippet } from "@/components/sheet/warlock-snippet";
import { EncounterPanel } from "@/components/sheet/encounter-panel";
import { InventoryPanel } from "@/components/sheet/inventory-panel";
import { RestWizard } from "@/components/sheet/rest-wizard";
import { CombatCard } from "@/components/sheet/combat-card";
import { InspirationToggle } from "@/components/sheet/inspiration-toggle";
import { AbilityEditor } from "@/components/sheet/ability-editor";
import { EnvironmentHazards } from "@/components/sheet/environment-hazards";
import { OnboardingBanner } from "@/components/sheet/onboarding";
import { SessionSummary } from "@/components/sheet/session-summary";
import { ConcentrationHelper } from "@/components/sheet/concentration-helper";
import { AcBuilder } from "@/components/sheet/ac-builder";
import { ExportMarkdown } from "@/components/sheet/export-markdown";
import { ExportLog } from "@/components/sheet/export-log";
import { RecalcHp } from "@/components/sheet/recalc-hp";
import { StartEncounter } from "@/components/sheet/start-encounter";
import { TorporPanel } from "@/components/sheet/torpor-panel";
import { StakeHelper } from "@/components/sheet/stake-helper";
import { Glossary } from "@/components/sheet/glossary";
import { FullHealButton } from "@/components/sheet/full-heal";
import { InitOrder } from "@/components/sheet/init-order";
import { DominateDc } from "@/components/sheet/dominate-dc";
import { SessionNote } from "@/components/sheet/session-note";
import { TempHp } from "@/components/sheet/temp-hp";
import { QuickCondition } from "@/components/sheet/quick-condition";
import { FeedWizard } from "@/components/sheet/feed-wizard";







import {
  featsForLevel,
  getLevelData,
  unlockedCore,
  unlockedVentrue,
  VENTRUE_LORE,
  type FeatureBlock,
} from "@/data/kindred-ru";
import { CLANS, type ClanId } from "@/data/kindred";
import { FEAT_RECS } from "@/data/feat-recommendations";
import {
  BACKGROUNDS_PDF,
  FEAT_LUCKY,
  FEAT_PROTECTED,
  HUMAN_SPECIES,
  ORIGIN_FEATS,
  backgroundById,
  originFeatById,
} from "@/data/origin-ru";
import { CONDITIONS, SKILLS, type ProfLevel, type SkillId } from "@/data/skills";
import {
  PRESET_VENTRUE_7_WARLOCK_1,
  PRESET_VENTRUE_8,
  PRESET_VENTRUE_PLAYER,
} from "@/data/presets";
import {
  decodeSharePayload,
  encodeSharePayload,
  getBloodMax,
  getLuckMax,
  skillBonus,
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { abilityMod, cn, formatMod, rollDie } from "@/lib/utils";
import { effectivePb } from "@/lib/level-utils";
import { rollD20, rollDamage } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";


const ABILITY_KEYS: { key: keyof Abilities; label: string; short: string }[] = [
  { key: "str", label: "Сила", short: "СИЛ" },
  { key: "dex", label: "Ловкость", short: "ЛОВ" },
  { key: "con", label: "Телосложение", short: "ТЕЛ" },
  { key: "int", label: "Интеллект", short: "ИНТ" },
  { key: "wis", label: "Мудрость", short: "МУД" },
  { key: "cha", label: "Харизма", short: "ХАР" },
];

const CLAN_RU: Record<string, string> = {
  ventrue: "Вентру",
  brujah: "Бруха",
  gangrel: "Гангрел",
  lasombra: "Ласомбра",
  nosferatu: "Носферату",
  toreador: "Тореадор",
  none: "—",
};

type Tab = "builder" | "combat" | "skills" | "features" | "feats" | "gear" | "log";

export function CharacterSheet() {
  const character = useCharacterStore((s) => s.character);
  const characters = useCharacterStore((s) => s.characters);
  const activeId = useCharacterStore((s) => s.activeId);
  const setActive = useCharacterStore((s) => s.setActive);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const setField = useCharacterStore((s) => s.setField);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const setSkillProf = useCharacterStore((s) => s.setSkillProf);
  const toggleSave = useCharacterStore((s) => s.toggleSave);
  const toggleCondition = useCharacterStore((s) => s.toggleCondition);
  const toggleFeat = useCharacterStore((s) => s.toggleFeat);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const fillBlood = useCharacterStore((s) => s.fillBlood);
  const useBeast = useCharacterStore((s) => s.useBeast);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const shortRest = useCharacterStore((s) => s.shortRest);
  const longRest = useCharacterStore((s) => s.longRest);
  const addAttack = useCharacterStore((s) => s.addAttack);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const exportLibrary = useCharacterStore((s) => s.exportLibrary);
  const importLibrary = useCharacterStore((s) => s.importLibrary);
  const addResource = useCharacterStore((s) => s.addResource);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const addLog = useCharacterStore((s) => s.addLog);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);

  const [tab, setTab] = useState<Tab>("builder");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [featureQ, setFeatureQ] = useState("");

  const row = getLevelData(character.level);
  const pb = effectivePb(character.level, character.multiclass);
  const bloodMax = getBloodMax(character);
  const luckMax = getLuckMax(character.level, character.multiclass);

  const beastMax = pb;
  const beastLeft = Math.max(0, beastMax - character.beastUsed);
  const luckyLeft = Math.max(0, luckMax - (character.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (character.protectedUsed ?? 0));
  const chaMod = abilityMod(character.abilities.cha);
  const spellDc = 8 + pb + chaMod;
  const passivePer =
    10 + skillBonus(character.abilities.wis, pb, character.skillProfs.perception);
  const passiveIns =
    10 + skillBonus(character.abilities.wis, pb, character.skillProfs.insight);

  const core = useMemo(() => unlockedCore(character.level), [character.level]);
  const ventrue = useMemo(() => unlockedVentrue(character.level), [character.level]);
  const availableFeats = useMemo(() => featsForLevel(character.level), [character.level]);
  const bgDef = backgroundById(character.backgroundId);
  const originFeat = originFeatById(character.originFeatId);
  const bgFeat = originFeatById(character.backgroundFeatId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#c=/, "");
    if (!hash) return;
    const data = decodeSharePayload(hash);
    if (data) {
      loadCharacter(data);
      toast.success("Персонаж загружен по ссылке");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [loadCharacter]);

  useEffect(() => {
    const voice = character.customResources.find((r) => /голос/i.test(r.name));
    if (voice && voice.max !== pb) {
      updateResource(voice.id, { max: pb, current: Math.min(voice.current, pb) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.level, pb]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(exportLibrary(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteka-sorodichey.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Библиотека сохранена");
  }

  function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (Array.isArray(data.characters)) importLibrary(data.characters, data.activeId);
        else loadCharacter(data);
        toast.success("Импорт успешен");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    input.click();
  }

  async function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#c=${encodeSharePayload(character)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      window.prompt("Скопируй ссылку:", url);
    }
  }

  function setBloodTo(index: number) {
    const next = index + 1;
    if (character.bloodCurrent === next) setField("bloodCurrent", Math.max(0, next - 1));
    else setField("bloodCurrent", Math.min(bloodMax, next));
  }

  function applyBackground(id: string) {
    const bg = backgroundById(id);
    if (!bg) return;
    setField("backgroundId", bg.id);
    setField("background", bg.name);
    setField("backgroundFeatId", bg.featId === "magic-initiate" || bg.featId === "well-read" ? "protected" : bg.featId);
    // map skill names roughly
    if (bg.id === "touchstone") {
      setSkillProf("persuasion", "proficient");
      setSkillProf("survival", "proficient");
    }
    toast.success(`Предыстория: ${bg.name}`);
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "builder", label: "Билдер", icon: <User className="size-3.5" /> },
    { id: "combat", label: "Бой", icon: <Swords className="size-3.5" /> },
    { id: "skills", label: "Навыки", icon: <Zap className="size-3.5" /> },
    { id: "features", label: "Способности", icon: <Crown className="size-3.5" /> },
    { id: "feats", label: "Черты", icon: <Sparkles className="size-3.5" /> },
    { id: "gear", label: "Снаряжение", icon: <BookOpen className="size-3.5" /> },
    { id: "log", label: "Сессия", icon: <Heart className="size-3.5" /> },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 pb-36 pt-3 sm:px-5 sm:pb-28 sm:pt-5">

      <OnboardingBanner />
      <header className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Bound by Blood · D&D 2024 · dnd.su · Настраиваемый лист
            </div>
            <h1 className="font-display truncate text-2xl tracking-wide text-fg sm:text-3xl">
              {character.name || "Сородич"}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {character.species} · {CLAN_RU[character.clan] ?? character.clan} · Сородич{" "}
              {character.level}
              {character.multiclass ? ` / ${character.multiclass}` : ""} · БМ {formatMod(pb)} ·
              Сл {spellDc}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              {character.background || "—"} · {originFeat?.name ?? "—"} + {bgFeat?.name ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen((v) => !v)}>
              <Users className="size-3.5" /> Персонажи
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={copyShareLink}>
              <Share2 className="size-3.5" /> Ссылка
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={exportJson}>
              <Download className="size-3.5" />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={importJson}>
              <Upload className="size-3.5" />
            </Button>
            <ExportMarkdown />
            <ExportLog />
          </div>
        </div>

        {libraryOpen && (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="blood"
                onClick={() => {
                  addCharacter({ ...PRESET_VENTRUE_PLAYER, id: `vp-${Date.now()}` });
                  toast.success("Пресет: твой Вентру (Человек + Опора + 2×удача)");
                }}
              >
                + Твой билд
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  addCharacter({ ...PRESET_VENTRUE_7_WARLOCK_1, id: `v7-${Date.now()}` });
                  toast.success("Пресет: 7 / Колдун 1");
                }}
              >
                + 7 / Колдун 1
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  addCharacter({ ...PRESET_VENTRUE_8, id: `v8-${Date.now()}` });
                  toast.success("Пресет: Вентру 8 классика");
                }}
              >
                + Вентру 8
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addCharacter()}>
                <Plus className="size-3.5" /> Пустой
              </Button>
            </div>
            <ul className="space-y-1">
              {characters.map((ch) => (
                <li
                  key={ch.id}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2",
                    ch.id === activeId ? "bg-surface-3" : "hover:bg-surface-2",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-sm"
                    onClick={() => {
                      setActive(ch.id);
                      setLibraryOpen(false);
                    }}
                  >
                    <span className="font-medium text-fg">{ch.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      {CLAN_RU[ch.clan]} · {ch.level} ур.
                    </span>
                  </button>
                  {characters.length > 1 && (
                    <button type="button" onClick={() => deleteCharacter(ch.id)}>
                      <Trash2 className="size-3.5 text-muted hover:text-primary" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Имя">
            <Input value={character.name} onChange={(e) => setField("name", e.target.value)} />
          </Field>
          <Field label="Клан">
            <select
              className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
              value={character.clan}
              onChange={(e) => setField("clan", e.target.value as ClanId)}
            >
              {CLANS.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {CLAN_RU[cl.id] ?? cl.name}
                </option>
              ))}
              <option value="none">—</option>
            </select>
          </Field>
          <Field label="Уровень сородича">
            <Input
              type="number"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) =>
                setField("level", Math.min(20, Math.max(1, Number(e.target.value) || 1)))
              }
            />
          </Field>
          <Field label="Мультикласс">
            <Input
              value={character.multiclass}
              placeholder="Колдун 1"
              onChange={(e) => setField("multiclass", e.target.value)}
            />
          </Field>
        </div>
      </header>

      {/* Sticky HUD */}
      <div className="sticky top-0 z-20 -mx-3 mb-4 border-y border-border bg-bg/95 px-3 py-2 backdrop-blur sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-4">
        <div className="grid grid-cols-4 gap-x-2 gap-y-1 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <HudStat label="ХП" value={`${character.hpCurrent}/${character.hpMax}`} />
          <HudStat label="КД" value={String(character.ac)} />
          <HudStat label="ОБК" value={`${character.bloodCurrent}/${bloodMax}`} blood />
          <HudStat label="Зверь" value={`${beastLeft}/${beastMax}`} />
          <HudStat label="Везуч." value={`${luckyLeft}/${luckMax}`} />
          <HudStat label="Защищ." value={`${protectedLeft}/${luckMax}`} />
          <HudStat
            label="Иниц"
            value={
              character.initiative != null
                ? String(character.initiative)
                : formatMod(abilityMod(character.abilities.dex))
            }
          />
          <HudStat label="Раунд" value={String(character.round ?? 1)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
            <Button type="button" size="sm" variant="secondary" onClick={() => adjustHp(-1)}>
              −ХП
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => adjustHp(1)}>
              +ХП
            </Button>
            <Button type="button" size="sm" variant="blood" onClick={() => spendBlood(1)}>
              −ОБК
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={shortRest}>
              Короткий
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={longRest}>
              Длинный
            </Button>
        </div>
      </div>

      <div className="mb-4 flex max-w-full gap-1 overflow-x-auto overscroll-x-contain scroll-thin rounded-[var(--radius)] border border-border bg-surface p-1">

        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-fg"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "builder" && <VentrueBuilder />}

      {tab === "combat" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <RoundBanner />
            <ScenarioBar />

            <LevelUpHelper />
            <AsiHelper />
            <div className="flex flex-wrap gap-2"><RecalcHp /><FullHealButton /></div>

            <StartEncounter />
            <WarlockSnippet />
            <InspirationToggle />

            <AbilityEditor />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-base">
                    <Heart className="size-4 text-primary" /> Хиты
                  </h3>
                  <div className="flex gap-1">
                    {[-5, -1, 1, 5].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => adjustHp(n)}
                      >
                        {n > 0 ? `+${n}` : n}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Текущие">
                    <Input
                      type="number"
                      value={character.hpCurrent}
                      onChange={(e) => setField("hpCurrent", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Макс">
                    <Input
                      type="number"
                      value={character.hpMax}
                      onChange={(e) => setField("hpMax", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Временные">
                    <Input
                      type="number"
                      value={character.tempHp}
                      onChange={(e) => setField("tempHp", Number(e.target.value) || 0)}
                    />
                  </Field>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, character.hpMax ? (character.hpCurrent / character.hpMax) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Protected: 0 хитов → 1 очко → 1 хит. Сородич: автоуспех death saves.
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-base">
                  <Shield className="size-4 text-accent" /> Защита
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="КД">
                    <Input
                      type="number"
                      value={character.ac}
                      onChange={(e) => setField("ac", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Скорость">
                    <Input
                      type="number"
                      value={character.speed}
                      onChange={(e) => setField("speed", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Сл заклинаний">
                    <Input readOnly value={spellDc} />
                  </Field>
                  <Field label="Вдохновение (Человек)">
                    <button
                      type="button"
                      onClick={() => setField("inspiration", !character.inspiration)}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-[var(--radius)] border text-sm font-medium",
                        character.inspiration
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-border bg-surface-2 text-muted",
                      )}
                    >
                      {character.inspiration ? "Есть" : "Нет"}
                    </button>
                  </Field>
                </div>
                <Field label="Предпочтительная кровь (Bane)">
                  <Input
                    className="mt-2"
                    value={character.preferredBlood}
                    onChange={(e) => setField("preferredBlood", e.target.value)}
                    placeholder="солдаты, аристократы…"
                  />
                </Field>
              </div>
            </div>

            {/* Dual luck actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-accent/40 bg-surface p-4">
                <h3 className="mb-1 flex items-center gap-2 font-display text-base text-accent">
                  <Clover className="size-4" /> Везучий · dnd.su
                </h3>
                <p className="mb-3 text-xs text-muted">
                  Очки = БМ · LR. Преимущество на d20 Test / Помеха на атаку по тебе.
                </p>
                <div className="mb-2 font-display text-2xl tabular-nums">
                  {luckyLeft}
                  <span className="text-sm text-muted"> / {luckMax}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (!spendLucky()) {
                        toast.error("Очки Везучего кончились");
                        return;
                      }
                      setField("pendingAdv", true);
                      addLog("Везучий: преимущество на Тест d20 (−1)");
                      toast.success("Везучий → Преимущество");
                    }}

                  >
                    d20 + Преим.
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (!spendLucky()) {
                        toast.error("Очки Везучего кончились");
                        return;
                      }
                      addLog("Везучий: помеха на атаку по тебе (−1)");
                      toast.success("Везучий → Помеха на атаку");
                    }}
                  >
                    Атака → Помеха
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setField("luckyUsed", Math.max(0, (character.luckyUsed ?? 0) - 1))
                    }
                  >
                    +1
                  </Button>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-primary/40 bg-surface p-4">
                <h3 className="mb-1 flex items-center gap-2 font-display text-base text-primary">
                  <ShieldCheck className="size-4" /> Защищённый · PDF
                </h3>
                <p className="mb-3 text-xs text-muted">
                  Очки = БМ · LR. Переброс d20 при ≤9 · 0 ХП → 1 ХП.
                </p>
                <div className="mb-2 font-display text-2xl tabular-nums">
                  {protectedLeft}
                  <span className="text-sm text-muted"> / {luckMax}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="blood"
                    onClick={() => {
                      if (!spendProtected()) {
                        toast.error("Очки Защищённого кончились");
                        return;
                      }
                      addLog("Защищённый: переброс d20 (было ≤9) (−1)");
                      toast.success("Protected → Переброс");
                    }}
                  >
                    Переброс ≤9
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="blood"
                    onClick={() => {
                      if (!spendProtected()) {
                        toast.error("Очки Защищённого кончились");
                        return;
                      }
                      setField("hpCurrent", Math.max(1, character.hpCurrent || 1));
                      if (character.hpCurrent <= 0) setField("hpCurrent", 1);
                      addLog("Защищённый: 0 ХП → 1 ХП (−1 очко)");
                      toast.success("Protected → 1 хит");
                    }}
                  >
                    0 → 1 ХП
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setField(
                        "protectedUsed",
                        Math.max(0, (character.protectedUsed ?? 0) - 1),
                      )
                    }
                  >
                    +1
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base">Атаки</h3>
                <Button type="button" size="sm" variant="secondary" onClick={addAttack}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {character.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="rounded-[var(--radius)] border border-border bg-surface-2 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Input
                        value={atk.name}
                        onChange={(e) => updateAttack(atk.id, { name: e.target.value })}
                        placeholder="Название"
                      />
                      <Input
                        type="number"
                        value={atk.bonus}
                        onChange={(e) =>
                          updateAttack(atk.id, { bonus: Number(e.target.value) || 0 })
                        }
                        placeholder="Бонус"
                      />
                      <Input
                        value={atk.damage}
                        onChange={(e) => updateAttack(atk.id, { damage: e.target.value })}
                        placeholder="Урон"
                      />
                      <Input
                        value={atk.type}
                        onChange={(e) => updateAttack(atk.id, { type: e.target.value })}
                        placeholder="Тип"
                      />
                    </div>
                    <Input
                      className="mt-2"
                      value={atk.notes}
                      onChange={(e) => updateAttack(atk.id, { notes: e.target.value })}
                      placeholder="Заметки"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="blood"
                        className="flex-1"
                        onClick={() => {
                          const mode =
                            character.beastActive || character.pendingAdv
                              ? character.rollMode === "dis"
                                ? "norm"
                                : "adv"
                              : character.rollMode ?? "norm";
                          const a = rollDie(20);
                          const b = rollDie(20);
                          const used =
                            mode === "adv" ? Math.max(a, b) : mode === "dis" ? Math.min(a, b) : a;
                          const total = used + atk.bonus;
                          const det =
                            mode === "adv"
                              ? `преим. ${a}/${b}`
                              : mode === "dis"
                                ? `помеха ${a}/${b}`
                                : `${a}`;
                          toast.message(`${atk.name}: ${det}${formatMod(atk.bonus)} = ${total}`);
                          addLog(`Атака ${atk.name}: ${total} (${det})`);
                          // damage dice from expression
                          const m = atk.damage.match(/(\d+)d(\d+)([+-]\d+)?/i);
                          if (m) {
                            const count = Number(m[1]);
                            const sides = Number(m[2]);
                            const bonus = m[3] ? Number(m[3]) : 0;
                            let sum = bonus;
                            const rolls: number[] = [];
                            for (let i = 0; i < count; i++) {
                              const r = rollDie(sides);
                              rolls.push(r);
                              sum += r;
                            }
                            if (used === 20) {
                              for (let i = 0; i < count; i++) {
                                const r = rollDie(sides);
                                rolls.push(r);
                                sum += r;
                              }
                            }
                            toast.success(
                              `Урон ${atk.name}: ${sum} ${atk.type}${used === 20 ? " (крит)" : ""}`,
                            );
                            addLog(`Урон ${atk.name}: ${sum} [${rolls.join("+")}]`);
                          }
                        }}
                      >
                        Атака+урон
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAttack(atk.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SoloCombat />

            <TargetCheck />
            <PcSaves />
            <DamageIntake />


            <DicePanel />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <SessionNote />
            <DominateDc />
            <TempHp />
            <QuickCondition />
            <FeedWizard />
            <BloodBond />
            <EncounterPanel />




            <InitOrder />
            <RestWizard />
            <EnvironmentHazards />
            <ConcentrationHelper />
            <AcBuilder />
            <TorporPanel />
            <StakeHelper />
            <CombatCard />

            <ResourcePool
              label="Очки крови"
              current={character.bloodCurrent}
              max={bloodMax}
              color="blood"
              onSpend={() => spendBlood(1)}
              onGain={() => gainBlood(1)}
              onToggle={setBloodTo}
            />
            <Button type="button" variant="blood" className="w-full" onClick={fillBlood}>
              <Droplets className="size-3.5" /> Полный пул
            </Button>

            <ResourcePool
              label={`Зверь (осталось ${beastLeft})`}
              current={beastLeft}
              max={beastMax}
              color="beast"
              onSpend={useBeast}
              onGain={() => setField("beastUsed", Math.max(0, character.beastUsed - 1))}
              onToggle={(i) => {
                const want = beastLeft === i + 1 ? i : i + 1;
                setField("beastUsed", Math.max(0, beastMax - want));
              }}
            />

            <ResourcePool
              label={`Везучий (осталось ${luckyLeft})`}
              current={luckyLeft}
              max={luckMax}
              color="beast"
              onSpend={() => {
                if (!spendLucky()) toast.error("Нет очков");
              }}
              onGain={() => setField("luckyUsed", Math.max(0, (character.luckyUsed ?? 0) - 1))}
              onToggle={(i) => {
                const want = luckyLeft === i + 1 ? i : i + 1;
                setField("luckyUsed", Math.max(0, luckMax - want));
              }}
            />

            <ResourcePool
              label={`Защищённый (осталось ${protectedLeft})`}
              current={protectedLeft}
              max={luckMax}
              color="blood"
              onSpend={() => {
                if (!spendProtected()) toast.error("Нет очков");
              }}
              onGain={() =>
                setField("protectedUsed", Math.max(0, (character.protectedUsed ?? 0) - 1))
              }
              onToggle={(i) => {
                const want = protectedLeft === i + 1 ? i : i + 1;
                setField("protectedUsed", Math.max(0, luckMax - want));
              }}
            />

            <QuickActions />

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm">Ресурсы (настраиваемые)</h3>
                <Button type="button" size="sm" variant="ghost" onClick={addResource}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {character.customResources.map((r) => (
                  <div key={r.id} className="rounded border border-border bg-surface-2 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <Input
                        className="h-8"
                        value={r.name}
                        onChange={(e) => updateResource(r.id, { name: e.target.value })}
                      />
                      <button type="button" onClick={() => removeResource(r.id)}>
                        <Trash2 className="size-3.5 text-muted" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateResource(r.id, { current: Math.max(0, r.current - 1) })
                        }
                      >
                        −
                      </Button>
                      <span className="min-w-12 text-center tabular-nums text-sm">
                        {r.current}/{r.max}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateResource(r.id, {
                            current: Math.min(r.max, r.current + 1),
                          })
                        }
                      >
                        +
                      </Button>
                      <Input
                        type="number"
                        className="h-8 w-16"
                        value={r.max}
                        onChange={(e) =>
                          updateResource(r.id, { max: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={r.note}
                      onChange={(e) => updateResource(r.id, { note: e.target.value })}
                      placeholder="Заметка"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <h3 className="mb-2 font-display text-sm">Состояния</h3>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((c) => {
                  const on = character.conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        on
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === "skills" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <h2 className="mb-3 font-display text-lg">Навыки</h2>
            <ul className="space-y-1">
              {SKILLS.map((sk) => {
                const prof = character.skillProfs[sk.id] ?? "none";
                const bonus = skillBonus(character.abilities[sk.ability], pb, prof);
                return (
                  <li
                    key={sk.id}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1.5 hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded border text-[10px] font-bold",
                        prof === "expertise"
                          ? "border-accent bg-accent/20 text-accent"
                          : prof === "proficient"
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-faint",
                      )}
                      onClick={() => {
                        const order: ProfLevel[] = ["none", "proficient", "expertise"];
                        const idx = order.indexOf(prof);
                        setSkillProf(sk.id, order[(idx + 1) % order.length]!);
                      }}
                    >
                      {prof === "expertise" ? "Э" : prof === "proficient" ? "В" : "—"}
                    </button>
                    <span className="w-8 text-[10px] uppercase text-faint">
                      {ABILITY_KEYS.find((a) => a.key === sk.ability)?.short}
                    </span>
                    <span className="flex-1 text-sm">{sk.nameRu}</span>
                    <button
                      type="button"
                      className="font-display tabular-nums text-accent"
                      onClick={() => {
                        const mode = conditionMode(
                          character,
                          "check",
                          character.beastActive || character.pendingAdv
                            ? "adv"
                            : character.rollMode ?? "norm",
                        );
                        const r = rollD20(sk.nameRu, bonus, mode);
                        toast.message(
                          `${sk.nameRu}: ${r.detail} = ${r.total}`,
                        );
                        addLog(`${sk.nameRu}: ${r.total} (${r.detail})`);
                      }}
                    >
                      {formatMod(bonus)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-center">
                <div className="text-xs text-muted">Пасс. внимательность</div>
                <div className="font-display text-3xl text-accent">{passivePer}</div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-center">
                <div className="text-xs text-muted">Пасс. проницательность</div>
                <div className="font-display text-3xl text-accent">{passiveIns}</div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 space-y-3">
              <h3 className="font-display text-base">Происхождение · настройка</h3>
              <Field label="Вид">
                <Input
                  value={character.species}
                  onChange={(e) => setField("species", e.target.value)}
                />
              </Field>
              <Field label="Предыстория (PDF)">
                <select
                  className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
                  value={character.backgroundId}
                  onChange={(e) => applyBackground(e.target.value)}
                >
                  {BACKGROUNDS_PDF.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              {bgDef && (
                <div className="rounded border border-border bg-surface-2 p-3 text-xs text-muted">
                  <div className="font-medium text-fg">{bgDef.name}</div>
                  <div className="mt-1">Хар-ки: {bgDef.abilityScores}</div>
                  <div>Навыки: {bgDef.skills}</div>
                  <div>Инструмент: {bgDef.tool}</div>
                  <div>Черта: {bgDef.featId}</div>
                  <p className="mt-2 leading-relaxed">{bgDef.description}</p>
                </div>
              )}
              <Field label="Черта происхождения (Человек · Гибкий)">
                <select
                  className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
                  value={character.originFeatId}
                  onChange={(e) => setField("originFeatId", e.target.value)}
                >
                  {ORIGIN_FEATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.nameEn})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Черта биографии">
                <select
                  className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
                  value={character.backgroundFeatId}
                  onChange={(e) => setField("backgroundFeatId", e.target.value)}
                >
                  {ORIGIN_FEATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Человек · Умелый (навык)">
                <select
                  className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
                  value={character.humanSkill || ""}
                  onChange={(e) => {
                    const id = e.target.value as SkillId | "";
                    setField("humanSkill", id);
                    if (id) setSkillProf(id, "proficient");
                  }}
                >
                  <option value="">—</option>
                  {SKILLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameRu}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Мировоззрение">
                <Input
                  value={character.alignment}
                  onChange={(e) => setField("alignment", e.target.value)}
                />
              </Field>
              <Field label="Игрок">
                <Input
                  value={character.player}
                  onChange={(e) => setField("player", e.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-4 text-xs text-muted">
              <div className="mb-1 flex items-center gap-1 font-medium text-fg">
                <Link2 className="size-3.5" /> Источники
              </div>
              PDF Bound by Blood (RAW) ·{" "}
              <a
                className="text-accent underline"
                href="https://next.dnd.su/feats/313-lucky/"
                target="_blank"
                rel="noreferrer"
              >
                Везучий dnd.su
              </a>{" "}
              ·{" "}
              <a
                className="text-accent underline"
                href="https://next.dnd.su/species/human"
                target="_blank"
                rel="noreferrer"
              >
                Человек dnd.su
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === "features" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-4">
            <h2 className="font-display text-lg text-accent">{VENTRUE_LORE.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {VENTRUE_LORE.description} Уровень листа: {character.level} — открыто всё ≤ этого
              уровня. Меняй уровень в шапке, чтобы крутить прогрессию.
            </p>
            <Input
              className="mt-3"
              placeholder="Поиск по способностям…"
              value={featureQ}
              onChange={(e) => setFeatureQ(e.target.value)}
            />
          </div>

          {/* Human + origin feats cards */}
          <section>
            <h3 className="mb-2 font-display text-base">Вид · {HUMAN_SPECIES.name}</h3>
            <div className="grid gap-2 lg:grid-cols-2">
              {HUMAN_SPECIES.traits.map((t) => (
                <div
                  key={t.name}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
                >
                  <div className="font-medium text-fg">{t.name}</div>
                  <p className="mt-1 text-sm text-muted">{t.body}</p>
                  <div className="mt-2 text-[10px] text-faint">{HUMAN_SPECIES.source}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-display text-base">Черты происхождения (активные)</h3>
            <div className="grid gap-2 lg:grid-cols-2">
              {[originFeat, bgFeat].filter(Boolean).map((f) =>
                f ? (
                  <div
                    key={f.id + f.name}
                    className="rounded-[var(--radius-lg)] border border-accent/30 bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-fg">
                        {f.name} <span className="text-muted">[{f.nameEn}]</span>
                      </span>
                      <span className="text-[10px] text-faint">{f.source}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {f.body}
                    </p>
                  </div>
                ) : null,
              )}
              {!originFeat && !bgFeat && (
                <p className="text-sm text-muted">Выбери черты на вкладке Навыки.</p>
              )}
            </div>
            {character.originFeatId === "lucky" &&
              character.backgroundFeatId === "protected" && (
                <p className="mt-2 rounded border border-border bg-surface-2 p-3 text-xs text-muted">
                  <strong className="text-fg">Два пула удачи (RAW):</strong> Везучий (dnd.su) и
                  Защищённый (PDF) — оба дают «очки = БМ / LR», но <em>разные</em> эффекты. Ведём
                  раздельно: {luckyLeft}/{luckMax} Везучий · {protectedLeft}/{luckMax}{" "}
                  Защищённый.
                </p>
              )}
          </section>

          <section>
            <h3 className="mb-2 font-display text-base">Базовый класс · Сородич</h3>
            <div className="grid gap-2 lg:grid-cols-2">
              {core
                .filter(
                  (f) =>
                    !featureQ.trim() ||
                    `${f.name} ${f.summary} ${f.body}`
                      .toLowerCase()
                      .includes(featureQ.toLowerCase()),
                )
                .map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  open={openFeature === f.id}
                  onToggle={() => setOpenFeature(openFeature === f.id ? null : f.id)}
                />
              ))}
            </div>
          </section>

          {(character.clan === "ventrue" || character.clan === "none") && (
            <section>
              <h3 className="mb-2 font-display text-base">Клан Вентру · прогрессия</h3>
              <div className="grid gap-2 lg:grid-cols-2">
                {ventrue
                  .filter(
                    (f) =>
                      !featureQ.trim() ||
                      `${f.name} ${f.summary} ${f.body}`
                        .toLowerCase()
                        .includes(featureQ.toLowerCase()),
                  )
                  .map((f) => (
                  <FeatureCard
                    key={f.id}
                    feature={f}
                    open={openFeature === f.id}
                    onToggle={() => setOpenFeature(openFeature === f.id ? null : f.id)}
                    accent
                  />
                ))}
              </div>
              {character.level < 18 && (
                <p className="mt-2 text-xs text-muted">
                  Ещё не открыто:{" "}
                  {unlockedVentrue(20)
                    .filter((f) => f.level > character.level)
                    .map((f) => `ур.${f.level} ${f.name}`)
                    .join(" · ")}
                </p>
              )}
            </section>
          )}

          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Ур.</th>
                  <th className="px-3 py-2">БМ</th>
                  <th className="px-3 py-2">Фичи</th>
                  <th className="px-3 py-2">ОБК</th>
                  <th className="px-3 py-2">Питание</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, i) => getLevelData(i + 1)).map((r) => (
                  <tr
                    key={r.level}
                    className={cn(
                      "border-t border-border",
                      r.level === character.level && "bg-primary/15",
                      r.level < character.level && "text-muted",
                    )}
                  >
                    <td className="px-3 py-1.5 font-medium">{r.level}</td>
                    <td className="px-3 py-1.5">+{r.pb}</td>
                    <td className="px-3 py-1.5 text-xs">{r.features}</td>
                    <td className="px-3 py-1.5">{r.bp}</td>
                    <td className="px-3 py-1.5">{r.feed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "feats" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <h2 className="font-display text-lg">Черты сородича + происхождение</h2>
            <p className="mt-1 text-sm text-muted">
              Слоты Kindred Feat: 2, 7, 10, 13, 17 — <strong>отдельно</strong> от ASI (4/8/12/16/19).
              ASI не заменяет черту сородича (RAW PDF). Origin: {FEAT_LUCKY.name} +{" "}
              {FEAT_PROTECTED.name}.
            </p>
            <Input
              className="mt-3"
              placeholder="Поиск черты…"
              value={featureQ}
              onChange={(e) => setFeatureQ(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {character.selectedFeats.map((id) => {
                const f = availableFeats.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-full border border-primary bg-primary/20 px-3 py-1 text-xs"
                  >
                    {f?.name ?? id}
                  </span>
                );
              })}
              <span className="rounded-full border border-accent bg-accent/15 px-3 py-1 text-xs">
                {originFeat?.name ?? "—"} (вид)
              </span>
              <span className="rounded-full border border-accent bg-accent/15 px-3 py-1 text-xs">
                {bgFeat?.name ?? "—"} (био)
              </span>
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {availableFeats
              .filter(
                (f) =>
                  !featureQ.trim() ||
                  `${f.name} ${f.body} ${f.prereq}`
                    .toLowerCase()
                    .includes(featureQ.toLowerCase()),
              )
              .map((f) => {
              const on = character.selectedFeats.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFeat(f.id)}
                  className={cn(
                    "rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
                    on
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-fg">{f.name}</span>
                    <span className="text-[10px] text-faint">{f.prereq}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  {FEAT_RECS[f.id] && (
                    <p className="mt-1 text-[11px] text-accent">★ {FEAT_RECS[f.id]!.note}</p>
                  )}
                  <div className="mt-2 text-xs font-medium text-primary">
                    {on ? "✓ Взято — нажми, чтобы снять" : "Нажми, чтобы отметить"}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Label>Свободные заметки по чертам / ASI</Label>
            <Textarea
              className="mt-1 min-h-28"
              value={character.feats}
              onChange={(e) => setField("feats", e.target.value)}
              placeholder="Ур.4: +2 Хар… Ур.8: …"
            />
          </div>
        </div>
      )}

      {tab === "gear" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InventoryPanel />
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Label>Заметки / Bonds / цели сессии</Label>
            <Textarea
              className="mt-1 min-h-48"
              value={character.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>
        </div>
      )}

      {tab === "log" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SessionSummary />
          <Glossary />
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Журнал</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const t = prompt("Заметка:");
                  if (t) addLog(t);
                }}
              >
                <Plus className="size-3.5" /> Запись
              </Button>
            </div>
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto scroll-thin">
              {character.sessionLog.length === 0 && (
                <li className="text-sm text-muted">Пусто — броски и отдых появятся здесь.</li>
              )}
              {character.sessionLog.map((e) => (
                <li
                  key={e.id}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                  <div className="text-[10px] text-faint">
                    {new Date(e.at).toLocaleTimeString("ru-RU")}
                  </div>
                  <div>{e.text}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm text-muted">
            <h3 className="mb-2 font-display text-base text-fg">Подсказки сессии</h3>
            <ul className="list-disc space-y-2 pl-4">
              <li>Нижняя панель: ХП, ОБК, иниц, ход, зверь, питание, атака — одним пальцем.</li>
              <li>Тап по модификатору СИЛ/ЛОВ… = проверка; по «Спас» = спасбросок.</li>
              <li>Состояния (Отравленный, Голод…) дают помеху автоматически.</li>
              <li>Везучий и Защищённый — два пула = БМ.</li>
              <li>Долгий отдых с ≥1 ОБК: хиты, вдохновение, оба пула удачи.</li>
              <li>Bane Вентру: не «солдаты» → half Feed Dice.</li>
            </ul>
          </div>
        </div>
      )}

      {(tab === "combat" || tab === "skills") && (
        <>
          <PlayDock />
          <Hotkeys />
        </>
      )}


    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function HudStat({
  label,
  value,
  blood,
}: {
  label: string;
  value: string;
  blood?: boolean;
}) {
  return (
    <div className="min-w-[3.25rem]">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-faint">{label}</div>
      <div
        className={cn(
          "font-display text-sm tabular-nums sm:text-base",
          blood ? "text-primary" : "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  open,
  onToggle,
  accent,
}: {
  feature: FeatureBlock;
  open: boolean;
  onToggle: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
        accent ? "border-primary/40 bg-surface" : "border-border bg-surface",
        open && "ring-1 ring-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">
            Ур. {feature.level}
          </div>
          <div className="font-medium text-fg">{feature.name}</div>
        </div>
        {feature.costs && (
          <span className="shrink-0 rounded bg-surface-3 px-2 py-0.5 text-[10px] text-muted">
            {feature.costs.join(" · ")}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{feature.summary}</p>
      {open && (
        <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm leading-relaxed text-fg/90">
          {feature.body}
        </p>
      )}
    </button>
  );
}
