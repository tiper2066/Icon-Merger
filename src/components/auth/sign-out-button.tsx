"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      size="sm"
      type="button"
      variant="outline"
      onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
    >
      로그아웃
    </Button>
  );
}
