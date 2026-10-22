import type { Picture } from "../types";

// 키를 받기 전까지 쓰는 임시 동작이다. 완료로 보지 않는다.

const COLORS = ["#fde68a", "#bfdbfe", "#bbf7d0", "#fecaca"];

export function interimPicture(query: string, index: number): Picture {
  const color = COLORS[index % COLORS.length];
  const label = query.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="${color}"/><text x="320" y="210" font-size="40" text-anchor="middle" font-family="sans-serif">${label} ${index + 1}</text></svg>`;
  return {
    id: `interim-${index}`,
    alt: query,
    dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    interim: true,
  };
}

