export const INITIAL_MAX_LINES = 2;

export function clampWriting(text: string, maxLines = INITIAL_MAX_LINES): string {
  return text.split("\n").slice(0, maxLines).join("\n");
}

export function countLines(text: string): number {
  return text.split("\n").filter((line) => line.trim() !== "").length;
}
