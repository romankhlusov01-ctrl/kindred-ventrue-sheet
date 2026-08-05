# Лист Вентру · Bound by Blood (D&D 2024)

Интерактивный русский лист персонажа Kindred / **Ventrue** для  
*Vampire: The Masquerade – Bound by Blood* (D&D 2024).

## Запуск локально

```bash
npm install
npm run dev
```

Открой `http://localhost:8080`.

## Деплой на Vercel

### Вариант A — одна кнопка

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/romankhlusov01-ctrl/kindred-ventrue-sheet)

### Вариант B — CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Сборка: `npm run build` (Nitro preset `vercel`).

## Что внутри

- Полная прогрессия Kindred 1–20 + клан Вентру
- Очки крови, Зверь, Питание, быстрые действия
- Черты, навыки, атаки, отдых, ссылка на персонажа
- Сохранение в браузере (localStorage)

Стек: React 19, TanStack Start, Tailwind v4, Zustand.
