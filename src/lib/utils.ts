import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count: number, sides: number): { rolls: number[]; total: number } {
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
}
