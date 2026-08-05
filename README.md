# Лист Вентру · Bound by Blood

Интерактивный **билдер + лист** для D&D 2024 + Vampire: The Masquerade – Bound by Blood (класс Kindred, клан Ventrue).

**Live:** https://kindred-ventrue-sheet.vercel.app

## Возможности

### Билдер
- Пошаговая сборка: концепт → происхождение → статы → навыки → черты → механики → итог
- Пресеты: социальный лорд, железный тиран, 7+колдун, новая кровь (ур.3)
- Point buy 27 / стандартный массив / 4d6 drop lowest / вручную
- +2/+1 биографии, ASI по уровням, dual luck (Везучий + Защищённый)
- Валидация билда, авто-атаки, прогноз ХП/Сл/ОБК

### Соло-игра
- Авто-кости, преимущество от Зверя/Везучего, помехи от состояний
- Трекер хода, раунд, инициатива, концентрация, HD, death saves
- Нижняя панель (mobile), приём урона, сравнение с КД/Сл
- Быстрые действия Вентру (Приказ, Entrance, Terrify…)

## Стек
TanStack Start, React 19, Vite, Tailwind v4, Zustand (localStorage).

## Источники
- Bound by Blood PDF (Kindred, Ventrue, Touchstone, Protected)
- dnd.su / PHB 2024 (Human, Lucky, point buy)

## Dev
```bash
npm run dev    # 0.0.0.0:8080
npm run build
npm run typecheck
```
