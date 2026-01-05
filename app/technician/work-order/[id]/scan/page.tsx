import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ qrCode?: string }>;
}

export default async function ScanQRPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { qrCode } = await searchParams;

  if (!qrCode) {
    redirect(`/technician/work-order/${id}`);
  }

  // ค้นหา Asset จาก QR Code
  const asset = await prisma.asset.findUnique({
    where: { qrCode },
  });

  if (!asset) {
    redirect(`/technician/work-order/${id}?error=notfound`);
  }

  // ค้นหา JobItem ที่เกี่ยวข้องกับ WorkOrder นี้และ Asset นี้
  const jobItem = await prisma.jobItem.findFirst({
    where: {
      workOrderId: id,
      assetId: asset.id,
    },
  });

  if (!jobItem) {
    redirect(`/technician/work-order/${id}?error=notinworkorder`);
  }

  redirect(`/technician/job-item/${jobItem.id}`);
}


