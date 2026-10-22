import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { POST as anotherPost } from "@/app/api/pictures/another/route";
import { POST as nextPost } from "@/app/api/pictures/next/route";
import { POST as picturesPost } from "@/app/api/pictures/route";

function post(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("PIXABAY_API_KEY", "");
  vi.stubEnv("USE_INTERIM_PICTURES", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("그림 검색: 모든 칸이 비어 있으면 400을 돌려준다", async () => {
  const res = await picturesPost(post({ input: { who: " " } }));
  expect(res.status).toBe(400);
});

test("그림 검색: 검색 서비스가 실패하면 502를 돌려준다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
  const res = await picturesPost(post({ input: { who: "토끼" } }));
  expect(res.status).toBe(502);
});



test("다른 그림: 키가 없으면 이미 본 그림과 다른 임시 그림을 돌려준다", async () => {
  const body = await (
    await anotherPost(post({ query: "토끼", excludeIds: ["interim-0", "interim-1"] }))
  ).json();
  expect(body.picture.id).not.toBe("interim-0");
  expect(body.picture.id).not.toBe("interim-1");
});

test("다른 그림: 이미 본 그림은 건너뛰고 다음 그림을 고른다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("https://pixabay.com/api/")) {
        return Response.json({
          hits: [1, 2, 3].map((id) => ({ id, tags: "rabbit", webformatURL: `https://cdn.pixabay.com/${id}.jpg` })),
        });
      }
      return new Response(new Uint8Array([1]), { headers: { "content-type": "image/jpeg" } });
    })
  );
  const body = await (
    await anotherPost(post({ query: "rabbit", language: "en", excludeIds: ["pixabay-1", "pixabay-2"] }))
  ).json();
  expect(body.picture.id).toBe("pixabay-3");
});

test("다른 그림: 더 보여 줄 그림이 없으면 404를 돌려준다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({ hits: [{ id: 1, tags: "rabbit", webformatURL: "https://cdn.pixabay.com/1.jpg" }] })
    )
  );
  const res = await anotherPost(post({ query: "rabbit", excludeIds: ["pixabay-1"] }));
  expect(res.status).toBe(404);
});

test("다른 그림: 검색어가 없으면 400을 돌려준다", async () => {
  expect((await anotherPost(post({}))).status).toBe(400);
});


const HIT = (id: number, tags = "rabbit") => ({ id, tags, webformatURL: `https://cdn.pixabay.com/${id}.jpg` });

function stubPixabay(hitsFor: (query: string) => unknown[]) {
  const searches: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("https://pixabay.com/api/")) {
        searches.push(new URL(url).searchParams.get("q") ?? "");
        return Response.json({ hits: hitsFor(new URL(url).searchParams.get("q") ?? "") });
      }
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
    })
  );
  return searches;
}

test("그림 검색: 키가 없으면 첫 그림 하나와 전체 그림 수를 돌려준다", async () => {
  const body = await (
    await picturesPost(post({ input: { who: "토끼", where: "학교", what: "공부" } }))
  ).json();
  expect(body.pictures).toHaveLength(1);
  expect(body.total).toBe(2);
  expect(body.pictures[0].dataUri).toMatch(/^data:image\//);
  expect(body.pictures[0].interim).toBe(true);
});

test("그림 검색: 중급은 전체 3개, 고급은 전체 5개다", async () => {
  const mid = await (await picturesPost(post({ input: { who: "토끼" }, level: "intermediate" }))).json();
  const high = await (await picturesPost(post({ input: { who: "토끼" }, level: "advanced" }))).json();
  expect(mid.total).toBe(3);
  expect(high.total).toBe(5);
});

test("그림 검색: 안전 검색을 켜고 부적합한 태그의 그림은 건너뛰며 그림을 data URI로 내려준다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      if (url.startsWith("https://pixabay.com/api/")) {
        return Response.json({ hits: [HIT(1, "rabbit, gun"), HIT(2, "rabbit, school")] });
      }
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
    })
  );
  const body = await (await picturesPost(post({ input: { who: "토끼" } }))).json();
  expect(urls[0]).toContain("safesearch=true");
  expect(urls[1]).toBe("https://cdn.pixabay.com/2.jpg");
  expect(body.pictures[0].dataUri).toBe("data:image/jpeg;base64,AQID");
  expect(body.pictures[0].interim).toBeFalsy();
});

