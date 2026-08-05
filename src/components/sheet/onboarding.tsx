import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "kindred-onboarding-v2";

export function OnboardingBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-accent/40 bg-accent/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base text-accent">Соло-лист Вентру</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
            <li>
              <strong className="text-fg">Билдер</strong> — пресет / шаги → «Применить билд»
            </li>
            <li>
              <strong className="text-fg">Бой</strong> — нижняя панель: иниц, атака, питание, Зверь,
              Lucky / Protected
            </li>
            <li>
              <strong className="text-fg">Старт боя</strong> — патруль / охота / сородич + шаблоны
              врагов; «Атака вас» бьёт по КД
            </li>
            <li>
              <strong className="text-fg">Сл Доминирования</strong> — справа; спас NPC одной кнопкой
            </li>
            <li>
              <strong className="text-fg">Сценарий</strong> — бой / соц / питание / отдых с подсказками
            </li>
          </ol>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setOpen(false);
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
