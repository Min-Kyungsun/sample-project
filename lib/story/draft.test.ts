import { expect, test } from "vitest";

import { clearDraft, loadDraft, saveDraft, type Draft } from "./draft";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

const draft: Draft = {
  step: "writing",
  level: "intermediate",
  language: "en",
  input: { who: "rabbit" },
  pictures: [{ id: "p1", alt: "rabbit", dataUri: "data:image/png;base64,AAAA" }],
  texts: ["I like it."],
  seenIds: ["p1"],
  bookTitle: "토끼의 하루",
  author: "민지",
};

test("저장한 글을 그대로 불러온다", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  expect(loadDraft(storage)).toEqual(draft);
});

test("저장한 것이 없거나 망가졌으면 null을 돌려준다", () => {
  expect(loadDraft(fakeStorage())).toBeNull();
  expect(loadDraft(fakeStorage({ "story-book-draft": "{깨진 json" }))).toBeNull();
  expect(
    loadDraft(fakeStorage({ "story-book-draft": JSON.stringify({ step: "nope" }) }))
  ).toBeNull();
});

test("지우면 더는 불러오지 않는다", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  clearDraft(storage);
  expect(loadDraft(storage)).toBeNull();
});

test("저장 공간이 가득 차도 오류 없이 넘어간다", () => {
  const full = {
    ...fakeStorage(),
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  expect(() => saveDraft(full, draft)).not.toThrow();
});

test("저장할 글이 없으면 저장된 것을 지운다", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  saveDraft(storage, null);
  expect(loadDraft(storage)).toBeNull();
});
