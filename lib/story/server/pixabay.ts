import { isSafeTags } from "../safety";
import type { Language, Picture } from "../types";

type Hit = { id: number; tags: string; webformatURL: string };

async function toDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download failed: ${res.status}`);
  const type = res.headers.get("content-type") ?? "image/jpeg";
  const bytes = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${bytes.toString("base64")}`;
}

async function safeHits(query: string, apiKey: string, language: Language): Promise<Hit[]> {
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    lang: language,
    safesearch: "true",
    per_page: "20",
  });
  // Pixabay API 규칙에 따라 검색 요청은 24시간 캐시한다.
  const res = await fetch(`https://pixabay.com/api/?${params}`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`pixabay search failed: ${res.status}`);

  const { hits } = (await res.json()) as { hits: Hit[] };
  return hits.filter((candidate) => isSafeTags(candidate.tags));
}

async function toPicture(hit: Hit, query: string): Promise<Picture> {
  return { id: `pixabay-${hit.id}`, alt: query, dataUri: await toDataUri(hit.webformatURL) };
}

// 이미 보여 준 그림을 뺀 다음 그림을 고른다.
export async function anotherPicture(
  query: string,
  apiKey: string,
  language: Language,
  excludeIds: string[]
): Promise<Picture | null> {
  const hit = (await safeHits(query, apiKey, language)).find(
    (candidate) => !excludeIds.includes(`pixabay-${candidate.id}`)
  );
  return hit ? toPicture(hit, query) : null;
}
