import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCssVarValue(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
