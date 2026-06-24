import { redirect } from "next/navigation";

import { IconWorkspace } from "@/components/icon-workspace";
import { getCurrentUser, UnauthorizedError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  const user = await getCurrentUser().catch((error) => {
    if (error instanceof UnauthorizedError) {
      redirect("/auth/signin");
    }

    throw error;
  });

  const icons = await prisma.icon.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <IconWorkspace
      user={{
        name: user.name,
        email: user.email,
      }}
      icons={icons.map((icon) => ({
        id: icon.id,
        name: icon.name,
        type: icon.type,
        svgContent: icon.svgContent,
        width: icon.width,
        height: icon.height,
        anchorX: icon.anchorX,
        anchorY: icon.anchorY,
      }))}
    />
  );
}
