# 육하원칙 입력 칸과 글쓰기 칸이 shadcn 컴포넌트가 아니다

**Symptom**: `components/story/story-flow.tsx`의 육하원칙 입력 칸과 글쓰기 칸이 네이티브 `<input>`/`<textarea>`에 token class를 직접 붙여 만든 것이다. `docs/decisions/ui-composition.md`는 이런 일반 UI에 공식 shadcn 컴포넌트를 쓰라고 한다.

**Observed evidence**: `components/ui/`에는 `button.tsx`만 있다. 구현 세션의 샌드박스가 `ui.shadcn.com` 접속을 막아 `shadcn add`가 실패했다(`Request to https://ui.shadcn.com/r/index.json failed`).

**Suspected cause**: 샌드박스 네트워크 허용 목록에 `ui.shadcn.com`이 없다(확인됨). 컴포넌트 자체의 문제는 아니다.

**What was tried**: `fieldClass` 상수로 semantic token(`border-input`, `bg-background` 등)만 사용해 시각 언어는 맞췄다. 동작은 그대로 두었고, 오류 안내와 안내 문구도 직접 만든 마크업이다.

**Proposed next step**: 네트워크가 열린 환경에서 `bunx shadcn@latest add input textarea field alert`를 실행하고, `story-flow.tsx`의 입력 칸, 글쓰기 칸, 오류 안내를 해당 컴포넌트로 교체한다. 기존 컴포넌트 테스트(`story-flow.test.tsx`)는 접근성 이름으로 찾으므로 그대로 통과해야 한다.
