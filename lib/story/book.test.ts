import { JSDOM } from "jsdom";
import { expect, test } from "vitest";

import { buildBookHtml } from "./book";
import type { BookPage } from "./types";

const picture = { id: "p1", alt: "토끼", dataUri: "data:image/png;base64,AAAA" };

function page(overrides: Partial<BookPage> = {}): BookPage {
  return { picture, text: "토끼가 학교에 갔다.", ...overrides };
}

test("책에는 그림과 아이가 쓴 글이 들어 있다", () => {
  const html = buildBookHtml([page()]);
  expect(html).toContain("data:image/png;base64,AAAA");
  expect(html).toContain("토끼가 학교에 갔다.");
});

test("책 파일은 인터넷 없이 열리도록 바깥 주소를 쓰지 않는다", () => {
  const html = buildBookHtml([page()]);
  expect(html).not.toMatch(/(src|href)=["']https?:/);
  expect(html).not.toMatch(/url\(["']?https?:/);
});

test("글에 들어 있는 HTML 문자는 그대로 글자로 보인다", () => {
  const html = buildBookHtml([page({ text: "<script>alert(1)</script>" })]);
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).toContain("&lt;script&gt;");
});

test("영어 책은 영어 제목을 쓴다", () => {
  const html = buildBookHtml([page({ text: "I like it." })], "en");
  expect(html).toContain('<html lang="en">');
  expect(html).toContain("My Writing Book");
});

test("표지에는 책 제목과 글쓴이 이름이 들어 있다", () => {
  const html = buildBookHtml([page()], "ko", { title: "토끼의 하루", author: "민지" });
  expect(html).toContain("<title>토끼의 하루</title>");
  expect(html).toContain("토끼의 하루");
  expect(html).toContain("민지");
});

test("제목을 비우면 기본 제목을 쓰고 글쓴이가 없으면 글쓴이 줄을 만들지 않는다", () => {
  const html = buildBookHtml([page()], "ko", { title: "  ", author: "" });
  expect(html).toContain("<title>나의 글쓰기 책</title>");
  expect(html).not.toContain('class="author"');
});

test("책 끝에는 가족이 피드백을 쓸 가족 한마디 칸이 있다", () => {
  expect(buildBookHtml([page()])).toContain("가족 한마디");
  expect(buildBookHtml([page()], "en")).toContain("Family Comments");
});

// 책 파일을 실제로 열어 저장하기를 눌러 본다.
function openBook(language: "ko" | "en" = "ko") {
  const dom = new JSDOM(buildBookHtml([page()], language), {
    runScripts: "dangerously",
    url: "http://localhost/",
  });
  const saved: string[] = [];
  const win = dom.window as unknown as Window & typeof globalThis;
  win.URL.createObjectURL = () => "blob:book";
  win.URL.revokeObjectURL = () => {};
  win.Blob = class {
    constructor(parts: string[]) {
      saved.push(parts[0]);
    }
  } as unknown as typeof Blob;
  win.HTMLAnchorElement.prototype.click = () => {};
  return { document: win.document, saved };
}

test("가족 한마디 칸에 글을 쓰고 저장하면 쓴 글이 담긴 책 파일이 새로 만들어진다", () => {
  const { document, saved } = openBook();
  const box = document.getElementById("family-comment") as HTMLTextAreaElement;
  box.value = "토끼 이야기가 정말 재미있었어!";
  (document.getElementById("save-book") as HTMLButtonElement).click();

  expect(saved).toHaveLength(1);
  expect(saved[0]).toContain("토끼 이야기가 정말 재미있었어!");
  expect(saved[0]).toContain("토끼가 학교에 갔다.");
});

test("저장된 책 파일을 다시 열면 쓴 글이 그대로 있고 또 저장할 수 있다", () => {
  const first = openBook();
  (first.document.getElementById("family-comment") as HTMLTextAreaElement).value = "참 잘했어요 <b>";
  (first.document.getElementById("save-book") as HTMLButtonElement).click();

  const reopened = new JSDOM(first.saved[0], { runScripts: "dangerously", url: "http://localhost/" });
  const box = reopened.window.document.getElementById("family-comment") as HTMLTextAreaElement;
  expect(box.value).toBe("참 잘했어요 <b>");
  expect(reopened.window.document.querySelectorAll("b")).toHaveLength(0);
  expect(reopened.window.document.getElementById("save-book")).not.toBeNull();
});

test("영어 책의 가족 한마디와 저장 안내는 영어다", () => {
  const html = buildBookHtml([page()], "en");
  expect(html).toContain("Save");
  expect(html).toContain("Write a family comment here.");
});

test("저장 버튼은 인쇄할 때 나오지 않는다", () => {
  expect(buildBookHtml([page()])).toMatch(/@media print[^]*\.no-print\{display:none\}/);
});

test("출력할 때 쪽이 잘리지 않도록 인쇄용 스타일이 있다", () => {
  const html = buildBookHtml([page()]);
  expect(html).toContain("@media print");
  expect(html).toContain("break-inside:avoid");
});

test("제목과 글쓴이에 들어 있는 HTML 문자는 그대로 글자로 보인다", () => {
  const html = buildBookHtml([page()], "ko", { title: "<b>x</b>", author: "<i>y</i>" });
  expect(html).not.toContain("<b>x</b>");
  expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  expect(html).toContain("&lt;i&gt;y&lt;/i&gt;");
});

test("글을 쓴 장마다 칭찬 스탬프가 붙는다", () => {
  const html = buildBookHtml([page(), page({ text: "둘째 장" })]);
  expect(html).toContain("★ 참 잘했어요!");
  expect(html).toContain("★ 멋져요!");
});

test("영어 책에는 영어 칭찬 스탬프가 붙는다", () => {
  expect(buildBookHtml([page()], "en")).toContain("★ Great job!");
});

test("그림 없이 글만 담으면 책에 이미지가 들어가지 않는다", () => {
  const html = buildBookHtml([page()], "ko", {}, { includePictures: false });
  expect(html).not.toContain("<img");
  expect(html).not.toContain("data:image/png;base64,AAAA");
  expect(html).toContain("토끼가 학교에 갔다.");
  expect(html).toContain("★ 참 잘했어요!");
});

test("그림을 담는 것이 기본이다", () => {
  expect(buildBookHtml([page()])).toContain("<img");
  expect(buildBookHtml([page()], "ko", {}, { includePictures: true })).toContain("<img");
});

test("그림을 담은 책에는 그림 출처가 적힌다", () => {
  expect(buildBookHtml([page()])).toContain("그림 출처: Pixabay");
  expect(buildBookHtml([page()], "en")).toContain("Pictures: Pixabay");
});

test("그림을 뺀 책에는 그림 출처를 적지 않는다", () => {
  expect(buildBookHtml([page()], "ko", {}, { includePictures: false })).not.toContain("Pixabay");
});
