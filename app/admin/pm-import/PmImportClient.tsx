"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import Breadcrumbs from "@/app/components/Breadcrumbs"
import {
  validatePmImportExcel,
  commitPmImport,
  type PmImportValidatedRow,
  type PmImportCommitRow,
  type PmImportErrorRow,
} from "@/app/actions/pm-import"
import toast from "react-hot-toast"

type SiteOpt = { id: string; name: string; client: { name: string } }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const res = r.result as string
      const i = res.indexOf(",")
      resolve(i >= 0 ? res.slice(i + 1) : res)
    }
    r.onerror = () => reject(new Error("อ่านไฟล์ไม่ได้"))
    r.readAsDataURL(file)
  })
}

function downloadTemplate() {
  const headers = [
    "qrCode",
    "targetYear",
    "targetMonth",
    "roundIndex",
    "pmType",
    "dueDate",
  ]
  const example = [
    "AC-DEMO-001",
    new Date().getFullYear(),
    3,
    1,
    "MINOR",
    "",
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "PMPlan")
  XLSX.writeFile(wb, "pm-import-template.xlsx")
}

export default function PmImportClient({ sites }: { sites: SiteOpt[] }) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "")
  const noSites = sites.length === 0
  const [year, setYear] = useState(new Date().getFullYear())
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [validated, setValidated] = useState<PmImportValidatedRow[] | null>(
    null,
  )
  const [errors, setErrors] = useState<PmImportErrorRow[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const canCommit = useMemo(
    () => validated && validated.length > 0 && errors.length === 0,
    [validated, errors.length],
  )

  const onValidate = async () => {
    if (!siteId) {
      toast.error("เลือกสถานที่")
      return
    }
    if (!file) {
      toast.error("เลือกไฟล์ Excel")
      return
    }
    setLoading(true)
    setValidated(null)
    setErrors([])
    setWarnings([])
    try {
      const b64 = await fileToBase64(file)
      const res = await validatePmImportExcel(b64, siteId, year)
      setErrors(res.errors)
      setWarnings(res.warnings)
      if (res.ok && res.rows.length > 0) {
        setValidated(res.rows)
        toast.success(`ตรวจผ่าน ${res.rows.length} แถว — กดยืนยันบันทึก`)
      } else if (res.rows.length === 0) {
        toast.error("ไม่มีแถวที่ใช้ได้")
      } else {
        toast.error(`พบข้อผิดพลาด ${res.errors.length} แถว`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ตรวจสอบไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  const onCommit = async () => {
    if (!validated?.length || !siteId) return
    setCommitting(true)
    try {
      const rowsPayload: PmImportCommitRow[] = validated.map((r) => ({
        ...r,
        dueDate:
          r.dueDate instanceof Date
            ? r.dueDate.toISOString()
            : r.dueDate
              ? String(r.dueDate)
              : null,
      }))
      const res = await commitPmImport(siteId, year, rowsPayload)
      if (res.success) {
        toast.success(`บันทึกแล้ว ${res.count} รอบ`)
        setValidated(null)
        setFile(null)
        setErrors([])
        setWarnings([])
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ")
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "วางแผน PM", href: "/admin/pm-planning" },
          { label: "อัปโหลดแผน PM (Excel)", href: undefined },
        ]}
      />

      <h1 className="text-2xl font-bold text-app-heading mt-4 mb-2">
        อัปโหลดแผน PM จาก Excel
      </h1>
      <p className="text-app-muted text-sm mb-6">
        หนึ่งแถว = หนึ่งรอบ PM ต่อหนึ่งเครื่อง — ข้อมูลจะไปที่{" "}
        <code className="text-xs bg-app-section px-1 rounded">PMSchedule</code>{" "}
        ลูกค้าจะเห็นที่รายงานแผน PM ประจำปีหลังบันทึก
      </p>

      {noSites && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          ยังไม่มีสถานที่ในระบบ — เพิ่มสาขาก่อนที่เมนูสถานที่
        </div>
      )}

      <div className="bg-app-card border border-app rounded-xl p-6 space-y-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-app-heading mb-1">
              สถานที่
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={noSites}
              className="w-full rounded-lg border border-app bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.client.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-app-heading mb-1">
              ปี ค.ศ. (targetYear ในไฟล์ต้องตรงกับปีนี้)
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
              className="w-full rounded-lg border border-app bg-white px-3 py-2 text-sm"
              min={2000}
              max={2100}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-app bg-app-section text-sm font-medium hover:bg-app-border/30"
          >
            ดาวน์โหลด template (.xlsx)
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-heading mb-1">
            ไฟล์ Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setValidated(null)
              setErrors([])
            }}
            className="block w-full text-sm text-app-muted"
          />
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <strong>ก่อนบันทึก:</strong> ระบบจะลบเฉพาะรอบ PM ในสัญญาปีนี้ที่{" "}
          <strong>ยังไม่มีใบงาน</strong> แล้วสร้างใหม่จากไฟล์ — รอบที่ออกใบงานแล้วจะคงอยู่
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || noSites}
            onClick={onValidate}
            className="px-5 py-2.5 rounded-xl bg-[var(--app-btn-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "กำลังตรวจ…" : "ตรวจสอบไฟล์"}
          </button>
          <button
            type="button"
            disabled={!canCommit || committing}
            onClick={onCommit}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {committing ? "กำลังบันทึก…" : "ยืนยันบันทึกลงระบบ"}
          </button>
          <Link
            href="/admin/pm-planning"
            className="inline-flex items-center px-4 py-2.5 text-sm text-app-muted hover:text-app-heading"
          >
            ← กลับวางแผน PM
          </Link>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          {warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-4">
          <h3 className="font-semibold text-red-900 mb-2">
            ข้อผิดพลาด ({errors.length})
          </h3>
          <ul className="text-sm text-red-800 max-h-48 overflow-y-auto space-y-1 font-mono">
            {errors.slice(0, 80).map((e, i) => (
              <li key={i}>
                แถว Excel ~{e.excelRow}: {e.message}
              </li>
            ))}
            {errors.length > 80 && (
              <li>… และอีก {errors.length - 80} แถว</li>
            )}
          </ul>
        </div>
      )}

      {validated && validated.length > 0 && (
        <div className="mt-4 rounded-xl border border-app bg-app-card p-4">
          <h3 className="font-semibold text-app-heading mb-2">
            ตัวอย่างแถวที่จะบันทึก ({validated.length} แถว)
          </h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto text-xs">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="text-left text-app-muted border-b border-app">
                  <th className="py-1 pr-2">qrCode</th>
                  <th className="py-1 pr-2">ปี</th>
                  <th className="py-1 pr-2">เดือน</th>
                  <th className="py-1 pr-2">รอบ</th>
                  <th className="py-1 pr-2">pmType</th>
                </tr>
              </thead>
              <tbody>
                {validated.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-b border-app/50">
                    <td className="py-1 pr-2 font-mono">{r.qrCode}</td>
                    <td className="py-1 pr-2">{r.targetYear}</td>
                    <td className="py-1 pr-2">{r.targetMonth}</td>
                    <td className="py-1 pr-2">{r.roundIndex}</td>
                    <td className="py-1 pr-2">{r.pmType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validated.length > 30 && (
              <p className="text-app-muted mt-2">แสดง 30 แถวแรก</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
