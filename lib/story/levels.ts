import type { Language, Level } from "./types";

// pictures는 그림 개수의 상한이다. 초급은 입력한 칸 수에 따라 1~2개가 나온다.
export const LEVELS: Record<Level, { label: string; pictures: number; maxLines: number }> = {
  beginner: { label: "초급", pictures: 2, maxLines: 2 },
  intermediate: { label: "중급", pictures: 3, maxLines: 3 },
  advanced: { label: "고급", pictures: 5, maxLines: 5 },
};

export const LANGUAGES: Record<Language, string> = {
  ko: "한글",
  en: "English",
};

export const LEVEL_KEYS = Object.keys(LEVELS) as Level[];
export const LANGUAGE_KEYS = Object.keys(LANGUAGES) as Language[];
