import type { Language } from "./types";
import { countLines } from "./writing";

export const PRAISES = ["참 잘했어요!", "멋져요!", "대단해요!", "최고예요!", "훌륭해요!"];

export const ENGLISH_PRAISES = ["Great job!", "Wonderful!", "Awesome!", "Well done!", "Excellent!"];

export function praiseFor(index: number, language: Language = "ko"): string {
  const praises = language === "en" ? ENGLISH_PRAISES : PRAISES;
  return praises[index % praises.length];
}

export function progressOf(texts: string[]): { done: number; total: number } {
  return { done: texts.filter((text) => countLines(text) > 0).length, total: texts.length };
}
