"use client";

import { StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildBookHtml } from "@/lib/story/book";
import { clearDraft, loadDraft, saveDraft } from "@/lib/story/draft";
import { LANGUAGES, LANGUAGE_KEYS, LEVELS, LEVEL_KEYS } from "@/lib/story/levels";
import { praiseFor, progressOf } from "@/lib/story/praise";
import { clampWriting, countLines } from "@/lib/story/writing";
import {
  FIVE_W_KEYS,
  FIVE_W_LABELS,
  type FiveWKey,
  type FiveW,
  type Language,
  type Level,
  type Picture,
} from "@/lib/story/types";

// 육하원칙 칸마다 아이가 떠올리기 쉽도록 그림 표시와 예시를 붙인다.
const FIVE_W_HINTS: Record<FiveWKey, { emoji: string; example: string }> = {
  who: { emoji: "🧒", example: "예) 토끼, 민지" },
  when: { emoji: "⏰", example: "예) 아침, 소풍 날" },
  where: { emoji: "📍", example: "예) 학교, 공원" },
  what: { emoji: "✏️", example: "예) 공부, 달리기" },
  how: { emoji: "🎈", example: "예) 신나게, 천천히" },
  why: { emoji: "💡", example: "예) 재미있어서" },
};

const LEVEL_EMOJI: Record<Level, string> = { beginner: "🌱", intermediate: "🌳", advanced: "🌟" };
const LANGUAGE_EMOJI: Record<Language, string> = { ko: "🇰🇷", en: "🇺🇸" };

type Step = "input" | "writing" | "result";

