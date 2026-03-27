import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PmImportClient from "./PmImportClient"

export default async function AdminPmImportPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      client: { select: { name: true } },
    },
  })

  return <PmImportClient sites={sites} />
}