test("그림 검색: 영어를 고르면 영어로 검색한다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      return url.startsWith("https://pixabay.com/api/")
        ? Response.json({ hits: [HIT(1)] })
        : new Response(new Uint8Array([1]), { headers: { "content-type": "image/jpeg" } });
    })
  );
  await picturesPost(post({ input: { who: "rabbit" }, language: "en" }));
  expect(urls[0]).toContain("lang=en");
});

test("다음 그림: 앞장 글의 낱말로 검색한다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const searches = stubPixabay(() => [HIT(5)]);
  const body = await (
    await nextPost(
      post({
        input: { who: "토끼" },
        level: "intermediate",
        texts: ["토끼가 학교에서 공부를 했어요.", "", ""],
        index: 1,
        excludeIds: ["pixabay-1"],
      })
    )
  ).json();
  expect(searches[0]).toBe("토끼 학교 공부");
  expect(body.picture.id).toBe("pixabay-5");
});

test("다음 그림: 구체적인 검색어에 그림이 없으면 더 넓은 검색어로 다시 찾는다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const searches = stubPixabay((query) => (query === "토끼" ? [HIT(9)] : []));
  const body = await (
    await nextPost(
      post({ input: { who: "토끼" }, level: "intermediate", texts: ["학교에서 공부를 했어요.", "", ""], index: 1 })
    )
  ).json();
  expect(searches).toEqual(["토끼 학교 공부", "토끼 학교", "토끼"]);
  expect(body.picture.id).toBe("pixabay-9");
});

test("다음 그림: 이미 본 그림은 다시 나오지 않고, 끝내 못 찾으면 404다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  stubPixabay(() => [HIT(1)]);
  const res = await nextPost(
    post({ input: { who: "토끼" }, level: "intermediate", texts: ["가"], index: 1, excludeIds: ["pixabay-1"] })
  );
  expect(res.status).toBe(404);
});

test("USE_INTERIM_PICTURES가 켜져 있으면 키가 있어도 그림 검색을 부르지 않는다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  vi.stubEnv("USE_INTERIM_PICTURES", "true");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  const first = await (await picturesPost(post({ input: { who: "토끼" }, level: "intermediate" }))).json();
  const next = await (
    await nextPost(post({ input: { who: "토끼" }, level: "intermediate", texts: ["가"], index: 1 }))
  ).json();
  const other = await (await anotherPost(post({ query: "토끼", excludeIds: [] }))).json();

  expect(fetchMock).not.toHaveBeenCalled();
  expect(first.pictures[0].interim).toBe(true);
  expect(next.picture.interim).toBe(true);
  expect(other.picture.interim).toBe(true);
});

test("그림 검색 요청은 24시간 캐시한다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const inits: RequestInit[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith("https://pixabay.com/api/")) {
        inits.push(init ?? {});
        return Response.json({ hits: [HIT(1)] });
      }
      return new Response(new Uint8Array([1]), { headers: { "content-type": "image/jpeg" } });
    })
  );
  await picturesPost(post({ input: { who: "토끼" } }));
  expect((inits[0] as { next?: { revalidate?: number } }).next?.revalidate).toBe(86400);
});

test("그림 검색: 아이에게 맞지 않는 낱말을 입력하면 검색하지 않고 다른 낱말을 쓰라고 안내한다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  const res = await picturesPost(post({ input: { who: "토끼", what: "담배" } }));
  const body = await res.json();

  expect(res.status).toBe(422);
  expect(body.error).toContain("다른 낱말로 써 볼까요?");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("그림 검색: 낱말의 일부로만 들어 있으면 막지 않는다", async () => {
  const res = await picturesPost(post({ input: { who: "토끼", what: "피아노" } }));
  expect(res.status).toBe(200);
});

test("다음 그림: 앞장 글에 맞지 않는 낱말이 있으면 검색하지 않고 안내한다", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  const res = await nextPost(
    post({ input: { who: "토끼" }, level: "intermediate", texts: ["토끼가 담배를 피웠어요.", ""], index: 1 })
  );

  expect(res.status).toBe(422);
  expect((await res.json()).error).toContain("다른 낱말로 써 볼까요?");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("다른 그림: 맞지 않는 검색어는 검색하지 않는다", async () => {
  const res = await anotherPost(post({ query: "술 파티", excludeIds: [] }));
  expect(res.status).toBe(422);
});
