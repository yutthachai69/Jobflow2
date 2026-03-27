'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type {
  WashChartBucketPoint,
  WashChartMinorBucketPoint,
  ChartGranularity,
} from '@/lib/client-wash-chart'

/** ตัวกรองช่วงวันที่ + มิติ — อัปเดต query chartFrom / chartTo / chartGran (อยู่ไฟล์เดียวกับกราฟ) */
function WashChartUrlFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ฟังก์ชันกลางสำหรับอัปเดต URL (เรียกใช้ทันทีที่มีการเปลี่ยนแปลง)
  const updateUrl = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    // ถ้าเปลี่ยนวันที่หรือมิติ ให้ล้างหน้าเก่าออก (ถ้ามี pagination)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const urlFrom = searchParams.get('chartFrom') || ''
  const urlTo = searchParams.get('chartTo') || ''
  const urlGran = searchParams.get('chartGran') || 'day'

  return (
    <div className="flex flex-wrap items-center gap-2 bg-app-card p-3 rounded-xl border border-app shadow-sm">
      
      {/* 1. ส่วนเลือกช่วงเวลา (Quick Select) */}
      <div className="flex bg-app-section p-1 rounded-lg border border-app mr-2">
        <button
          onClick={() => {
            // โค้ดตั้งค่าเดือนนี้ แล้วสั่ง updateUrl...
          }}
          className="text-[11px] px-3 py-1 rounded-md hover:bg-app-card text-app-heading transition-all"
        >
          เดือนนี้
        </button>
      </div>

      {/* 2. ส่วนปฏิทิน (Date Range) - ยุบรวมให้ดูง่าย */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-app-section rounded-lg border border-app group focus-within:border-blue-500 transition-all">
        <input
          type="date"
          value={urlFrom}
          onChange={(e) => updateUrl('chartFrom', e.target.value)}
          className="bg-transparent text-xs text-app-heading outline-none"
        />
        <span className="text-app-muted text-[10px] font-bold">TO</span>
        <input
          type="date"
          value={urlTo}
          onChange={(e) => updateUrl('chartTo', e.target.value)}
          className="bg-transparent text-xs text-app-heading outline-none"
        />
      </div>

      {/* 3. ส่วนมิติ (Granularity) */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider">มุมมอง:</span>
        <select
          value={urlGran}
          onChange={(e) => updateUrl('chartGran', e.target.value)}
          className="bg-app-section text-xs text-app-heading px-3 py-1.5 rounded-lg border border-app outline-none cursor-pointer hover:bg-app-card transition-all"
        >
          <option value="day">รายวัน</option>
          <option value="week">รายสัปดาห์</option>
          <option value="month">รายเดือน</option>
          <option value="year">รายปี</option>
        </select>
      </div>

      {/* 4. สถานะการโหลด (Optional) */}
      <div className="hidden sm:block ml-2">
         {/* ใส่ Spinner เล็กๆ ตรงนี้ได้เวลาที่ URL กำลังเปลี่ยน */}
      </div>
    </div>
  )
}

const COLORS = {
  targetWash: '#94a3b8',
  actualMajor: '#7c3aed',
  minorAir: '#0d9488',
  minorExhaust: '#b45309',
}

interface ClientDashboardChartsProps {
  majorSeries: WashChartBucketPoint[]
  minorSeries: WashChartMinorBucketPoint[]
  weeklyWashTargetMajor: number
  weeklyWashTargetMinor: number
  /** จำนวนแอร์ (AIR_CONDITIONER) — ใช้เป็นขอบเขตล้างใหญ่ */
  washMajorScopeCount: number
  /** จำนวนแอร์ + Exhaust — ใช้เป็นขอบเขตล้างย่อย (Exhaust มีแค่ล้างย่อย) */
  washMinorScopeCount: number
  siteName: string
  clientName: string
  filterSummary: string
  granularity: ChartGranularity
  rangeWasClamped: boolean
}

function formatTooltipNum(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function MinorWashTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: WashChartMinorBucketPoint }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-app bg-app-card p-2 text-xs shadow-lg min-w-[180px]">
      <div className="font-medium text-app-heading mb-1.5">{p.name}</div>
      <div className="text-app-body space-y-0.5">
        <div>เป้าหมาย (แอร์+Exhaust รวม): {formatTooltipNum(p.targetWash)}</div>
        <div>ทำได้จริง · แอร์: {p.minorAir}</div>
        <div>ทำได้จริง · Exhaust: {p.minorExhaust}</div>
      </div>
      <div className="mt-2 pt-2 border-t border-app font-medium text-app-heading">
        รวมเทียบเป้า: {p.actualTotal} / {formatTooltipNum(p.targetWash)}
      </div>
    </div>
  )
}

