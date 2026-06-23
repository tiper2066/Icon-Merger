import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/auth/sign-in-button";
import { getAllowedEmails } from "@/lib/auth/allowed-emails";
import { authOptions } from "@/lib/auth/options";

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeCallbackUrl(value: string | string[] | undefined) {
  const callbackUrl = getFirstParam(value);

  if (!callbackUrl) {
    return "/";
  }

  if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  if (!process.env.NEXTAUTH_URL) {
    return "/";
  }

  try {
    const callback = new URL(callbackUrl);
    const appUrl = new URL(process.env.NEXTAUTH_URL);

    if (callback.origin === appUrl.origin) {
      return `${callback.pathname}${callback.search}${callback.hash}`;
    }
  } catch {
    return "/";
  }

  return "/";
}

function getErrorMessage(error: string | undefined) {
  if (error === "AccessDenied") {
    return "허용된 Google 이메일 계정만 접근할 수 있습니다.";
  }

  if (error) {
    return "로그인 중 문제가 발생했습니다. Google OAuth 설정을 확인해 주세요.";
  }

  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);
  const errorMessage = getErrorMessage(getFirstParam(params.error));
  const hasAllowedEmails = getAllowedEmails().length > 0;

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <section className="flex w-full max-w-md flex-col gap-8 rounded-3xl border bg-card px-8 py-10 text-center shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ICON Merger
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Google 계정으로 로그인
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            관리자가 허용한 Google 이메일 계정으로만 ICON Merger에 접근할
            수 있습니다.
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {!hasAllowedEmails ? (
          <p className="rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground">
            `ALLOWED_GOOGLE_EMAILS` 환경 변수를 설정해야 로그인이 허용됩니다.
          </p>
        ) : null}

        <SignInButton callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
