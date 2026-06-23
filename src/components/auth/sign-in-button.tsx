"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  callbackUrl?: string;
};

export function SignInButton({ callbackUrl = "/" }: SignInButtonProps) {
  return (
    <Button
      size="lg"
      type="button"
      onClick={() => void signIn("google", { callbackUrl })}
    >
      Google로 로그인
    </Button>
  );
}
