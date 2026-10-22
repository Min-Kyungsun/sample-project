// 아이에게 맞지 않는 낱말. 입력한 낱말(검색어)과 검색된 그림의 태그에 모두 쓴다.
// 낱말의 일부로만 들어 있는 경우("피아노"의 "피", "warm"의 "war")는 걸러내지 않도록 낱말 단위로 비교한다.
const BLOCKED = [
  // 폭력, 무기, 공포
  "총", "총기", "권총", "무기", "칼", "피", "전쟁", "폭력", "죽음", "시체", "살인", "공포", "좀비", "해골",
  "gun", "weapon", "knife", "blood", "bloody", "gore", "violence", "violent", "war", "kill",
  "dead", "death", "corpse", "skull", "skeleton", "zombie", "horror", "scary", "creepy",
  // 성적인 것
  "누드", "섹시", "야한", "성인", "nude", "naked", "sexy", "sex", "erotic", "bikini", "lingerie",
  // 담배, 술, 마약, 도박
  "담배", "흡연", "술", "맥주", "소주", "와인", "음주", "마약", "도박", "카지노",
  "cigarette", "cigar", "smoking", "tobacco", "alcohol", "beer", "wine", "whiskey", "vodka",
  "drunk", "drug", "cannabis", "marijuana", "gambling", "casino", "poker",
];

// 한글 낱말 뒤에 붙을 수 있는 조사.
const JOSA = ["이", "가", "을", "를", "은", "는", "의", "에", "도", "와", "과", "로", "만", "랑", "에서", "으로", "에게"];

const BLOCKED_SET = new Set(BLOCKED);

function tokensOf(text: string): string[] {
  return text.toLowerCase().split(/[^가-힣a-z0-9]+/).filter(Boolean);
}

function isBlockedToken(token: string): boolean {
  if (BLOCKED_SET.has(token)) return true;
  // 영어 복수형(guns, drugs)
  if (token.endsWith("s") && BLOCKED_SET.has(token.slice(0, -1))) return true;
  // 한글 낱말 + 조사(담배를, 총이)
  return BLOCKED.some(
    (word) => token.startsWith(word) && JOSA.includes(token.slice(word.length)) && /[가-힣]/.test(word)
  );
}

export function containsBlockedWord(text: string): boolean {
  return tokensOf(text).some(isBlockedToken);
}

// Pixabay가 돌려주는 그림 태그("rabbit, gun")에서 부적합한 낱말이 하나라도 있으면 쓰지 않는다.
export function isSafeTags(tags: string): boolean {
  return !containsBlockedWord(tags);
}

export const UNSAFE_WORD_MESSAGE = "그림을 찾기 어려운 낱말이 있어요. 다른 낱말로 써 볼까요?";
