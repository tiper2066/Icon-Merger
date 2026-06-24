import { getCurrentUser, UnauthorizedError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type IconRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: IconRouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;

    const result = await prisma.icon.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return Response.json({ error: "Icon not found." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
