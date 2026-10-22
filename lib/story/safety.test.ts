import { expect, test } from "vitest";

import { containsBlockedWord, isSafeTags } from "./safety";

test("아이에게 맞지 않는 한글 낱말과 조사가 붙은 낱말을 걸러낸다", () => {
  for (const text of ["담배", "담배를 피웠어요", "술", "도박", "총", "피", "무서운 좀비"]) {
    expect(containsBlockedWord(text), text).toBe(true);
  }
});

test("낱말의 일부로만 들어 있는 경우는 걸러내지 않는다", () => {
  for (const text of ["피아노", "피자", "술래잡기", "칼국수", "총명한", "토끼 학교 공부", "수영복"]) {
    expect(containsBlockedWord(text), text).toBe(false);
  }
});

test("영어 낱말은 대소문자와 복수형을 가리지 않고 걸러내되 다른 낱말의 일부는 놔둔다", () => {
  for (const text of ["Cigarette", "guns", "beer", "casino night"]) {
    expect(containsBlockedWord(text), text).toBe(true);
  }
  for (const text of ["warm sun", "toward home", "Sussex", "rabbit school"]) {
    expect(containsBlockedWord(text), text).toBe(false);
  }
});

test("그림 태그에 부적합한 낱말이 하나라도 있으면 쓰지 않는다", () => {
  expect(isSafeTags("rabbit, gun")).toBe(false);
  expect(isSafeTags("clown, horror, scary")).toBe(false);
  expect(isSafeTags("rabbit, school, warm")).toBe(true);
  expect(isSafeTags("dog, park, play")).toBe(true);
});
