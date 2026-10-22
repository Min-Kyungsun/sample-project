export const FIVE_W_KEYS = ["who", "when", "where", "what", "how", "why"] as const;

export type FiveWKey = (typeof FIVE_W_KEYS)[number];

export type Level = "beginner" | "intermediate" | "advanced";

export type Language = "ko" | "en";

export type FiveW = Partial<Record<FiveWKey, string>>;

export const FIVE_W_LABELS: Record<FiveWKey, string> = {
  who: "누가",
  when: "언제",
  where: "어디서",
  what: "무엇을",
  how: "어떻게",
  why: "왜",
};

export type Picture = {
  id: string;
  alt: string;
  // 책 파일 안에 그대로 넣을 수 있도록 서버가 이미지를 data URI로 내려준다.
  dataUri: string;
  // 실제 검색 서비스 대신 임시 그림을 쓴 경우 true.
  interim?: boolean;
};

export type BookPage = {
  picture: Picture;
  text: string;
};
