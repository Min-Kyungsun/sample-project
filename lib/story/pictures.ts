import { LEVELS } from "./levels";
import { FIVE_W_KEYS, type FiveW, type FiveWKey, type Language, type Level } from "./types";

// 이야기의 기준이 되는 낱말을 고르는 순서. 누가가 있으면 항상 누가가 기준이다.
const SUBJECT_PRIORITY: FiveWKey[] = ["who", "what", "where", "when", "how", "why"];

// 장면마다 맡는 육하원칙의 역할: 배경 → 일어난 일 → 이유.
const SCENE_GROUPS: FiveWKey[][] = [["when", "where"], ["what", "how"], ["why"]];

// 육하원칙으로 정해진 장면이 끝난 뒤, 마지막 장에 붙이는 마무리 느낌의 낱말.
const ENDING: Record<Language, string> = { ko: "행복", en: "happy" };

function value(input: FiveW, key: FiveWKey): string {
  return input[key]?.trim() ?? "";
}

function values(input: FiveW, keys: FiveWKey[]): string[] {
  return keys.map((key) => value(input, key)).filter(Boolean);
}

function subjectKey(input: FiveW): FiveWKey | undefined {
  return SUBJECT_PRIORITY.find((key) => value(input, key));
}

export function subjectOf(input: FiveW): string | undefined {
  const key = subjectKey(input);
  return key && value(input, key);
}

export function filledFields(input: FiveW): number {
  return values(input, [...FIVE_W_KEYS]).length;
}

// 기준 낱말을 뺀 채 입력한 육하원칙을 장면 묶음(배경, 일어난 일, 이유)으로 나눈다.
export function sceneGroups(input: FiveW): string[][] {
  const key = subjectKey(input);
  return SCENE_GROUPS.map((group) => values(input, group.filter((k) => k !== key))).filter(
    (group) => group.length > 0
  );
}

// 장면별 검색어. 모든 검색어가 같은 기준 낱말(누가)로 시작해 이야기가 이어지고,
// 뒤에 붙는 말이 장면마다 달라서 같은 그림이 되풀이되지 않는다.
// 초급은 입력한 칸이 적으면 그림 1개, 아니면 2개다.
export function pictureQueries(
  input: FiveW,
  level: Level = "beginner",
  language: Language = "ko"
): string[] {
  const filled = filledFields(input);
  if (filled === 0) return [];

  const subject = subjectOf(input)!;
  const groups = sceneGroups(input);
  const count = level === "beginner" ? (filled <= 2 ? 1 : 2) : LEVELS[level].pictures;

  return Array.from({ length: count }, (_, i) => {
    let words: string[] = [];
    if (i < groups.length) {
      // 그림 수가 장면 묶음보다 적으면 마지막 그림이 남은 묶음을 모두 맡는다.
      words = i === count - 1 ? groups.slice(i).flat() : groups[i];
    } else if (i > 0 && i === count - 1) {
      words = [ENDING[language]];
    }
    return [subject, ...words].join(" ");
  });
}
