import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "kindred-onboarding-v1";

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
          <h2 className="font-display text-base text-accent">Как пользоваться</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
            <li>
              <strong className="text-fg">Билдер</strong> — пресет или шаги → «Применить билд»
            </li>
            <li>
              <strong className="text-fg">Бой</strong> — нижняя панель: иниц, атака, питание, зверь
            </li>
            <li>
              Добавь <strong className="text-fg">врагов</strong> справа → vs КД / урон с последнего
              броска
            </li>
            <li>
              <strong className="text-fg">Способности</strong> — поиск по RAW-описаниям
            </li>
            <li>
              Карточка для стола — копируй в Long Story / чат
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
