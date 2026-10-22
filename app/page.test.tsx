import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 제목과 육하원칙 입력 칸을 보여준다", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1, name: "나의 글쓰기 책" })).toBeInTheDocument();
  for (const label of ["누가", "언제", "어디서", "무엇을", "어떻게", "왜"]) {
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  }
});
