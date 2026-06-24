import { withAuth } from "next-auth/middleware";

import { isEmailAllowed } from "@/lib/auth/allowed-emails";

export const proxy = withAuth({
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized: ({ token }) => isEmailAllowed(token?.email),
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
