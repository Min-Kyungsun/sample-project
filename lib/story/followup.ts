import { pictureQueries, subjectOf } from "./pictures";
import type { FiveW, Language, Level } from "./types";

// 한글 조사. 한 글자 조사는 떼고 남는 말이 두 글자 이상일 때만 뗀다("아이"의 "이"를 떼지 않기 위해서다).
const JOSA = [
  "에서는", "에게서", "으로", "에서", "에게", "한테", "까지", "부터", "처럼", "보다", "랑",
  "와", "과", "을", "를", "은", "는", "이", "가", "의", "도", "에", "로", "만",
];
const KO_STOP = new Set([
  "나", "나는", "나도", "나의", "내가", "저", "저는", "제가", "우리", "우리는", "우리가",
  "너", "그", "그리고", "그래서", "그런데", "같이", "함께", "정말", "너무", "아주", "매우",
  "오늘", "것", "수", "때", "다시", "또",
]);
const EN_STOP = new Set([
  "the", "and", "but", "for", "with", "was", "were", "are", "is", "his", "her", "its", "our",
  "their", "she", "him", "they", "them", "this", "that", "these", "those", "very", "too", "not",
  "to", "of", "in", "on", "at", "it", "he", "we", "you", "my", "me", "a", "an", "so", "then",
]);
// 서술어에 이어 붙는 어미. 그림 검색에 쓸 낱말이 아니어서 버린다.
const CONNECTIVE = /(어서|아서|지만|는데|니까|면서|으면|려고|도록|으나|고서)$/;
const HAEDA = /(했어요|했습니다|했다|해요|합니다|하다|하는|하고|했고|해서)$/;

function stripJosa(word: string): string {
  for (const josa of JOSA) {
    if (!word.endsWith(josa)) continue;
    const rest = word.slice(0, -josa.length);
    // 이/가/의/도/에/로/만은 "아이"처럼 낱말의 일부일 수 있어 남는 말이 두 글자 이상일 때만 뗀다.
    const needed = josa.length === 1 && !"을를은는와과".includes(josa) ? 2 : 1;
    if (rest.length >= needed) return rest;
  }
  return word;
}

function koreanKeywords(text: string): string[] {
  const words: string[] = [];
  for (const raw of text.split(/[^가-힣a-zA-Z0-9]+/)) {
    if (!raw) continue;
    let word = raw;
    if (HAEDA.test(word)) {
      word = word.replace(HAEDA, "");
    } else if (/(요|다|까|죠|네)$/.test(word) || CONNECTIVE.test(word)) {
      continue;
    } else {
      word = stripJosa(word);
    }
    if (word.length >= 1 && !KO_STOP.has(word) && !KO_STOP.has(raw)) words.push(word);
  }
  return words;
}

function englishKeywords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(
    (word) => word.length >= 3 && !EN_STOP.has(word)
  );
}

// 글에서 그림 검색에 쓸 낱말만 뽑는다. 같은 낱말은 한 번만 쓴다.
export function keywordsOf(text: string, language: Language): string[] {
  const words = language === "en" ? englishKeywords(text) : koreanKeywords(text);
  return [...new Set(words)];
}

// 정해진 장면 검색어에 앞장 글에서 새로 나온 낱말을 더해, 구체적인 검색어부터 넓은 검색어 순서로 돌려준다.
// 이미 앞 장면의 검색어에 쓴 낱말은 빼서, 이야기가 진행되며 그림이 달라지게 한다.
// 누가(기준 낱말)는 모든 검색어에 들어가고, 그림이 끝내 없을 때만 마지막 수단으로 뺀다.
export function followUpQueries(
  input: FiveW,
  texts: string[],
  index: number,
  language: Language,
  level: Level
): string[] {
  const subject = subjectOf(input) ?? "";
  const planned = pictureQueries(input, level, language);
  const scene = planned[index] ?? subject;
  const previous = [...texts.slice(0, index)].reverse().find((text) => text.trim() !== "") ?? "";

  const used = new Set(
    [...planned.slice(0, index), scene].flatMap((query) => query.split(" ")).concat(subject)
  );
  const fresh = keywordsOf(previous, language).filter((word) => !used.has(word));

  // 정해진 장면이 없는 중간 장(검색어가 기준 낱말뿐)은 새 낱말을 두 개까지 쓴다.
  const open = scene === subject;
  const rest = scene.split(" ").slice(1);

  const candidates = [
    open ? [subject, ...fresh.slice(0, 2)].join(" ") : [scene, ...fresh.slice(0, 1)].join(" "),
    open ? [subject, ...fresh.slice(0, 1)].join(" ") : scene,
    scene,
    subject,
    rest.join(" "),
  ].map((query) => query.trim());

  return candidates.filter((query, i) => query && candidates.indexOf(query) === i);
}
