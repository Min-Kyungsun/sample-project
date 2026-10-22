import { expect, test } from "vitest";

import { INITIAL_MAX_LINES, clampWriting, countLines } from "./writing";

test("초급은 2줄까지만 입력된다", () => {
  expect(INITIAL_MAX_LINES).toBe(2);
  expect(clampWriting("가\n나\n다")).toBe("가\n나");
});

test("2줄 이하는 그대로 둔다", () => {
  expect(clampWriting("가\n나")).toBe("가\n나");
  expect(clampWriting("가")).toBe("가");
});

test("줄 수와 비어 있는지를 센다", () => {
  expect(countLines("")).toBe(0);
  expect(countLines("  \n ")).toBe(0);
  expect(countLines("가\n나")).toBe(2);
});
