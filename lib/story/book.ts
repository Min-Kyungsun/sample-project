import { praiseFor } from "./praise";
import type { BookPage, Language } from "./types";

export type BookCover = { title?: string; author?: string };

export type BookOptions = {
  // false이면 그림 없이 글만 담는다. 기본은 담는다.
  includePictures?: boolean;
};

const TEXT: Record<
  Language,
  {
    title: string;
    author: string;
    family: string;
    familyHint: string;
    save: string;
    saveNote: string;
    credit: string;
    nth: (n: number) => string;
  }
> = {
  ko: {
    title: "나의 글쓰기 책",
    author: "글쓴이",
    family: "가족 한마디",
    familyHint: "여기에 가족 한마디를 써 주세요.",
    save: "💾 저장하기",
    credit: "그림 출처: Pixabay",
    saveNote: "쓴 글을 저장하면 가족 한마디가 담긴 책 파일이 새로 내려받아져요.",
    nth: (n) => `${n}번째 글`,
  },
  en: {
    title: "My Writing Book",
    author: "Author",
    family: "Family Comments",
    familyHint: "Write a family comment here.",
    save: "💾 Save",
    credit: "Pictures: Pixabay",
    saveNote: "Save to download a new book file that includes your comment.",
    nth: (n) => `Writing ${n}`,
  },
};

const STYLE = `
body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:#faf7f2;color:#2b2b2b;margin:0;padding:24px;line-height:1.7}
main{max-width:640px;margin:0 auto}
.cover{text-align:center;padding:72px 16px;margin:0 0 24px;background:#fde68a;border-radius:16px}
.cover h1{font-size:2.2rem;margin:0 0 16px}
.cover .author{font-size:1.2rem;margin:0}
section{background:#fff;border-radius:16px;padding:20px;margin:24px 0;box-shadow:0 2px 8px rgba(0,0,0,.08);break-inside:avoid}
img{max-width:100%;border-radius:12px;display:block;margin:0 auto 16px}
p.text{font-size:1.25rem;margin:0;white-space:pre-wrap}
.stamp{display:inline-block;margin:0 0 12px;padding:2px 12px;border-radius:999px;background:#fef3c7;color:#b45309;font-weight:600}
.family h2{margin:0 0 8px;font-size:1.3rem}
.family textarea{width:100%;box-sizing:border-box;min-height:12rem;font:inherit;font-size:1.1rem;line-height:2.4rem;border:2px solid #d1d5db;border-radius:12px;padding:0 12px;background:repeating-linear-gradient(transparent,transparent calc(2.4rem - 1px),#9ca3af calc(2.4rem - 1px),#9ca3af 2.4rem)}
.family button{margin-top:12px;font:inherit;font-weight:600;font-size:1.1rem;padding:10px 24px;border:0;border-radius:999px;background:#fdba74;color:#2b2b2b;cursor:pointer}
.credit{margin:24px 0 0;text-align:center;font-size:.85rem;color:#6b7280}
.family .note{margin:8px 0 0;font-size:.9rem;color:#6b7280}
@media print{
body{background:#fff;padding:0}
.cover{break-after:page;border-radius:0}
.no-print{display:none}
section{box-shadow:none;border:1px solid #d1d5db;break-inside:avoid}
}
`;

// 책 파일 안에서 도는 스크립트. 쓴 글을 책에 담아 파일로 다시 내려받는다.
// 안에 들어 있는 백틱이나 따옴표가 바깥 템플릿과 섞이지 않도록 일반 문자열로 둔다.
const SAVE_SCRIPT = [
  'document.getElementById("save-book").addEventListener("click", function () {',
  '  var box = document.getElementById("family-comment");',
  '  box.textContent = box.value;',
  '  var html = "<!doctype html>\\n" + document.documentElement.outerHTML;',
  '  var url = URL.createObjectURL(new Blob([html], { type: "text/html" }));',
  '  var link = document.createElement("a");',
  '  link.href = url;',
  '  link.download = "my-writing-book.html";',
  '  link.click();',
  '  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);',
  '});',
].join("\n");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPage(
  { picture, text }: BookPage,
  index: number,
  language: Language,
  includePictures: boolean
): string {
  const image = includePictures
    ? `<img src="${escapeHtml(picture.dataUri)}" alt="${escapeHtml(picture.alt)}">\n`
    : "";
  return `<section>
${image}
<p class="stamp">★ ${praiseFor(index, language)}</p>
<p class="text" aria-label="${TEXT[language].nth(index + 1)}">${escapeHtml(text)}</p>
</section>`;
}

// 그림은 data URI로 이미 들어 있으므로 파일 하나만으로 인터넷 없이 열린다.
export function buildBookHtml(
  pages: BookPage[],
  language: Language = "ko",
  cover: BookCover = {},
  { includePictures = true }: BookOptions = {}
): string {
  const text = TEXT[language];
  const title = cover.title?.trim() || text.title;
  const author = cover.author?.trim();

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<header class="cover">
<h1>${escapeHtml(title)}</h1>
${author ? `<p class="author">${text.author}: ${escapeHtml(author)}</p>` : ""}
</header>
${pages.map((page, index) => renderPage(page, index, language, includePictures)).join("\n")}
<section class="family">
<h2>${text.family}</h2>
<textarea id="family-comment" rows="5" placeholder="${text.familyHint}"></textarea>
<button type="button" id="save-book" class="no-print">${text.save}</button>
<p class="note no-print">${text.saveNote}</p>
</section>
${includePictures ? `<p class="credit">${text.credit}</p>` : ""}
</main>
<script>${SAVE_SCRIPT}</script>
</body>
</html>
`;
}
