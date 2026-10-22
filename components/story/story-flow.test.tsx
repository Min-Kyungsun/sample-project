import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { StoryFlow } from "./story-flow";

const picture = (id: string) => ({ id, alt: "토끼 학교", dataUri: "data:image/png;base64,AAAA" });

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      if (url === "/api/pictures") {
        const { level } = JSON.parse(init.body as string);
        const total = { beginner: 2, intermediate: 3, advanced: 5 }[level as string] ?? 2;
        return Response.json({ pictures: [picture("p0")], total });
      }
      if (url === "/api/pictures/next") {
        const { index } = JSON.parse(init.body as string);
        return Response.json({ picture: picture(`p${index}`) });
      }
      if (url === "/api/pictures/another") {
        return Response.json({ picture: { ...picture("other"), alt: "다른 토끼" } });
      }
      return Response.json({});
    })
  );
}

beforeEach(() => {
  localStorage.clear();
  mockApi();
  // jsdom에는 URL.createObjectURL이 없다.
  URL.createObjectURL = vi.fn(() => "blob:book");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

async function startWithPictures() {
  render(<StoryFlow />);
  fireEvent.change(screen.getByLabelText("누가"), { target: { value: "토끼" } });
  fireEvent.change(screen.getByLabelText("어디서"), { target: { value: "학교" } });
  fireEvent.change(screen.getByLabelText("무엇을"), { target: { value: "공부" } });
  fireEvent.click(screen.getByRole("button", { name: "그림 보기" }));
  return screen.findAllByRole("img");
}

// 지금 그림에 글을 쓰고 다음(마지막 그림이면 다 썼어요)으로 넘어간다.
async function writeAndNext(text: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  const next = screen.queryByRole("button", { name: "다음" });
  if (!next) {
    fireEvent.click(screen.getByRole("button", { name: "다 썼어요" }));
    return;
  }
  const before = screen.getByRole("heading", { level: 2 }).textContent;
  fireEvent.click(next);
  await waitFor(() => expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(before));
}

test("모든 칸이 비어 있으면 그림 보기를 시작할 수 없다", () => {
  render(<StoryFlow />);
  expect(screen.getByRole("button", { name: "그림 보기" })).toBeDisabled();
  expect(screen.getByText(/한 칸 이상/)).toBeInTheDocument();
});

test("육하원칙 일부만 입력해도 그림 한 장과 글쓰기 칸이 나온다", async () => {
  const images = await startWithPictures();
  expect(images).toHaveLength(1);
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByText("1 / 2번째 그림")).toBeInTheDocument();
});

test("글쓰기 칸은 2줄을 넘겨 입력되지 않는다", async () => {
  await startWithPictures();
  const box = screen.getByRole("textbox");
  fireEvent.change(box, { target: { value: "가\n나\n다" } });
  expect(box).toHaveValue("가\n나");
});

test("글을 쓰기 전에는 다음으로 넘어갈 수 없고, 쓰면 다음 그림이 나온다", async () => {
  await startWithPictures();
  expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "이전" })).not.toBeInTheDocument();

  await writeAndNext("토끼가 갔다.");
  expect(screen.getByText("2 / 2번째 그림")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(screen.queryByRole("button", { name: "다음" })).not.toBeInTheDocument();
});

