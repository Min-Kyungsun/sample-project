import { StoryFlow } from "@/components/story/story-flow";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col items-center gap-3 rounded-3xl bg-secondary px-6 py-8 text-center text-secondary-foreground">
        <p aria-hidden className="text-5xl">
          🐰 ✏️ 📖
        </p>
        <h1 className="font-heading text-4xl tracking-tight">나의 글쓰기 책</h1>
        <p className="text-lg">
          누가, 언제, 어디서, 무엇을, 어떻게, 왜를 알려 주면 어울리는 그림을 찾아 줄게요.
          그림을 보고 글을 써 봐요!
        </p>
      </header>
      <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-8">
        <StoryFlow />
      </section>
    </main>
  );
}
