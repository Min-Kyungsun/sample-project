import { followUpQueries } from "@/lib/story/followup";
import { interimPicture } from "@/lib/story/server/interim";
import { anotherPicture } from "@/lib/story/server/pixabay";
import { containsBlockedWord, UNSAFE_WORD_MESSAGE } from "@/lib/story/safety";
import { pixabayKey } from "@/lib/story/server/pixabay-key";
import type { FiveW, Language, Level } from "@/lib/story/types";

// 앞장에 쓴 글의 낱말로 다음 그림을 찾는다. 구체적인 검색어에 그림이 없으면 넓은 검색어로 다시 찾는다.
export async function POST(request: Request) {
  const {
    input,
    level,
    language = "ko",
    texts = [],
    index = 1,
    excludeIds = [],
  } = (await request.json()) as {
    input?: FiveW;
    level?: Level;
    language?: Language;
    texts?: string[];
    index?: number;
    excludeIds?: string[];
  };
  const queries = followUpQueries(input ?? {}, texts, index, language, level ?? "beginner");
  if (queries.length === 0) {
    return Response.json({ error: "그림을 찾을 정보가 없어요." }, { status: 400 });
  }

  if (queries.some(containsBlockedWord)) {
    return Response.json({ error: UNSAFE_WORD_MESSAGE }, { status: 422 });
  }

  const apiKey = pixabayKey();
  if (!apiKey) {
    let id = index;
    while (excludeIds.includes(`interim-${id}`)) id += 1;
    return Response.json({ picture: interimPicture(queries[0], id), query: queries[0] });
  }

  try {
    for (const query of queries) {
      const picture = await anotherPicture(query, apiKey, language, excludeIds);
      if (picture) return Response.json({ picture, query });
    }
    return Response.json({ error: "어울리는 그림을 찾지 못했어요." }, { status: 404 });
  } catch {
    return Response.json({ error: "그림을 가져오지 못했어요." }, { status: 502 });
  }
}
