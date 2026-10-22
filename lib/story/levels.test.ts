import { expect, test } from "vitest";

import { LEVELS } from "./levels";

test("난이도마다 글쓰기 줄 수가 다르다", () => {
  expect(LEVELS.beginner.maxLines).toBe(2);
  expect(LEVELS.intermediate.maxLines).toBe(3);
  expect(LEVELS.advanced.maxLines).toBe(5);
});

test("난이도마다 그림 개수가 다르다", () => {
  expect(LEVELS.beginner.pictures).toBe(2);
  expect(LEVELS.intermediate.pictures).toBe(3);
  expect(LEVELS.advanced.pictures).toBe(5);
});
