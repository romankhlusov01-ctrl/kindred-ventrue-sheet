import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Download,
  Heart,
  Link2,
  Maximize2,
  Minimize2,
  Plus,
  Share2,
  Sparkles,
  Swords,
  Trash2,
  Undo2,
  Upload,
  Users,
  User,
  Zap,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlayDock } from "@/components/sheet/play-dock";
import { PlayHub } from "@/components/sheet/play-hub";
import { Hotkeys } from "@/components/sheet/hotkeys";
import { AsiHelper } from "@/components/sheet/asi-helper";
import { LevelUpHelper } from "@/components/sheet/level-up-helper";
import { ClearLog } from "@/components/sheet/clear-log";
import { LogSearch } from "@/components/sheet/log-search";
import { VentrueBuilder } from "@/components/sheet/ventrue-builder";
import { InventoryPanel } from "@/components/sheet/inventory-panel";
import { OnboardingBanner } from "@/components/sheet/onboarding";
import { SessionSummary } from "@/components/sheet/session-summary";
import { SessionNote } from "@/components/sheet/session-note";
import { ExportMarkdown } from "@/components/sheet/export-markdown";
import { ExportLog } from "@/components/sheet/export-log";
import { Glossary } from "@/components/sheet/glossary";
import { AbilityEditor } from "@/components/sheet/ability-editor";
import { useSessionStore } from "@/lib/session-store";

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

