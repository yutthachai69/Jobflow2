import { redirect } from "next/navigation";

export default async function CleanRoomReportRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/reports/airborne-infection/${id}`);
}
