import { pictureQueries } from "@/lib/story/pictures";
import { interimPicture } from "@/lib/story/server/interim";
import { anotherPicture } from "@/lib/story/server/pixabay";
import { containsBlockedWord, UNSAFE_WORD_MESSAGE } from "@/lib/story/safety";
import { pixabayKey } from "@/lib/story/server/pixabay-key";
import type { FiveW, Language, Level } from "@/lib/story/types";

// 첫 그림만 찾고 전체 그림 수(total)를 알려 준다. 다음 그림은 앞장 글을 쓴 뒤 /next에서 찾는다.
export async function POST(request: Request) {
  const { input, level, language } = (await request.json()) as {
    input?: FiveW;
    level?: Level;
    language?: Language;
  };
  const queries = pictureQueries(input ?? {}, level, language ?? "ko");
  if (queries.length === 0) {
    return Response.json({ error: "육하원칙을 한 칸 이상 입력해 주세요." }, { status: 400 });
  }

  if (queries.some(containsBlockedWord)) {
    return Response.json({ error: UNSAFE_WORD_MESSAGE }, { status: 422 });
  }

  const apiKey = pixabayKey();
  if (!apiKey) {
    return Response.json({ pictures: [interimPicture(queries[0], 0)], total: queries.length });
  }

  try {
    const picture = await anotherPicture(queries[0], apiKey, language ?? "ko", []);
    if (!picture) {
      return Response.json({ error: "어울리는 그림을 찾지 못했어요." }, { status: 404 });
    }
    return Response.json({ pictures: [picture], total: queries.length });
  } catch {
    return Response.json({ error: "그림을 가져오지 못했어요." }, { status: 502 });
  }
}
