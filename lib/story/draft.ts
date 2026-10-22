import type { FiveW, Language, Level, Picture } from "./types";

const KEY = "story-book-draft";
const STEPS = ["writing", "result"];

export type Draft = {
  step: "writing" | "result";
  level: Level;
  language: Language;
  input: FiveW;
  // 그림은 앞장을 쓴 뒤 하나씩 찾으므로 그림 수가 글 수보다 적을 수 있다.
  pictures: Picture[];
  texts: string[];
  // 지금까지 보여 준 그림 id. 다른 그림 보기에서 같은 그림이 다시 나오지 않게 한다.
  seenIds: string[];
  current?: number;
  bookTitle?: string;
  author?: string;
};

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// 저장할 글이 없는 처음 화면(null)이면 저장된 것을 지운다.
export function saveDraft(storage: Store, draft: Draft | null): void {
  try {
    if (!draft) {
      storage.removeItem(KEY);
      return;
    }
    storage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 앱은 그대로 쓸 수 있다.
  }
}

export function loadDraft(storage: Store): Draft | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    const valid =
      STEPS.includes(draft.step) &&
      Array.isArray(draft.pictures) &&
      draft.pictures.length > 0 &&
      Array.isArray(draft.texts) &&
      draft.texts.length >= draft.pictures.length;
    return valid ? draft : null;
  } catch {
    return null;
  }
}

export function clearDraft(storage: Store): void {
  try {
    storage.removeItem(KEY);
  } catch {
    // 위와 같다.
  }
}
