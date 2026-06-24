"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { IconButtonTooltip } from "@/components/ui/icon-button-tooltip";

export function SignOutButton() {
  return (
    <IconButtonTooltip label="로그아웃">
      <Button
        aria-label="로그아웃"
        className="border-[#D9DCE3] bg-white text-[#111620] hover:bg-[#F7F8FA]"
        size="icon-lg"
        type="button"
        variant="ghost"
        onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
      >
        <LogOut aria-hidden="true" className="size-4" />
      </Button>
    </IconButtonTooltip>
  );
}