test("이전을 누르면 앞 그림으로 돌아가 쓴 글이 그대로 있다", async () => {
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  fireEvent.click(screen.getByRole("button", { name: "이전" }));
  expect(screen.getByText("1 / 2번째 그림")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("토끼가 갔다.");
});

test("마지막 그림에는 다 썼어요가 있고 글을 써야 누를 수 있다", async () => {
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  expect(screen.getByRole("button", { name: "다 썼어요" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "잘 갔다." } });
  expect(screen.getByRole("button", { name: "다 썼어요" })).toBeEnabled();
});

test("다 쓰면 쓴 글이 모두 보이고 책을 내려받을 수 있다", async () => {
  await startWithPictures();
  await writeAndNext("재미있었다.");
  await writeAndNext("잘 갔다.");

  expect(await screen.findByText("재미있었다.")).toBeInTheDocument();
  expect(screen.getByText("잘 갔다.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "책 내려받기" })).toBeEnabled();
});

test("그림을 가져오지 못하면 오류 안내를 보여준다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ error: "그림을 가져오지 못했어요." }, { status: 502 }))
  );
  render(<StoryFlow />);
  fireEvent.change(screen.getByLabelText("누가"), { target: { value: "토끼" } });
  fireEvent.click(screen.getByRole("button", { name: "그림 보기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("그림을 가져오지 못했어요.");
});

test("난이도를 고르면 그림 개수와 글쓰기 줄 수가 바뀐다", async () => {
  render(<StoryFlow />);
  fireEvent.click(screen.getByRole("button", { name: "중급" }));
  expect(screen.getByRole("button", { name: "중급" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.change(screen.getByLabelText("누가"), { target: { value: "토끼" } });
  fireEvent.click(screen.getByRole("button", { name: "그림 보기" }));
  await screen.findAllByRole("img");
  expect(screen.getByText("1 / 3번째 그림")).toBeInTheDocument();
  const box = screen.getByRole("textbox");
  fireEvent.change(box, { target: { value: "가\n나\n다\n라" } });
  expect(box).toHaveValue("가\n나\n다");
});

test("언어를 고르면 서버에 고른 언어를 알려 준다", async () => {
  render(<StoryFlow />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.change(screen.getByLabelText("누가"), { target: { value: "rabbit" } });
  fireEvent.click(screen.getByRole("button", { name: "그림 보기" }));
  await screen.findAllByRole("img");
  const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(JSON.parse(init.body).language).toBe("en");
});

test("다른 그림 보기를 누르면 지금 그림만 바뀌고 쓴 글은 그대로다", async () => {
  await startWithPictures();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "토끼가 갔다." } });
  fireEvent.click(screen.getByRole("button", { name: "다른 그림 보기" }));
  await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("alt", "다른 토끼"));
  expect(screen.getByRole("textbox")).toHaveValue("토끼가 갔다.");
});

test("쓰던 글은 새로고침해도 쓰던 그림에서 이어서 쓸 수 있다", async () => {
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  cleanup();

  render(<StoryFlow />);
  expect(await screen.findByText("2 / 2번째 그림")).toBeInTheDocument();
  expect(screen.getByText("저장된 글을 불러왔어요.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "이전" }));
  expect(screen.getByRole("textbox")).toHaveValue("토끼가 갔다.");
});

test("처음부터 다시를 누르면 저장된 글도 지운다", async () => {
  await startWithPictures();
  await writeAndNext("가");
  await writeAndNext("나");
  fireEvent.click(await screen.findByRole("button", { name: "처음부터 다시" }));
  cleanup();

  render(<StoryFlow />);
  expect(screen.getByRole("button", { name: "그림 보기" })).toBeInTheDocument();
  expect(screen.queryByText("저장된 글을 불러왔어요.")).not.toBeInTheDocument();
});

test("책 제목과 글쓴이 이름을 적어 책을 내려받는다", async () => {
  let book: Blob | undefined;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    book = blob;
    return "blob:book";
  });
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  await writeAndNext("잘 갔다.");

  fireEvent.change(await screen.findByLabelText("책 제목"), { target: { value: "토끼의 하루" } });
  fireEvent.change(screen.getByLabelText("글쓴이 이름"), { target: { value: "민지" } });
  fireEvent.click(screen.getByRole("button", { name: "책 내려받기" }));

  const html = await book!.text();
  expect(html).toContain("<title>토끼의 하루</title>");
  expect(html).toContain("민지");
});

test("한 장을 쓰면 칭찬 스탬프가 붙고 진행 표시가 올라간다", async () => {
  await startWithPictures();
  const bar = screen.getByRole("progressbar");
  expect(bar).toHaveAttribute("aria-valuenow", "0");
  expect(bar).toHaveAttribute("aria-valuemax", "2");
  expect(screen.queryByText("참 잘했어요!")).not.toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "토끼가 갔다." } });
  expect(screen.getByText("참 잘했어요!")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  expect(screen.getByText("1 / 2장 완성")).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
  expect(screen.queryByText("참 잘했어요!")).not.toBeInTheDocument();
});

test("모든 장을 쓰면 다 썼어요를 누르라고 알려 준다", async () => {
  await startWithPictures();
  await writeAndNext("가");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "나" } });
  expect(screen.getByText("모두 썼어요! 다 썼어요를 눌러 책을 만들어 봐요.")).toBeInTheDocument();
});

