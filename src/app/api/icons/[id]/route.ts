import { IconType } from "@/generated/prisma/client";
import {
  ForbiddenError,
  requireAdminUser,
  UnauthorizedError,
} from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type IconRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: IconRouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const payload = (await request.json()) as {
      anchorX?: unknown;
      anchorY?: unknown;
    };
    const anchorX = getNumberValue(payload.anchorX);
    const anchorY = getNumberValue(payload.anchorY);

    if (anchorX === null || anchorY === null || anchorX < 0 || anchorY < 0) {
      return Response.json(
        { error: "anchorX와 anchorY는 0 이상의 숫자여야 합니다." },
        { status: 400 },
      );
    }

    const icon = await prisma.icon.updateMany({
      where: {
        id,
        type: IconType.MAIN,
      },
      data: {
        anchorX,
        anchorY,
      },
    });

    if (icon.count === 0) {
      return Response.json({ error: "Main icon not found." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return Response.json({ error: "관리자만 anchor 좌표를 수정할 수 있습니다." }, { status: 403 });
    }

    throw error;
  }
}

export async function DELETE(_request: Request, context: IconRouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;

    const result = await prisma.icon.deleteMany({
      where: {
        id,
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

    if (error instanceof ForbiddenError) {
      return Response.json({ error: "관리자만 아이콘을 삭제할 수 있습니다." }, { status: 403 });
    }

    throw error;
  }
}

function getNumberValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}
