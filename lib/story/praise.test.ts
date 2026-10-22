import { expect, test } from "vitest";

import { ENGLISH_PRAISES, PRAISES, praiseFor, progressOf } from "./praise";

test("글을 쓴 그림만 완성으로 센다", () => {
  expect(progressOf(["", "  \n ", "가"])).toEqual({ done: 1, total: 3 });
  expect(progressOf(["가", "나"])).toEqual({ done: 2, total: 2 });
  expect(progressOf([])).toEqual({ done: 0, total: 0 });
});

test("그림마다 정해진 칭찬 말이 나오고 돌려 쓴다", () => {
  expect(praiseFor(0)).toBe(PRAISES[0]);
  expect(praiseFor(PRAISES.length)).toBe(PRAISES[0]);
  expect(new Set(PRAISES).size).toBe(PRAISES.length);
});

test("영어를 고르면 영어 칭찬이 나온다", () => {
  expect(praiseFor(1, "en")).toBe(ENGLISH_PRAISES[1]);
  expect(ENGLISH_PRAISES).toHaveLength(PRAISES.length);
});
