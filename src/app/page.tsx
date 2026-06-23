import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <section className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-3xl border bg-card px-8 py-12 text-center shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ICON Merger
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            SVG 아이콘 병합 도구를 준비 중입니다.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground">
            Next.js, Tailwind CSS, Shadcn UI, Prisma, PostgreSQL 초기 설정이
            완료된 상태입니다. 다음 단계에서 인증과 아이콘 데이터 모델을
            구현합니다.
          </p>
        </div>
        <Button size="lg">초기 설정 완료</Button>
      </section>
    </main>
  );
}
