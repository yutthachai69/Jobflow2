import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getClientPMPlan } from "@/app/actions/pm-client"
import ClientPMPlanClient from "./ClientPMPlanClient"

type SearchParams = { year?: string; month?: string }

export default async function ClientPMPlanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "CLIENT") {
    redirect("/login")
  }

  const sp = await searchParams

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const yearRaw = sp?.year
  const monthRaw = sp?.month

  const year = yearRaw ? Number(yearRaw) || currentYear : currentYear
  const initialMonth = monthRaw ? Number(monthRaw) || currentMonth : currentMonth

  const { summary } = await getClientPMPlan(year)

  return (
    <ClientPMPlanClient year={year} summary={summary} initialMonth={initialMonth} />
  )
}

