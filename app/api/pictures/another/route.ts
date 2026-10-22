import { interimPicture } from "@/lib/story/server/interim";
import { containsBlockedWord, UNSAFE_WORD_MESSAGE } from "@/lib/story/safety";
import { pixabayKey } from "@/lib/story/server/pixabay-key";
import { anotherPicture } from "@/lib/story/server/pixabay";
import type { Language } from "@/lib/story/types";

export async function POST(request: Request) {
  const { query, language, excludeIds = [] } = (await request.json()) as {
    query?: string;
    language?: Language;
    excludeIds?: string[];
  };
  if (!query?.trim()) {
    return Response.json({ error: "검색어가 필요해요." }, { status: 400 });
  }

  if (containsBlockedWord(query)) {
    return Response.json({ error: UNSAFE_WORD_MESSAGE }, { status: 422 });
  }

  const apiKey = pixabayKey();
  if (!apiKey) {
    let index = 0;
    while (excludeIds.includes(`interim-${index}`)) index += 1;
    return Response.json({ picture: interimPicture(query, index) });
  }

  try {
    const picture = await anotherPicture(query, apiKey, language ?? "ko", excludeIds);
    if (!picture) {
      return Response.json({ error: "더 보여 줄 그림이 없어요." }, { status: 404 });
    }
    return Response.json({ picture });
  } catch {
    return Response.json({ error: "그림을 가져오지 못했어요." }, { status: 502 });
  }
}
