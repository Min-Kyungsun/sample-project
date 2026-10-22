import { expect, test } from "vitest";

import { filledFields, pictureQueries } from "./pictures";

test("모든 칸이 비어 있으면 그림 검색어가 없다", () => {
  expect(pictureQueries({})).toEqual([]);
  expect(pictureQueries({ who: "  ", where: "" })).toEqual([]);
});

test("한두 칸만 입력하면 그림 1개를 검색한다", () => {
  expect(pictureQueries({ who: "토끼" })).toEqual(["토끼"]);
  expect(pictureQueries({ who: "토끼", where: "학교" })).toEqual(["토끼 학교"]);
});

test("세 칸 이상 입력하면 그림 2개를 검색하고 모두 누가로 시작한다", () => {
  expect(pictureQueries({ who: "토끼", where: "학교", what: "공부" })).toEqual([
    "토끼 학교",
    "토끼 공부",
  ]);
});

test("초급은 그림 수가 장면 묶음보다 적으면 마지막 그림이 남은 묶음을 맡는다", () => {
  const queries = pictureQueries({
    who: "토끼", when: "아침", where: "학교", what: "공부", how: "즐겁게", why: "시험",
  });
  expect(queries).toEqual(["토끼 아침 학교", "토끼 공부 즐겁게 시험"]);
});

test("입력한 칸의 수를 센다", () => {
  expect(filledFields({ who: "토끼", when: " ", why: "재미" })).toBe(2);
});

test("중급은 그림 3개, 고급은 그림 5개를 검색한다", () => {
  expect(pictureQueries({ who: "토끼", where: "학교" }, "intermediate")).toHaveLength(3);
  expect(pictureQueries({ who: "토끼" }, "advanced")).toHaveLength(5);
  expect(pictureQueries({}, "advanced")).toEqual([]);
});

test("장면마다 육하원칙의 다른 역할을 맡고 모든 검색어가 누가로 시작한다", () => {
  expect(
    pictureQueries(
      { who: "토끼", when: "아침", where: "학교", what: "공부", how: "즐겁게", why: "시험" },
      "advanced"
    )
  ).toEqual(["토끼 아침 학교", "토끼 공부 즐겁게", "토끼 시험", "토끼", "토끼 행복"]);
});

test("정해진 장면이 모자라면 중간 장은 누가만, 마지막 장은 마무리 낱말을 붙인다", () => {
  expect(pictureQueries({ who: "토끼", where: "학교" }, "intermediate")).toEqual([
    "토끼 학교",
    "토끼",
    "토끼 행복",
  ]);
  expect(pictureQueries({ who: "rabbit" }, "intermediate", "en")).toEqual([
    "rabbit",
    "rabbit",
    "rabbit happy",
  ]);
});

test("누가가 없으면 가장 구체적인 입력을 기준 낱말로 삼는다", () => {
  expect(pictureQueries({ where: "학교", when: "아침" }, "intermediate")).toEqual([
    "학교 아침",
    "학교",
    "학교 행복",
  ]);
});
