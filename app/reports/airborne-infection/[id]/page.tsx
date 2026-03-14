import { PrismaClient } from "@prisma/client";
import AirborneInfectionReport from "@/app/components/reports/AirborneInfectionReport";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function AirborneReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: jobItemId } = await params;

    const jobItem = await prisma.jobItem.findUnique({
        where: { id: jobItemId },
        include: {
            asset: {
                include: {
                    room: true,
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
        },
    });

    if (!jobItem) {
        notFound();
    }

    return <AirborneInfectionReport jobItem={jobItem} />;
}