test("다음을 누를 때 앞장에 쓴 글을 함께 보내 다음 그림을 찾는다", async () => {
  await startWithPictures();
  await writeAndNext("토끼가 학교에서 공부를 했어요.");
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
    ([url]: unknown[]) => url === "/api/pictures/next"
  );
  expect(calls).toHaveLength(1);
  const body = JSON.parse(calls[0][1].body);
  expect(body.texts[0]).toBe("토끼가 학교에서 공부를 했어요.");
  expect(body.index).toBe(1);
  expect(body.excludeIds).toEqual(["p0"]);
});

test("이미 찾은 그림으로 돌아갔다 다시 다음을 눌러도 그림을 다시 찾지 않는다", async () => {
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  fireEvent.click(screen.getByRole("button", { name: "이전" }));
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(screen.getByText("2 / 2번째 그림")).toBeInTheDocument();
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
    ([url]: unknown[]) => url === "/api/pictures/next"
  );
  expect(calls).toHaveLength(1);
});

test("다음 그림을 찾지 못하면 오류 안내를 보여주고 그 자리에 머문다", async () => {
  await startWithPictures();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ error: "어울리는 그림을 찾지 못했어요." }, { status: 404 }))
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "토끼가 갔다." } });
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("어울리는 그림을 찾지 못했어요.");
  expect(screen.getByText("1 / 2번째 그림")).toBeInTheDocument();
});

test("그림 포함하기를 끄면 글만 담긴 책을 내려받는다", async () => {
  let book: Blob | undefined;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    book = blob;
    return "blob:book";
  });
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  await writeAndNext("잘 갔다.");

  const checkbox = await screen.findByLabelText("그림 포함하기");
  expect(checkbox).toBeChecked();
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "책 내려받기" }));

  const html = await book!.text();
  expect(html).not.toContain("<img");
  expect(html).toContain("토끼가 갔다.");
});

test("그림 포함하기를 켜 둔 채로 내려받으면 그림이 담긴다", async () => {
  let book: Blob | undefined;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    book = blob;
    return "blob:book";
  });
  await startWithPictures();
  await writeAndNext("토끼가 갔다.");
  await writeAndNext("잘 갔다.");
  fireEvent.click(await screen.findByRole("button", { name: "책 내려받기" }));

  expect((await book!.text()).match(/<img /g)).toHaveLength(2);
});

test("그림을 보여 줄 때 그림 출처(Pixabay)를 알려 준다", async () => {
  await startWithPictures();
  expect(screen.getByText("그림 출처: Pixabay")).toBeInTheDocument();
});

test("입력 화면에서 낱말이 그림 서비스로 전달된다는 것과 실명을 쓰지 않는 게 좋다는 것을 알려 준다", () => {
  render(<StoryFlow />);
  expect(
    screen.getByText("그림을 찾으려고 입력한 낱말이 그림 서비스(Pixabay)에 전달돼요. 실명은 쓰지 않는 것이 좋아요.")
  ).toBeInTheDocument();
});
