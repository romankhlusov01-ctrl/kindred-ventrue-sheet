import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCharacterStore } from "@/lib/character-store";

export function LogSearch() {
  const log = useCharacterStore((s) => s.character.sessionLog);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return log;
    const s = q.toLowerCase();
    return log.filter((e) => e.text.toLowerCase().includes(s));
  }, [log, q]);

  return (
    <div className="mb-2 h-11">
      <Input
        className="h-8"
        placeholder="Фильтр журнала…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q.trim() && (
        <p className="mt-1 text-[10px] text-muted">
          {filtered.length} из {log.length}
        </p>
      )}
      <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto scroll-thin">
        {filtered.map((e) => (
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
        {filtered.length === 0 && (
          <li className="text-sm text-muted">Ничего не найдено.</li>
        )}
      </ul>
    </div>
  );
}
