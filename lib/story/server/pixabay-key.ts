// 호출 횟수 제한을 아끼려고 USE_INTERIM_PICTURES=true이면 키가 있어도 임시 그림만 쓴다.
export function pixabayKey(): string | undefined {
  if (process.env.USE_INTERIM_PICTURES === "true") return undefined;
  return process.env.PIXABAY_API_KEY || undefined;
}
