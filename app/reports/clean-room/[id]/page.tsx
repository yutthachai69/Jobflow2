import { PrismaClient } from "@prisma/client";
import CleanRoomReport from "@/app/components/reports/CleanRoomReport";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function CleanRoomReportPage({ params }: { params: Promise<{ id: string }> }) {
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

    return <CleanRoomReport jobItem={jobItem} />;
}