const fieldClass =
  "w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-lg font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "문제가 생겼어요. 다시 해 볼까요?");
  return data as T;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; text: string; emoji: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-base font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.key}
            type="button"
            variant={option.key === value ? "default" : "outline"}
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
          >
            <span aria-hidden>{option.emoji}</span>
            {option.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Pixabay API 규칙: 검색한 그림을 보여 줄 때 출처를 알려 준다.
function PictureCredit() {
  return <p className="text-sm text-muted-foreground">그림 출처: Pixabay</p>;
}

export function StoryFlow() {
  const [step, setStep] = useState<Step>("input");
  const [level, setLevel] = useState<Level>("beginner");
  const [language, setLanguage] = useState<Language>("ko");
  const [input, setInput] = useState<FiveW>({});
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [texts, setTexts] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [includePictures, setIncludePictures] = useState(true);
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 새로고침해도 쓰던 글을 이어서 쓸 수 있도록 브라우저에 저장해 둔 것을 불러온다.
  // 서버 렌더링 결과와 맞추려면 마운트 뒤에 읽어야 해서 effect 안에서 상태를 채운다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const draft = loadDraft(window.localStorage);
    if (draft) {
      setStep(draft.step);
      setLevel(draft.level);
      setLanguage(draft.language);
      setInput(draft.input);
      setPictures(draft.pictures);
      setTexts(draft.texts);
      setSeenIds(draft.seenIds);
      setCurrent(Math.min(draft.current ?? 0, draft.pictures.length - 1));
      setBookTitle(draft.bookTitle ?? "");
      setAuthor(draft.author ?? "");
      setRestored(true);
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    saveDraft(
      window.localStorage,
      step === "input"
        ? null
        : { step, level, language, input, pictures, texts, seenIds, bookTitle, author, current }
    );
  }, [ready, step, level, language, input, pictures, texts, seenIds, bookTitle, author, current]);

  const hasInput = FIVE_W_KEYS.some((key) => input[key]?.trim());
  const { done, total } = progressOf(texts);
  const allWritten = texts.length > 0 && texts.every((text) => countLines(text) > 0);

  async function run<T>(name: string, task: () => Promise<T>): Promise<T | undefined> {
    setLoading(name);
    setError(null);
    try {
      return await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요. 다시 해 볼까요?");
    } finally {
      setLoading(null);
    }
  }

  async function findPictures() {
    const data = await run("pictures", () =>
      postJson<{ pictures: Picture[]; total: number }>("/api/pictures", { input, level, language })
    );
    if (!data) return;
    setPictures(data.pictures);
    setSeenIds(data.pictures.map((picture) => picture.id));
    setCurrent(0);
    setRestored(false);
    setTexts(Array.from({ length: data.total }, () => ""));
    setStep("writing");
  }

  // 앞에서 이미 찾은 그림이면 그대로 넘어가고, 아니면 앞장 글의 낱말로 다음 그림을 찾는다.
  async function goNext() {
    if (current + 1 < pictures.length) {
      setCurrent(current + 1);
      return;
    }
    const data = await run("next", () =>
      postJson<{ picture: Picture }>("/api/pictures/next", {
        input,
        level,
        language,
        texts,
        index: current + 1,
        excludeIds: seenIds,
      })
    );
    if (!data) return;
    setPictures((list) => [...list, data.picture]);
    setSeenIds((list) => [...list, data.picture.id]);
    setCurrent(current + 1);
  }

  async function swapPicture(index: number) {
    const data = await run(`swap-${index}`, () =>
      postJson<{ picture: Picture }>("/api/pictures/another", {
        query: pictures[index].alt,
        language,
        excludeIds: seenIds,
      })
    );
    if (!data) return;
    setPictures((current) => current.map((picture, i) => (i === index ? data.picture : picture)));
    setSeenIds((current) => [...current, data.picture.id]);
  }

  function downloadBook() {
    const html = buildBookHtml(
      pictures.map((picture, index) => ({
        picture,
        text: texts[index],
      })),
      language,
      { title: bookTitle, author },
      { includePictures }
    );
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-writing-book.html";
    link.click();
    // 다운로드가 시작된 뒤에 해제해야 일부 브라우저에서 빈 파일이 받아지지 않는다.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function restart() {
    setStep("input");
    setInput({});
    setPictures([]);
    setTexts([]);
    setSeenIds([]);
    setCurrent(0);
    setBookTitle("");
    setAuthor("");
    setIncludePictures(true);
    setRestored(false);
    setError(null);
    clearDraft(window.localStorage);
  }

  const alert = error && (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-base text-destructive">
      {error}
    </p>
  );

  if (step === "input") {
    return (
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void findPictures();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <OptionGroup
            label="난이도"
            value={level}
            onChange={setLevel}
            options={LEVEL_KEYS.map((key) => ({ key, text: LEVELS[key].label, emoji: LEVEL_EMOJI[key] }))}
          />
          <OptionGroup
            label="언어"
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_KEYS.map((key) => ({ key, text: LANGUAGES[key], emoji: LANGUAGE_EMOJI[key] }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIVE_W_KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1.5 text-base font-semibold">
              <span>
                <span aria-hidden>{FIVE_W_HINTS[key].emoji} </span>
                {FIVE_W_LABELS[key]}
              </span>
              <input
                aria-label={FIVE_W_LABELS[key]}
                placeholder={FIVE_W_HINTS[key].example}
                className={fieldClass}
                value={input[key] ?? ""}
                maxLength={30}
                onChange={(event) =>
                  setInput((current) => ({ ...current, [key]: event.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          <span aria-hidden>🔒 </span>
          그림을 찾으려고 입력한 낱말이 그림 서비스(Pixabay)에 전달돼요. 실명은 쓰지 않는 것이 좋아요.
        </p>
        {!hasInput && (
          <p className="text-sm text-muted-foreground">
            육하원칙을 한 칸 이상 입력해 주세요. 모두 채우지 않아도 괜찮아요.
          </p>
        )}
        {alert}
        <Button type="submit" size="lg" disabled={!hasInput || loading === "pictures"}>
          {loading === "pictures" ? (
            "그림을 찾는 중…"
          ) : (
            <>
              <span aria-hidden>🔍</span> 그림 보기
            </>
          )}
        </Button>
      </form>
    );
  }

  if (step === "writing") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label="글쓰기 진행"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="h-5 w-full shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-base font-medium text-muted-foreground">
            {allWritten
              ? "모두 썼어요! 다 썼어요를 눌러 책을 만들어 봐요."
              : `${done} / ${total}장 완성`}
          </p>
          {allWritten && <span className="sr-only">{done} / {total}장 완성</span>}
        </div>
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl">
            <span aria-hidden>🖼️ </span>
            {current + 1} / {total}번째 그림
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pictures[current].dataUri}
            alt={pictures[current].alt}
            className="w-full rounded-3xl border-4 border-secondary shadow-md"
          />
          {!pictures[current].interim && <PictureCredit />}
          {countLines(texts[current]) > 0 && (
            <p className="flex items-center gap-1.5 self-start rounded-full bg-accent px-4 py-1.5 text-base font-semibold text-accent-foreground">
              <StarIcon className="size-5 fill-primary text-primary" aria-hidden />
              {praiseFor(current)}
            </p>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void swapPicture(current)}
              disabled={loading === `swap-${current}`}
            >
              {loading === `swap-${current}` ? "찾는 중…" : "다른 그림 보기"}
            </Button>
          </div>
          <textarea
            aria-label={`${current + 1}번째 그림 글쓰기`}
            className={fieldClass}
            rows={LEVELS[level].maxLines}
            value={texts[current]}
            placeholder={`그림을 보고 ${LEVELS[level].maxLines}줄 안으로 써 보세요.`}
            onChange={(event) =>
              setTexts((list) =>
                list.map((text, i) =>
                  i === current ? clampWriting(event.target.value, LEVELS[level].maxLines) : text
                )
              )
            }
          />
        </section>
        {restored && <p className="text-sm text-muted-foreground">저장된 글을 불러왔어요.</p>}
        {pictures.some((picture) => picture.interim) && (
          <p className="text-sm text-muted-foreground">
            지금은 임시 그림이에요. 그림 검색 키를 연결하면 진짜 그림이 나와요.
          </p>
        )}
        {alert}
        <div className="flex gap-3">
          {current > 0 && (
            <Button size="lg" variant="outline" onClick={() => setCurrent(current - 1)}>
              이전
            </Button>
          )}
          {current < total - 1 ? (
            <Button
              size="lg"
              className="flex-1"
              disabled={countLines(texts[current]) === 0 || loading === "next"}
              onClick={() => void goNext()}
            >
              {loading === "next" ? "다음 그림 찾는 중…" : "다음"}
            </Button>
          ) : (
            <Button size="lg" className="flex-1" disabled={!allWritten} onClick={() => setStep("result")}>
              <span aria-hidden>🎉</span> 다 썼어요
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {pictures.map((picture, index) => (
        <section key={index} className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picture.dataUri}
            alt={picture.alt}
            className="w-full rounded-3xl border-4 border-secondary shadow-md"
          />
          <p className="rounded-2xl bg-muted px-4 py-3 text-xl whitespace-pre-wrap">{texts[index]}</p>
        </section>
      ))}
      {pictures.some((picture) => !picture.interim) && <PictureCredit />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          책 제목
          <input
            className={fieldClass}
            value={bookTitle}
            maxLength={40}
            placeholder={language === "en" ? "My Writing Book" : "나의 글쓰기 책"}
            onChange={(event) => setBookTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          글쓴이 이름
          <input
            className={fieldClass}
            value={author}
            maxLength={20}
            onChange={(event) => setAuthor(event.target.value)}
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-base font-semibold">
        <input
          type="checkbox"
          className="size-6 accent-primary"
          checked={includePictures}
          onChange={(event) => setIncludePictures(event.target.checked)}
        />
        그림 포함하기
      </label>
      <p className="-mt-6 text-sm text-muted-foreground">
        끄면 그림 없이 글만 담겨서 파일이 훨씬 작아져요.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={downloadBook}>
          <span aria-hidden>📖</span> 책 내려받기
        </Button>
        <Button size="lg" variant="outline" onClick={restart}>
          처음부터 다시
        </Button>
      </div>
    </div>
  );
}
