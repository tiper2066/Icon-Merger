import { getServerSession } from "next-auth";

import { isEmailAllowed, normalizeEmail } from "@/lib/auth/allowed-emails";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);

  if (!email || !isEmailAllowed(email)) {
    throw new UnauthorizedError();
  }

  return prisma.user.upsert({
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
}
