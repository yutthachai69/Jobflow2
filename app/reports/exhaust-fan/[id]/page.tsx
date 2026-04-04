import { prisma } from "@/lib/prisma";
import ExhaustFanReport from "@/app/components/reports/ExhaustFanReport";
import { notFound } from "next/navigation";

export default async function ExhaustFanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobItemId } = await params;

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
                    include: {
                      site: {
                        include: {
                          client: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      workOrder: {
        include: {
          site: {
            include: {
              client: true,
            },
          },
        },
      },
      technician: true,
      pmSchedule: { select: { pmType: true } },
    },
  });

  if (!jobItem) {
    notFound();
  }

  return <ExhaustFanReport jobItem={jobItem} />;
}

