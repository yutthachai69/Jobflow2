export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TechnicianWorkOrdersClient from "./TechnicianWorkOrdersClient";

export default async function TechnicianPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') redirect('/');

  // สถานะใบงานที่ช่างเห็นได้ (รวมรออนุมัติ/อนุมัติแล้ว)
  const activeStatuses = ["OPEN", "IN_PROGRESS", "WAITING_APPROVAL", "APPROVED"] as const;

  // สถานะรายการงานที่ยังไม่เสร็จ (รวม "พบปัญหา" เพื่อให้ช่างเห็นและกดดำเนินการต่อได้)
  const jobItemActiveStatuses = ["PENDING", "IN_PROGRESS", "ISSUE_FOUND"] as const;

  // งานที่ assign ให้ช่างคนนี้
  const myWorkOrders = await prisma.workOrder.findMany({
    where: {
      status: { in: [...activeStatuses] },
      jobItems: {
        some: {
          technicianId: user.userId,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    include: {
      site: { include: { client: true } },
      jobItems: {
        include: { asset: true },
        where: {
          technicianId: user.userId,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  // งานที่ยังไม่มีคนรับ (unassigned) — แสดงให้ช่างเห็นและกดรับงานได้
  const unassignedWorkOrders = await prisma.workOrder.findMany({
    where: {
      status: { in: [...activeStatuses] },
      jobItems: {
        some: {
          technicianId: null,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    include: {
      site: { include: { client: true } },
      jobItems: {
        include: { asset: true },
        where: {
          technicianId: null,
          status: { in: [...jobItemActiveStatuses] },
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="w-full max-w-full">
        <TechnicianWorkOrdersClient
          myWorkOrders={myWorkOrders}
          unassignedWorkOrders={unassignedWorkOrders}
        />
      </div>
    </div>
  );
}