function ChartCard({
  data,
  actualColor,
  title,
  granHint,
  filterSummary
}: {
  data: WashChartBucketPoint[],
  actualColor: string,
  title: string,
  granHint: string,
  filterSummary: string
}) {
  const manyTicks = data.length > 12

  return (
    <div className="bg-app-card rounded-xl border border-app p-5 shadow-sm">
      {/* Header ที่กระชับขึ้น */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2 border-b border-app pb-4">
        <div>
          <h3 className="text-base font-bold text-app-heading">สถิติการ{title}</h3>
          <p className="text-xs text-app-muted mt-0.5">{filterSummary}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-app-section border border-app text-app-muted">
            มิติ{granHint}
          </span>
        </div>
      </div>

      <div className="h-64 md:h-72 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: manyTicks ? 40 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }}
                stroke="var(--app-border)"
                interval={manyTicks ? 'preserveStartEnd' : 0}
                angle={manyTicks ? -45 : 0}
                textAnchor={manyTicks ? 'end' : 'middle'}
              />
              <YAxis
                tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }}
                stroke="var(--app-border)"
                allowDecimals
              />
              <Tooltip
                cursor={{ fill: 'var(--app-border)', opacity: 0.1 }}
                contentStyle={{
                  backgroundColor: 'var(--app-card)',
                  border: '1px solid var(--app-border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--app-text-body)' }}>
                    {value === 'targetWash' ? 'เป้าหมาย' : 'ทำได้จริง'}
                  </span>
                )}
              />
              <Bar dataKey="targetWash" fill={COLORS.targetWash} radius={[2, 2, 0, 0]} barSize={manyTicks ? 15 : 25} />
              <Bar dataKey="actual" fill={actualColor} radius={[2, 2, 0, 0]} barSize={manyTicks ? 15 : 25} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-app-muted text-xs italic">
            ไม่มีข้อมูลการ{title}
          </div>
        )}
      </div>
    </div>
  )
}

function MinorWashChartCard({
  data,
  granHint,
  filterSummary,
}: {
  data: WashChartMinorBucketPoint[]
  granHint: string
  filterSummary: string
}) {
  const manyTicks = data.length > 12

  return (
    <div className="bg-app-card rounded-xl border border-app p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2 border-b border-app pb-4">
        <div>
          <h3 className="text-base font-bold text-app-heading">สถิติการล้างย่อย</h3>
          <p className="text-xs text-app-muted mt-0.5">{filterSummary}</p>
          <p className="text-[11px] text-app-muted/90 mt-1">
            3 แท่ง: เป้าหมาย · แอร์ · Exhaust — <strong className="text-app-heading font-medium">เทียบเป้าใช้ผลรวม (แอร์ + Exhaust)</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-app-section border border-app text-app-muted">
            มิติ{granHint}
          </span>
        </div>
      </div>

      <div className="h-64 md:h-72 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 10, left: -20, bottom: manyTicks ? 40 : 0 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }}
                stroke="var(--app-border)"
                interval={manyTicks ? 'preserveStartEnd' : 0}
                angle={manyTicks ? -45 : 0}
                textAnchor={manyTicks ? 'end' : 'middle'}
              />
              <YAxis tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} stroke="var(--app-border)" allowDecimals />
              <Tooltip content={<MinorWashTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--app-text-body)' }}>
                    {value === 'targetWash'
                      ? 'เป้าหมาย (รวม)'
                      : value === 'minorAir'
                        ? 'ทำได้จริง · แอร์'
                        : value === 'minorExhaust'
                          ? 'ทำได้จริง · Exhaust'
                          : value}
                  </span>
                )}
              />
              <Bar dataKey="targetWash" name="targetWash" fill={COLORS.targetWash} radius={[2, 2, 0, 0]} maxBarSize={28} />
              <Bar dataKey="minorAir" name="minorAir" fill={COLORS.minorAir} radius={[2, 2, 0, 0]} maxBarSize={28} />
              <Bar dataKey="minorExhaust" name="minorExhaust" fill={COLORS.minorExhaust} radius={[2, 2, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-app-muted text-xs italic">ไม่มีข้อมูลการล้างย่อย</div>
        )}
      </div>
    </div>
  )
}

export default function ClientDashboardCharts({
  majorSeries,
  minorSeries,
  weeklyWashTargetMajor,
  weeklyWashTargetMinor,
  washMajorScopeCount,
  washMinorScopeCount,
  siteName,
  clientName,
  filterSummary,
  granularity,
  rangeWasClamped,
}: ClientDashboardChartsProps) {

  const granHint = granularity === 'day' ? 'รายวัน' : granularity === 'week' ? 'รายสัปดาห์' : granularity === 'month' ? 'รายเดือน' : 'รายปี'

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* ข้อมูลพื้นฐานเล็กๆ ด้านบนสุด (เหลือไว้เฉพาะที่จำเป็นจริงๆ) */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-semibold text-app-heading">{siteName} <span className="text-app-muted font-normal">| {clientName}</span></h2>
        {rangeWasClamped && <span className="text-[10px] text-amber-500">จำกัดช่วงวันที่แสดงผล</span>}
      </div>

      <WashChartUrlFilter />
      <p className="text-xs text-app-muted -mt-2 px-1">
        เป้าหมายอ้างอิง: ล้างใหญ่ {weeklyWashTargetMajor} เครื่อง/สัปดาห์ • ล้างย่อย {weeklyWashTargetMinor} เครื่อง/สัปดาห์
        <span className="text-app-muted/80">
          {' '}
          (ล้างย่อยนับรวมแอร์+Exhaust เทียบกับเป้าเดียว; บนกราฟปรับตามจำนวนวันในแต่ละช่วง)
        </span>
      </p>
      <p className="text-[11px] text-app-muted/90 px-1 leading-relaxed">
        ขอบเขตนับเครื่องในสาขา: ล้างใหญ่นับเฉพาะ<strong className="text-app-heading font-medium"> แอร์ {washMajorScopeCount} เครื่อง</strong>
        {' · '}
        ล้างย่อยนับ<strong className="text-app-heading font-medium"> แอร์ + Exhaust รวม {washMinorScopeCount} เครื่อง</strong>
        <span className="text-app-muted"> (Exhaust มีเฉพาะล้างย่อย)</span>
      </p>

      <ChartCard
        data={majorSeries}
        actualColor={COLORS.actualMajor}
        title="ล้างใหญ่"
        granHint={granHint}
        filterSummary={filterSummary}
      />

      <MinorWashChartCard data={minorSeries} granHint={granHint} filterSummary={filterSummary} />
    </div>
  )
}