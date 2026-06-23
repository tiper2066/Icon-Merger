import { getServerSession } from "next-auth";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { authOptions } from "@/lib/auth/options";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? "인증된 사용자";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <section className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-3xl border bg-card px-8 py-12 text-center shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ICON Merger
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            SVG 아이콘 병합 도구에 접근할 수 있습니다.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground">
            {userEmail} 계정은 허용 목록을 통과했습니다. 다음 단계에서
            Prisma 데이터 모델과 아이콘 API를 구현합니다.
          </p>
        </div>
        <SignOutButton />
      </section>
    </main>
  );
}
