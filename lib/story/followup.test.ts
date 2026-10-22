import { expect, test } from "vitest";

import { followUpQueries, keywordsOf } from "./followup";

test("한글 글에서 조사와 서술어를 떼고 그림 검색에 쓸 낱말만 뽑는다", () => {
  expect(keywordsOf("토끼가 학교에서 공부를 했어요.", "ko")).toEqual(["토끼", "학교", "공부"]);
  expect(keywordsOf("나는 친구와 같이 놀았어요", "ko")).toEqual(["친구"]);
});

test("연결하는 어미가 붙은 서술어는 버리고 두 글자 낱말에 붙은 을/를은 뗀다", () => {
  expect(keywordsOf("시험이 걱정되어서 책을 읽었어요.", "ko")).toEqual(["시험", "책"]);
});

test("영어 글에서는 관사와 대명사 같은 흔한 말을 뺀다", () => {
  expect(keywordsOf("The rabbit goes to the big school.", "en")).toEqual([
    "rabbit",
    "goes",
    "big",
    "school",
  ]);
});

test("정해진 장면이 없는 중간 장은 앞장 글의 새 낱말을 누가에 붙여 구체적인 것부터 찾는다", () => {
  expect(
    followUpQueries({ who: "토끼", where: "학교" }, ["학교에서 공부를 했어요.", ""], 1, "ko", "intermediate")
  ).toEqual(["토끼 공부", "토끼"]);
});

test("정해진 장면이 있으면 그 장면 검색어에 새 낱말을 하나 더해 찾고, 없으면 누가 → 장면 낱말만 순서로 넓힌다", () => {
  expect(
    followUpQueries(
      { who: "토끼", where: "학교", what: "공부" },
      ["토끼가 학교에서 친구와 놀았어요.", ""],
      1,
      "ko",
      "beginner"
    )
  ).toEqual(["토끼 공부 친구", "토끼 공부", "토끼", "공부"]);
});

test("앞장 글에서 새 낱말을 못 뽑으면 정해진 장면 검색어로 찾는다", () => {
  expect(
    followUpQueries({ who: "토끼", where: "학교", what: "공부" }, ["했어요.", ""], 1, "ko", "beginner")
  ).toEqual(["토끼 공부", "토끼", "공부"]);
});

test("이미 앞 장면의 검색어에 쓴 낱말은 되풀이하지 않는다", () => {
  const queries = followUpQueries(
    { who: "토끼", where: "학교" },
    ["토끼가 학교에서 당근을 먹었어요.", ""],
    1,
    "ko",
    "intermediate"
  );
  expect(queries[0]).toBe("토끼 당근");
});

test("가장 최근에 쓴 글만 본다", () => {
  const queries = followUpQueries(
    { who: "토끼" },
    ["학교에 갔어요.", "공원에서 놀았어요.", ""],
    2,
    "ko",
    "advanced"
  );
  expect(queries[0]).toBe("토끼 공원");
});

test("마지막 장은 마무리 낱말 장면에 새 낱말을 더한다", () => {
  expect(
    followUpQueries({ who: "토끼" }, ["", "", "", "집에서 쉬었어요.", ""], 4, "ko", "advanced")
  ).toEqual(["토끼 행복 집", "토끼 행복", "토끼", "행복"]);
});
