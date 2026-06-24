import { getServerSession } from "next-auth";

import {
  isEmailAdmin,
  isEmailAllowed,
  normalizeEmail,
} from "@/lib/auth/allowed-emails";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export type CurrentUserRole = "admin" | "user";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);

  if (!email || !isEmailAllowed(email)) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: session?.user?.name,
      image: session?.user?.image,
    },
    create: {
      email,
      name: session?.user?.name,
      image: session?.user?.image,
    },
  });

  const role: CurrentUserRole = isEmailAdmin(email) ? "admin" : "user";

  return {
    ...user,
    role,
    isAdmin: role === "admin",
  };
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    throw new ForbiddenError();
  }

  return user;
}
