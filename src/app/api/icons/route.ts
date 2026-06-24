import { IconType } from "@/generated/prisma/client";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { processSvgFile, SvgProcessingError } from "@/lib/svg/process-svg";

const iconTypes = new Set<string>(Object.values(IconType));

function getIconType(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.toUpperCase();

  if (!iconTypes.has(normalizedValue)) {
    return undefined;
  }

  return normalizedValue as IconType;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const url = new URL(request.url);
    const type = getIconType(url.searchParams.get("type"));

    if (type === undefined) {
      return Response.json(
        { error: "Invalid icon type." },
        { status: 400 },
      );
    }

    const icons = await prisma.icon.findMany({
      where: {
        userId: user.id,
        ...(type ? { type } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({ icons });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const formData = await request.formData();
    const type = getIconType(getStringValue(formData.get("type")));
    const files = formData.getAll("files").filter(isFile);

    if (!type) {
      return Response.json({ error: "Invalid icon type." }, { status: 400 });
    }

    if (files.length === 0) {
      return Response.json({ error: "업로드할 SVG 파일을 선택해 주세요." }, { status: 400 });
    }

    if (type === IconType.MAIN && files.length !== 1) {
      return Response.json({ error: "메인 아이콘은 한 번에 1개만 업로드할 수 있습니다." }, { status: 400 });
    }

    const anchorX = getNumberValue(formData.get("anchorX"));
    const anchorY = getNumberValue(formData.get("anchorY"));

    if (type === IconType.MAIN && (anchorX === null || anchorY === null)) {
      return Response.json(
        { error: "메인 아이콘은 anchorX와 anchorY 좌표가 필요합니다." },
        { status: 400 },
      );
    }

    const processedSvgs = await Promise.all(
      files.map((file) => processSvgFile({ file })),
    );

    const icons = await Promise.all(
      processedSvgs.map((svg) =>
        prisma.icon.create({
          data: {
            userId: user.id,
            type,
            name: svg.name,
            svgContent: svg.svgContent,
            viewBox: svg.viewBox,
            width: svg.width,
            height: svg.height,
            baseWidth: type === IconType.MAIN ? svg.width : null,
            baseHeight: type === IconType.MAIN ? svg.height : null,
            anchorX: type === IconType.MAIN ? anchorX : null,
            anchorY: type === IconType.MAIN ? anchorY : null,
          },
        }),
      ),
    );

    return Response.json({ icons }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof SvgProcessingError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : null;
}

function getNumberValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File;
}
