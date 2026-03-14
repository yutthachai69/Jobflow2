import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AirborneInfectionReport from "@/app/components/reports/AirborneInfectionReport";
import ExhaustFanReport from "@/app/components/reports/ExhaustFanReport";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobReportPage({ params }: Props) {
  const { id: jobItemId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
    include: {
      asset: {
        include: {
          room: {
            include: {
              floor: {
                include: {
                  building: {
                    include: { site: true },
                  },
                },
              },
            },
          },
        },
      },
      workOrder: {
        include: {
          site: { include: { client: true } },
        },
      },
      technician: true,
      photos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!jobItem) notFound();

  // CLIENT ดูได้เฉพาะงานของไซต์ตัวเอง
  if (user.role === "CLIENT") {
    const siteId = user.siteId ?? (await prisma.user.findUnique({
      where: { id: user.userId },
      select: { siteId: true },
    }))?.siteId ?? null;
    const jobSiteId = jobItem.asset?.room?.floor?.building?.siteId ?? null;
    if (!siteId || !jobSiteId || siteId !== jobSiteId) notFound();
  }

  let formType = "AIRBORNE_INFECTION";
  if (jobItem.checklist) {
    try {
      const parsed = JSON.parse(jobItem.checklist);
      if (parsed?.formType) {
        formType = parsed.formType === "CLEAN_ROOM" ? "AIRBORNE_INFECTION" : parsed.formType;
      }
    } catch {
      // keep default
    }
  }

  if (formType === "EXHAUST_FAN") {
    return <ExhaustFanReport jobItem={jobItem} />;
  }
  return <AirborneInfectionReport jobItem={jobItem} />;
}