type Tab = "play" | "builder" | "skills" | "features" | "feats" | "gear" | "log";

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
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const focusMode = useSessionStore((s) => s.focusMode);
  const setFocusMode = useSessionStore((s) => s.setFocusMode);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const undo = useSessionStore((s) => s.undo);
  const undoStack = useSessionStore((s) => s.undoStack);

  const [tab, setTab] = useState<Tab>("play");
  const [tabReady, setTabReady] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem("kindred-tab") as Tab | null;
      if (s && ["play","builder","skills","features","feats","gear","log"].includes(s)) {
        setTab(s);
      }
    } catch { /* */ }
    setTabReady(true);
  }, []);
  useEffect(() => {
    if (!tabReady) return;
    try { localStorage.setItem("kindred-tab", tab); } catch { /* */ }
  }, [tab, tabReady]);
  useEffect(() => {
    try {
      if (localStorage.getItem("kindred-focus") === "1") setFocusMode(true);
    } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [featureQ, setFeatureQ] = useState("");
  const [profOnly, setProfOnly] = useState(false);

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
    { id: "play", label: "Игра", icon: <Swords className="size-3.5" /> },
    { id: "builder", label: "Билдер", icon: <User className="size-3.5" /> },
    { id: "skills", label: "Навыки", icon: <Zap className="size-3.5" /> },
    { id: "features", label: "Силы", icon: <Crown className="size-3.5" /> },
    { id: "feats", label: "Черты", icon: <Sparkles className="size-3.5" /> },
    { id: "gear", label: "Вещи", icon: <BookOpen className="size-3.5" /> },
    { id: "log", label: "Ещё", icon: <Heart className="size-3.5" /> },
  ];

  const hideChrome = tab === "play" && focusMode;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl overflow-x-hidden px-3 sm:px-5",
        hideChrome ? "pb-52 pt-1 sm:pb-28 sm:pt-2" : "pb-52 pt-3 sm:pb-28 sm:pt-5",
      )}
    >
      {!hideChrome && <OnboardingBanner />}
      <header className={cn("mb-3 space-y-3", tab === "play" && "mb-1.5", hideChrome && "mb-1")}>
        {!hideChrome && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:block">
              Bound by Blood · D&D 2024 · dnd.su
            </div>
            <h1 className="font-display truncate text-2xl tracking-wide text-fg sm:text-3xl">
              {character.name || "Сородич"}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              <span className="sm:hidden">
                {CLAN_RU[character.clan] ?? character.clan} {character.level}
                {character.multiclass ? ` / ${character.multiclass}` : ""} · Сл {spellDc}
              </span>
              <span className="hidden sm:inline">
                {character.species} · {CLAN_RU[character.clan] ?? character.clan} · Сородич{" "}
                {character.level}
                {character.multiclass ? ` / ${character.multiclass}` : ""} · БМ {formatMod(pb)} ·
                Сл {spellDc}
              </span>
            </p>
            <p className={cn("mt-0.5 text-xs text-faint", tab === "play" && "hidden sm:block")}>
              {character.background || "—"} · {originFeat?.name ?? "—"} + {bgFeat?.name ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tab === "play" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10"
                onClick={() => {
                  setFocusMode(true);
                  toast.message("Фокус · меньше хрома");
                }}
              >
                <Minimize2 className="size-3.5" />
                <span className="hidden sm:inline">Фокус</span>
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={() => setLibraryOpen((v) => !v)}>
              <Users className="size-3.5" />
              <span className="hidden sm:inline">Персонажи</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={copyShareLink}>
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">Ссылка</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={exportJson}>
              <Download className="size-3.5" />
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={importJson}>
              <Upload className="size-3.5" />
            </Button>
            <span className="hidden sm:contents">
              <ExportMarkdown />
              <ExportLog />
            </span>
          </div>
        </div>
        )}

        {libraryOpen && !hideChrome && (
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

        {hideChrome && (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 truncate text-sm font-medium">
              {character.name || "Сородич"}{" "}
              <span className="text-muted">
                · {character.level}
                {character.multiclass ? `/${character.multiclass}` : ""}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 shrink-0"
              onClick={() => setFocusMode(false)}
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        )}

        {tab !== "play" && (
        <details className="group identity-fields" open>
          <summary className="mb-2 cursor-pointer list-none text-xs text-muted sm:hidden">Имя · клан · уровень ▾</summary>
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
        </details>
        )}
      </header>

      {/* Sticky HUD — tappable HP/OBK */}
      <div className="sticky top-0 z-20 -mx-3 mb-2 border-b border-border bg-bg/95 px-3 py-2 backdrop-blur sm:mx-0 sm:mb-4 sm:rounded-[var(--radius-lg)] sm:border">
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-thin">
            <HudTap
              label="ХП"
              value={`${character.hpCurrent}/${character.hpMax}`}
              onMinus={() => { pushUndo("−1 ХП"); adjustHp(-1); }}
              onPlus={() => { pushUndo("+1 ХП"); adjustHp(1); }}
            />
            <HudStat label="КД" value={String(character.ac)} />
            <HudTap
              label="ОБК"
              value={`${character.bloodCurrent}/${bloodMax}`}
              blood
              onMinus={() => {
                if (character.bloodCurrent < 1) toast.error("Нет ОБК");
                else { pushUndo("−ОБК"); spendBlood(1); }
              }}
              onPlus={() => { pushUndo("+ОБК"); gainBlood(1); }}
            />
            <HudStat label="Зверь" value={`${beastLeft}/${beastMax}`} />
            <HudStat label="Сл" value={String(spellDc)} />
            {character.customResources.filter(r => /голос/i.test(r.name)).map(r => (
              <HudStat key={r.id} label="Голос" value={`${r.current}/${r.max}`} />
            ))}
            <span className="hidden sm:contents">
              <HudStat label="Везуч." value={`${luckyLeft}/${luckMax}`} />
              <HudStat label="Защищ." value={`${protectedLeft}/${luckMax}`} />
            </span>
          </div>
          <button
            type="button"
            disabled={!undoStack.length}
            onClick={() => { if (undo()) toast.message("Отменено"); }}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border",
              undoStack.length ? "border-border bg-surface-2 text-fg" : "border-border/40 text-faint opacity-40",
            )}
            title="Отмена"
          >
            <Undo2 className="size-4" />
          </button>
        </div>
        {lastRoll && (
          <button
            type="button"
            className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-left active:scale-[0.99]"
            onClick={async () => {
              const text = `${lastRoll.label}: ${lastRoll.total} (${lastRoll.detail})`;
              try {
                await navigator.clipboard.writeText(text);
                toast.success("Бросок скопирован");
              } catch {
                toast.message(text);
              }
            }}
          >
            <span className="min-w-0 truncate text-[11px] text-muted">{lastRoll.label}</span>
            <span className="font-display text-xl tabular-nums leading-none text-primary">
              {lastRoll.total}
            </span>
          </button>
        )}
        {character.conditions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {character.conditions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
              >
                {c} ×
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop tabs */}
      <div className="mb-4 hidden max-w-full gap-1 overflow-x-auto overscroll-x-contain scroll-thin rounded-[var(--radius)] border border-border bg-surface p-1 sm:flex">
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

      {tab === "play" && (
        <div className="space-y-3">
          <PlayHub />
          {!hideChrome && (
          <details className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 text-sm">
            <summary className="cursor-pointer font-display text-sm text-muted">
              Характеристики · уровень · ASI
            </summary>
            <div className="mt-3 space-y-3">
              <AbilityEditor />
              <LevelUpHelper />
              <AsiHelper />
            </div>
          </details>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg">Навыки</h2>
              <button
                type="button"
                onClick={() => setProfOnly((v) => !v)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  profOnly
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted",
                )}
              >
                {profOnly ? "Владение" : "Все"}
              </button>
            </div>
            <ul className="space-y-1">
              {SKILLS.filter((sk) => {
                if (!profOnly) return true;
                const p = character.skillProfs[sk.id] ?? "none";
                return p !== "none";
              }).map((sk) => {
                const prof = character.skillProfs[sk.id] ?? "none";
                const bonus = skillBonus(character.abilities[sk.ability], pb, prof);
                return (
                  <li
                    key={sk.id}
                    className="flex min-h-12 items-center gap-2 rounded-[var(--radius)] border border-transparent px-1.5 py-1 hover:border-border hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded border text-xs font-bold",
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
                      className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-[var(--radius)] border border-accent/40 bg-accent/10 px-2 font-display text-base tabular-nums text-accent active:scale-[0.97]"
                      onClick={() => {
                        const mode = conditionMode(
                          character,
                          "check",
                          character.beastActive || character.pendingAdv
                            ? "adv"
                            : character.rollMode ?? "norm",
                        );
                        const r = rollD20(sk.nameRu, bonus, mode);
                        useSessionStore.getState().setLastRoll({
                          label: r.label,
                          total: r.total,
                          detail: r.detail,
                          at: Date.now(),
                        });
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
              className="sticky top-16 z-10 mt-3 h-11 border-border bg-surface shadow-sm"
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
              className="sticky top-16 z-10 mt-3 h-11 border-border bg-surface shadow-sm"
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
                    "min-h-20 w-full rounded-[var(--radius-lg)] border p-4 text-left transition-colors active:scale-[0.99]",
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
                    <p className="mt-1 text-[11px] text-accent">{FEAT_RECS[f.id]!.note}</p>
                  )}
                  <div className="mt-2 text-xs font-medium text-primary">
                    {on ? "Взято — снять" : "Взять"}
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
          <SessionNote />
          <SessionSummary />
          <Glossary />
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Журнал</h2>
              <div className="flex gap-1">
                <ClearLog />
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
            </div>

            {character.sessionLog.length === 0 ? (
              <p className="text-sm text-muted">Пусто — броски и отдых появятся здесь.</p>
            ) : (
              <LogSearch />
            )}

          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm text-muted">
            <h3 className="mb-2 font-display text-base text-fg">Как играть с телефона</h3>
            <ul className="list-disc space-y-2 pl-4">
              <li><strong className="text-fg">Сценарии</strong> (Бой / Социал / Питание / Отдых) — на экране только нужное.</li>
              <li>Нижняя панель подстраивается. <strong className="text-fg">↩</strong> — отмена ХП/ОБК/удач.</li>
              <li><strong className="text-fg">Фокус</strong> прячет шапку. Sticky HUD: −/+ по ХП и ОБК.</li>
              <li>Атаки: большая кнопка; карандаш — правка. Врагов на листе нет.</li>
            </ul>
          </div>
        </div>
      )}

      
      {/* Mobile bottom tabs — thumb zone */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-7 gap-0 px-0.5 py-1">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-[9px] font-medium",
                tab === tb.id ? "bg-primary/15 text-primary" : "text-muted",
              )}
            >
              {tb.icon}
              <span className="max-w-full truncate px-0.5">{tb.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {tab === "play" && (
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
    <div className="min-w-[3.25rem] shrink-0 px-1">
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

function HudTap({
  label,
  value,
  blood,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  blood?: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-[var(--radius)] border border-border/60 bg-surface-2/50 px-0.5 py-0.5">
      <button
        type="button"
        onClick={onMinus}
        className="flex h-9 w-7 items-center justify-center text-sm font-bold text-muted active:text-fg"
      >
        −
      </button>
      <div className="min-w-[2.75rem] text-center">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-faint">{label}</div>
        <div
          className={cn(
            "font-display text-sm tabular-nums leading-none",
            blood ? "text-primary" : "text-fg",
          )}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onPlus}
        className="flex h-9 w-7 items-center justify-center text-sm font-bold text-muted active:text-fg"
      >
        +
      </button>
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
        "min-h-16 w-full rounded-[var(--radius-lg)] border p-4 text-left transition-colors active:scale-[0.99]",
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
